# Contract: Contract Editing

## Purpose
Allow admin/manager to edit contract details: notes, delivery date, collector assignment, and status.

## Files to Create

### 1. Zod Schema
**File**: `src/features/contracts/schemas/contract-form.ts`

```typescript
import { z } from "zod";

export const updateContractSchema = z.object({
  collectorUserId: z.string().uuid("معرف المحصل غير صالح").nullable().optional(),
  contractNotes: z.string().trim().nullable().optional(),
  contractStatus: z.enum(["active", "closed", "cancelled", "suspended"]).optional(),
  deliveryDate: z.string().nullable().optional(),
});

export type UpdateContractInput = z.infer<typeof updateContractSchema>;
```

### 2. Service
**File**: `src/server/services/contracts-service.ts`

Pattern: follow `customers-service.ts` exactly.

```typescript
export async function updateContract(input: {
  contractId: string;
  payload: UpdateContractInput;
  sessionUser: SessionUser;
}) {
  // 1. requireAdminOrManager(input.sessionUser)
  // 2. Parse with updateContractSchema
  // 3. Fetch existing contract by ID
  // 4. Build update payload (only changed fields)
  // 5. Update via supabase admin client
  // 6. Return updated contract
}
```

### 3. API Route
**File**: `src/app/api/contracts/[contractId]/route.ts`

Pattern: follow `api/customers/[customerId]/route.ts`.

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
) {
  // 1. getRequiredSessionUser()
  // 2. Parse JSON body
  // 3. Call updateContract()
  // 4. Record audit event
  // 5. Return JSON response
}
```

### 4. Edit Form Component
**File**: `src/components/contracts/contract-edit-form.tsx`

Pattern: follow `customer-edit-form.tsx` exactly (useState + useTransition + fetch).

Fields:
- ملاحظات العقد (textarea) → `contractNotes`
- تاريخ التسليم (date input) → `deliveryDate`
- المحصل المسؤول (select from profiles) → `collectorUserId`
- حالة العقد (select: نشط/مغلق/ملغي/معلق) → `contractStatus`

Arabic select options:
```
active → "نشط"
closed → "مغلق"
cancelled → "ملغي"
suspended → "معلق"
```

### 5. Integration in Contract Detail Page
**File**: `src/app/(dashboard)/contracts/[contractId]/page.tsx`

- Add edit button (visible only to admin/manager)
- Toggle between view and edit mode
- Pass current contract values as `initialValues`
- Pass profiles list for collector dropdown

### Verification
- Admin can edit all fields and see changes persist
- Manager can edit all fields and see changes persist
- Collector sees no edit button
- API returns 403 for collector/viewer roles
- Collector dropdown shows profile names, not UUIDs
