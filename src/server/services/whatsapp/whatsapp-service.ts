import crypto from "node:crypto";

import { recordAuditEvent } from "@/lib/auth/audit-log";
import { badRequest, notFound } from "@/lib/errors/api-error";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getWhatsAppEnv } from "@/lib/integrations/whatsapp-env";
import type { SessionUser } from "@/lib/auth/get-session-user";
import type { Json, Tables, TablesInsert } from "@/types/database";

import { normalizeWhatsAppPhone } from "./normalize-whatsapp-phone";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

type TemplateParameter = {
  type: "text";
  text: string;
};

export async function sendTemplateWhatsAppMessage(input: {
  customerId: string;
  messagePurpose: "installment_due_7d" | "manual_follow_up" | "other";
  projectId: string;
  sessionUser?: SessionUser;
  contractId?: string | null;
  followUpId?: string | null;
  installmentId?: string | null;
  languageCode?: string;
  templateName: string;
  templateParams?: TemplateParameter[];
}, client: AdminClient = createAdminSupabaseClient()) {
  const env = getWhatsAppEnv();
  const customer = await getCustomerById(input.customerId, client);

  if (!customer) {
    throw notFound("تعذر العثور على العميل المطلوب");
  }

  const toPhoneNormalized = normalizeWhatsAppPhone(
    customer.whatsapp_phone_normalized ?? customer.mobile,
  );

  if (!toPhoneNormalized) {
    throw badRequest("لا يوجد رقم واتساب صالح لهذا العميل");
  }

  const dedupeKey = buildMessageDedupeKey({
    contractId: input.contractId,
    customerId: input.customerId,
    followUpId: input.followUpId,
    installmentId: input.installmentId,
    messagePurpose: input.messagePurpose,
    templateName: input.templateName,
  });

  const existing = await client
    .from("whatsapp_messages")
    .select("id, status")
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data && ["queued", "sending", "sent", "delivered", "read"].includes(existing.data.status)) {
    return { deduped: true, messageId: existing.data.id };
  }

  const insertResult = await client
    .from("whatsapp_messages")
    .insert({
      contract_id: input.contractId ?? null,
      created_by: input.sessionUser?.id ?? null,
      customer_id: input.customerId,
      dedupe_key: dedupeKey,
      direction: "outbound",
      follow_up_id: input.followUpId ?? null,
      installment_id: input.installmentId ?? null,
      message_kind: "template",
      message_purpose: input.messagePurpose,
      project_id: input.projectId,
      provider_request: {
        languageCode: input.languageCode ?? "ar",
        templateName: input.templateName,
      },
      scheduled_for: new Date().toISOString(),
      status: "sending",
      template_params: input.templateParams ?? [],
      to_phone: customer.mobile ?? null,
      to_phone_normalized: toPhoneNormalized,
    })
    .select("*")
    .single();

  if (insertResult.error || !insertResult.data) {
    throw new Error(insertResult.error?.message ?? "تعذر إنشاء سجل رسالة واتساب");
  }

  const payload = {
    messaging_product: "whatsapp",
    to: toPhoneNormalized,
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.languageCode ?? "ar" },
      ...(input.templateParams && input.templateParams.length > 0
        ? { components: [{ parameters: input.templateParams, type: "body" }] }
        : {}),
    },
  };

  const response = await fetch(
    `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    await client
      .from("whatsapp_messages")
      .update({
        failed_at: new Date().toISOString(),
        last_attempt_at: new Date().toISOString(),
        last_error_code: responseBody?.error?.code ? String(responseBody.error.code) : response.status.toString(),
        last_error_message: responseBody?.error?.message ?? "Meta API request failed",
        provider_response: responseBody,
        status: "failed",
      })
      .eq("id", insertResult.data.id);

    throw new Error(responseBody?.error?.message ?? "تعذر إرسال رسالة واتساب");
  }

  const metaMessageId = responseBody?.messages?.[0]?.id ?? null;
  const waId = responseBody?.contacts?.[0]?.wa_id ?? null;

  await client
    .from("whatsapp_messages")
    .update({
      customer_wa_id: waId,
      last_attempt_at: new Date().toISOString(),
      meta_message_id: metaMessageId,
      provider_response: responseBody,
      sent_at: new Date().toISOString(),
      status: "sent",
    })
    .eq("id", insertResult.data.id);

  recordAuditEvent({
    action: "whatsapp.send_template",
    actorId: input.sessionUser?.id ?? null,
    entityId: insertResult.data.id,
    entityType: "whatsapp_message",
    metadata: {
      customerId: input.customerId,
      messagePurpose: input.messagePurpose,
      templateName: input.templateName,
      toPhoneNormalized,
    },
  });

  return { deduped: false, messageId: insertResult.data.id, metaMessageId };
}

export async function storeWebhookEvent(input: {
  customerWaId?: string | null;
  eventTimestamp?: string | null;
  eventType: "inbound_message" | "message_status" | "template_status" | "unknown";
  headers: Record<string, string>;
  metaMessageId?: string | null;
  payload: unknown;
  providerEventKey: string;
  projectId?: string | null;
}, client: AdminClient = createAdminSupabaseClient()) {
  const eventRow: TablesInsert<"whatsapp_webhook_events"> = {
    customer_wa_id: input.customerWaId ?? null,
    event_timestamp: input.eventTimestamp ?? null,
    event_type: input.eventType,
    headers_json: input.headers,
    meta_message_id: input.metaMessageId ?? null,
    payload: input.payload as Json,
    project_id: input.projectId ?? null,
    provider_event_key: input.providerEventKey,
  };

  const { data, error } = await client
    .from("whatsapp_webhook_events")
    .insert(eventRow)
    .select("*")
    .maybeSingle();

  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function processWebhookPayload(payload: unknown, client: AdminClient = createAdminSupabaseClient()) {
  const changes = Array.isArray((payload as { entry?: Array<{ changes?: unknown[] }> })?.entry)
    ? (payload as { entry: Array<{ changes?: unknown[] }> }).entry.flatMap((entry) => entry.changes ?? [])
    : [];

  for (const change of changes) {
    const value = (change as { value?: Record<string, unknown> }).value ?? {};
    const statuses = Array.isArray(value.statuses) ? value.statuses : [];
    const messages = Array.isArray(value.messages) ? value.messages : [];

    for (const status of statuses) {
      const metaMessageId = typeof status.id === "string" ? status.id : null;
      if (!metaMessageId) continue;
      const nextStatus = typeof status.status === "string" ? status.status : "unknown";
      await client
        .from("whatsapp_messages")
        .update(mapProviderStatusToUpdate(nextStatus))
        .eq("meta_message_id", metaMessageId);
    }

    for (const _message of messages) {
      // Inbound message persistence is intentionally deferred until customer mapping is implemented.
      // Raw webhook payload is already persisted in whatsapp_webhook_events.
      void _message;
    }
  }
}

export async function verifyWhatsAppSignature(input: {
  body: string;
  signatureHeader: string | null;
}): Promise<boolean> {
  const env = getWhatsAppEnv();

  if (!env.WHATSAPP_APP_SECRET) {
    return true;
  }

  if (!input.signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", env.WHATSAPP_APP_SECRET)
    .update(input.body)
    .digest("hex");

  const actual = input.signatureHeader.replace("sha256=", "");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export function buildInstallmentReminderTemplateParams(input: {
  amountDue: number;
  customerName: string;
  dueDate: string;
  projectName: string;
}) {
  return [
    { text: input.customerName, type: "text" as const },
    { text: input.projectName, type: "text" as const },
    { text: input.dueDate, type: "text" as const },
    { text: String(input.amountDue), type: "text" as const },
  ];
}

function buildMessageDedupeKey(input: {
  contractId?: string | null;
  customerId: string;
  followUpId?: string | null;
  installmentId?: string | null;
  messagePurpose: string;
  templateName: string;
}) {
  return [
    input.messagePurpose,
    input.customerId,
    input.contractId ?? "",
    input.installmentId ?? "",
    input.followUpId ?? "",
    input.templateName,
  ].join(":");
}

async function getCustomerById(customerId: string, client: AdminClient): Promise<Tables<"customers"> | null> {
  const { data, error } = await client.from("customers").select("*").eq("id", customerId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function mapProviderStatusToUpdate(status: string) {
  const timestamp = new Date().toISOString();
  switch (status) {
    case "delivered":
      return { delivered_at: timestamp, status: "delivered" as const };
    case "read":
      return { read_at: timestamp, status: "read" as const };
    case "failed":
      return { failed_at: timestamp, status: "failed" as const };
    default:
      return { status: "sent" as const };
  }
}
