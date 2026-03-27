import { z } from "zod";

export const updateCustomerSchema = z.object({
  customerName: z.string().trim().min(1, "اسم العميل مطلوب").optional(),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").nullable().optional(),
  mobile: z.string().trim().nullable().optional(),
  nationalId: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
