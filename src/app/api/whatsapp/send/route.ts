import { z } from "zod";

import { recordAuditEvent } from "@/lib/auth/audit-log";
import { getRequiredSessionUser } from "@/lib/auth/get-session-user";
import { apiErrorResponse, invalidRequest, toApiError } from "@/lib/errors/api-error";
import { sendTemplateWhatsAppMessage } from "@/server/services/whatsapp/whatsapp-service";

const templateParamSchema = z.object({
  text: z.string().min(1),
  type: z.literal("text"),
});

const sendWhatsAppSchema = z.object({
  contractId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid(),
  followUpId: z.string().uuid().optional().nullable(),
  installmentId: z.string().uuid().optional().nullable(),
  languageCode: z.string().min(2).optional(),
  messagePurpose: z.enum(["installment_due_7d", "manual_follow_up", "other"]),
  projectId: z.string().uuid(),
  templateName: z.string().min(1),
  templateParams: z.array(templateParamSchema).optional(),
});

export async function POST(request: Request) {
  try {
    const sessionUser = await getRequiredSessionUser();
    const payload = sendWhatsAppSchema.parse(await request.json());
    const isAllowed = sessionUser.roles.some((assignment) =>
      ["admin", "manager", "collector"].includes(assignment.role),
    );

    if (!isAllowed) {
      return Response.json({ error: { code: "forbidden", message: "ليس لديك صلاحية لإرسال واتساب" } }, { status: 403 });
    }

    const result = await sendTemplateWhatsAppMessage({ ...payload, sessionUser });

    recordAuditEvent({
      action: "whatsapp.manual_send",
      actorId: sessionUser.id,
      entityId: result.messageId,
      entityType: "whatsapp_message",
      metadata: {
        customerId: payload.customerId,
        templateName: payload.templateName,
      },
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiErrorResponse(invalidRequest(error.issues[0]?.message ?? "بيانات الرسالة غير صحيحة", error.flatten()));
    }

    return apiErrorResponse(toApiError(error));
  }
}
