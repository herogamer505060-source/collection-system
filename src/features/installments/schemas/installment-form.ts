import { z } from "zod";

export const updateInstallmentSchema = z.object({
  amountCollected: z.number().min(0, "المبلغ المحصل يجب أن يكون صفر أو أكثر").optional(),
  paymentDate: z.string().nullable().optional(),
  penaltyAmount: z.number().min(0, "الغرامة يجب أن تكون صفر أو أكثر").nullable().optional(),
  receiptReference: z.string().trim().nullable().optional(),
});

export type UpdateInstallmentInput = z.infer<typeof updateInstallmentSchema>;
