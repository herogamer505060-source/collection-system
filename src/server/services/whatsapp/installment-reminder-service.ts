import { toEgyptDateString } from "@/lib/dates/egypt";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/lib/auth/get-session-user";

import { buildInstallmentReminderTemplateParams, sendTemplateWhatsAppMessage } from "./whatsapp-service";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export async function sendInstallmentDueSoonReminders(input: {
  sessionUser?: SessionUser;
  targetDate?: string;
  templateName?: string;
}, client: AdminClient = createAdminSupabaseClient()) {
  const targetDate = input.targetDate ?? getDateAfterDays(7);
  const templateName = input.templateName ?? "installment_due_7d";

  const templateResult = await client
    .from("whatsapp_templates")
    .select("*")
    .eq("template_name", templateName)
    .eq("approval_status", "approved")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (templateResult.error) {
    throw new Error(templateResult.error.message);
  }

  if (!templateResult.data) {
    return { sent: 0, skipped: 0, targetDate, templateFound: false };
  }

  const rowsResult = await client
    .from("installments")
    .select(`
      id,
      amount_due,
      amount_outstanding,
      due_date,
      contract:contracts!inner(
        id,
        contract_code,
        project_id,
        project:projects!inner(id, name_ar),
        customer:customers!inner(id, customer_name, mobile, whatsapp_phone_normalized, whatsapp_opted_out_at)
      )
    `)
    .eq("due_date", targetDate)
    .in("payment_status", ["unpaid", "partial"])
    .gt("amount_outstanding", 0);

  if (rowsResult.error) {
    throw new Error(rowsResult.error.message);
  }

  let sent = 0;
  let skipped = 0;

  for (const row of rowsResult.data ?? []) {
    const contract = row.contract as {
      id: string;
      project_id: string;
      project: { id: string; name_ar: string };
      customer: {
        id: string;
        customer_name: string;
        mobile: string | null;
        whatsapp_phone_normalized: string | null;
        whatsapp_opted_out_at: string | null;
      };
    };

    if (contract.customer.whatsapp_opted_out_at) {
      skipped += 1;
      continue;
    }

    if (!contract.customer.mobile && !contract.customer.whatsapp_phone_normalized) {
      skipped += 1;
      continue;
    }

    try {
      const result = await sendTemplateWhatsAppMessage(
        {
          contractId: contract.id,
          customerId: contract.customer.id,
          installmentId: row.id,
          languageCode: templateResult.data.language_code,
          messagePurpose: "installment_due_7d",
          projectId: contract.project_id,
          sessionUser: input.sessionUser,
          templateName: templateResult.data.template_name,
          templateParams: buildInstallmentReminderTemplateParams({
            amountDue: Number(row.amount_outstanding ?? row.amount_due ?? 0),
            customerName: contract.customer.customer_name,
            dueDate: toEgyptDateString(row.due_date),
            projectName: contract.project.name_ar,
          }),
        },
        client,
      );

      if (!result.deduped) {
        sent += 1;
      } else {
        skipped += 1;
      }
    } catch {
      skipped += 1;
    }
  }

  return {
    sent,
    skipped,
    targetDate,
    templateFound: true,
  };
}

function getDateAfterDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
