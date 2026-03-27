# Contract: Installment Payment Recording & Edit

## Purpose
Allow admin/manager to record payments against installments with automatic recalculation of derived fields.

## Files to Create

### 1. Zod Schema
**File**: `src/features/installments/schemas/installment-form.ts`

```typescript
import { z } from "zod";

export const updateInstallmentSchema = z.object({
  amountCollected: z.number().min(0, "المبلغ المحصل يجب أن يكون صفر أو أكثر").optional(),
  paymentDate: z.string().nullable().optional(),
  penaltyAmount: z.number().min(0, "الغرامة يجب أن تكون صفر أو أكثر").nullable().optional(),
  receiptReference: z.string().trim().nullable().optional(),
});

export type UpdateInstallmentInput = z.infer<typeof updateInstallmentSchema>;
```

### 2. Service
**File**: `src/server/services/installments-service.ts`

Critical: recalculate derived fields using existing functions.

```typescript
import { derivePaymentStatus } from "@/features/installments/derive-payment-status";
import { deriveDelayDays } from "@/features/installments/derive-delay-days";
import { deriveDelayBucket } from "@/features/installments/derive-delay-bucket";

export async function updateInstallment(input: {
  installmentId: string;
  payload: UpdateInstallmentInput;
  sessionUser: SessionUser;
}) {
  // 1. requireAdminOrManager(input.sessionUser)
  // 2. Parse with updateInstallmentSchema
  // 3. Fetch existing installment by ID
  // 4. Calculate new values:
  //    amountCollected = parsed.amountCollected ?? existing.amount_collected
  //    amountOutstanding = Math.max(0, existing.amount_due - amountCollected)
  //    paymentStatus = derivePaymentStatus({ amountDue, amountCollected, amountOutstanding, dueDate })
  //    delayDays = deriveDelayDays({ paymentStatus, dueDate })
  //    delayBucket = deriveDelayBucket(delayDays)
  // 5. Build update payload with all recalculated fields
  // 6. Update via supabase admin client
  // 7. Return updated installment
}
```

**Important**: `amount_outstanding` must clamp to zero: `Math.max(0, amount_due - amount_collected)`. If collected exceeds due, outstanding = 0, status = "paid".

### 3. API Route
**File**: `src/app/api/installments/[installmentId]/route.ts`

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ installmentId: string }> },
) {
  // Standard pattern: session → parse → service → audit → response
}
```

### 4. Edit Form Component
**File**: `src/components/installments/installment-edit-form.tsx`

Pattern: `useState` + `useTransition` + `fetch()`.

Fields:
- المبلغ المحصل (number input) → `amountCollected`
- تاريخ الدفع (date input) → `paymentDate`
- مرجع الإيصال (text input) → `receiptReference`
- الغرامة (number input) → `penaltyAmount`

Display (read-only, for context):
- المستحق: `amount_due` (formatted currency)
- المتبقي: recalculated live in UI

### 5. Integration in Installments Page
**File**: `src/app/(dashboard)/installments/page.tsx`

- Add edit action button per row (visible only to admin/manager)
- Open edit form in a modal or inline panel
- After save, refresh the page data

### Verification
- Partial payment: collected < due → status "جزئي", outstanding > 0
- Full payment: collected >= due → status "مدفوع", outstanding = 0
- Overdue reset: overdue installment fully paid → delay_days = 0, delay_bucket = "not_due"
- Negative amount rejected by Zod validation
- Penalty amount persisted and visible in dashboard KPIs
- Only admin/manager can access the edit form
