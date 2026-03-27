import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "يجب إدخال التاريخ بصيغة صحيحة");
const isoDateTimeSchema = z.string().datetime({ offset: true, message: "يجب إدخال تاريخ ووقت صالحين" });
const entityIdSchema = z.string().trim().min(1, "يجب تحديد الكيان المطلوب");

export const contactTypeSchema = z.enum(["call", "whatsapp", "meeting", "email", "other"]);
export const followUpStatusSchema = z.enum(["open", "done", "missed"]);

export const createFollowUpSchema = z
  .object({
    collectorUserId: entityIdSchema.nullable().optional(),
    contactType: contactTypeSchema,
    contractId: entityIdSchema.nullable().optional(),
    customerId: entityIdSchema,
    customerResponse: z.string().trim().min(1).nullable().optional(),
    followUpDate: isoDateTimeSchema,
    nextActionDate: isoDateSchema.nullable().optional(),
    note: z.string().trim().min(1, "يجب إدخال ملاحظة المتابعة"),
    promiseDate: isoDateSchema.nullable().optional(),
    promisedToPay: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.promisedToPay && !value.promiseDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب تحديد تاريخ الوعد عند تفعيل وعد السداد",
        path: ["promiseDate"],
      });
    }

    if (!value.promisedToPay && value.promiseDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "لا يمكن تحديد تاريخ وعد بدون تفعيل وعد السداد",
        path: ["promiseDate"],
      });
    }
  });

export const updateFollowUpSchema = z
  .object({
    collectorUserId: entityIdSchema.nullable().optional(),
    customerResponse: z.string().trim().min(1).nullable().optional(),
    followUpStatus: followUpStatusSchema.optional(),
    nextActionDate: isoDateSchema.nullable().optional(),
    note: z.string().trim().min(1, "يجب إدخال ملاحظة المتابعة").optional(),
    promiseDate: isoDateSchema.nullable().optional(),
    promisedToPay: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    if (Object.keys(value).length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب إرسال حقل واحد على الأقل للتحديث",
      });
    }

    if (value.promisedToPay === true && !value.promiseDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب تحديد تاريخ الوعد عند تفعيل وعد السداد",
        path: ["promiseDate"],
      });
    }

    if (value.promisedToPay === false && value.promiseDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "لا يمكن تحديد تاريخ وعد بدون تفعيل وعد السداد",
        path: ["promiseDate"],
      });
    }
  });

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
