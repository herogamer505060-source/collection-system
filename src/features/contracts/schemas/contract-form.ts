import { z } from "zod";

export const updateContractSchema = z.object({
  collectorUserId: z.string().uuid("معرف المحصل غير صالح").nullable().optional(),
  contractNotes: z.string().trim().nullable().optional(),
  contractStatus: z.enum(["active", "closed", "cancelled", "suspended"]).optional(),
  deliveryDate: z.string().nullable().optional(),
});

export type UpdateContractInput = z.infer<typeof updateContractSchema>;
