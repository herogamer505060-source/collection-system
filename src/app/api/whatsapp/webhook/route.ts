import crypto from "node:crypto";

import { getWhatsAppEnv } from "@/lib/integrations/whatsapp-env";
import {
  processWebhookPayload,
  storeWebhookEvent,
  verifyWhatsAppSignature,
} from "@/server/services/whatsapp/whatsapp-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const env = getWhatsAppEnv();

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return Response.json(
    { error: { code: "forbidden", message: "Webhook verification failed" } },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const isValid = await verifyWhatsAppSignature({ body: rawBody, signatureHeader: signature });

  if (!isValid) {
    return Response.json(
      { error: { code: "forbidden", message: "Invalid webhook signature" } },
      { status: 403 },
    );
  }

  const payload = JSON.parse(rawBody);
  const changes = Array.isArray(payload?.entry)
    ? payload.entry.flatMap((entry: { changes?: unknown[] }) => entry.changes ?? [])
    : [];

  for (const change of changes) {
    const value = (change as { value?: Record<string, unknown> }).value ?? {};
    const statuses = Array.isArray(value.statuses) ? value.statuses : [];
    const messages = Array.isArray(value.messages) ? value.messages : [];

    for (const status of statuses) {
      const id = typeof (status as { id?: unknown }).id === "string" ? (status as { id: string }).id : "unknown";
      const state =
        typeof (status as { status?: unknown }).status === "string"
          ? (status as { status: string }).status
          : "unknown";
      await storeWebhookEvent({
        customerWaId:
          typeof (status as { recipient_id?: unknown }).recipient_id === "string"
            ? (status as { recipient_id: string }).recipient_id
            : null,
        eventTimestamp:
          typeof (status as { timestamp?: unknown }).timestamp === "string"
            ? new Date(Number((status as { timestamp: string }).timestamp) * 1000).toISOString()
            : null,
        eventType: "message_status",
        headers: Object.fromEntries(request.headers.entries()),
        metaMessageId: id,
        payload: status,
        providerEventKey: `${id}:${state}:${(status as { timestamp?: string }).timestamp ?? ""}`,
      });
    }

    for (const message of messages) {
      const providerEventKey =
        typeof (message as { id?: unknown }).id === "string"
          ? (message as { id: string }).id
          : crypto.randomUUID();
      await storeWebhookEvent({
        customerWaId:
          typeof (message as { from?: unknown }).from === "string"
            ? (message as { from: string }).from
            : null,
        eventTimestamp:
          typeof (message as { timestamp?: unknown }).timestamp === "string"
            ? new Date(Number((message as { timestamp: string }).timestamp) * 1000).toISOString()
            : null,
        eventType: "inbound_message",
        headers: Object.fromEntries(request.headers.entries()),
        metaMessageId:
          typeof (message as { id?: unknown }).id === "string"
            ? (message as { id: string }).id
            : null,
        payload: message,
        providerEventKey,
      });
    }
  }

  await processWebhookPayload(payload);
  return Response.json({ received: true });
}
