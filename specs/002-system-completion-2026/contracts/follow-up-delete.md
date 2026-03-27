# Contract: Follow-up Delete

## Purpose
Allow authorized users to delete incorrectly created follow-up records.

## Files to Modify

### 1. Service Addition
**File**: `src/server/services/follow-ups-service.ts`

Add `deleteFollowUp()` function following existing patterns:

```typescript
type DeleteFollowUpDependencies = {
  getFollowUpById: typeof getFollowUpById;
  listContractsByCustomerId: typeof listContractsByCustomerId;
  deleteFollowUpRow: typeof deleteFollowUpRow;
};

export async function deleteFollowUp(
  input: {
    followUpId: string;
    sessionUser: SessionUser;
  },
  dependencies: DeleteFollowUpDependencies = {
    getFollowUpById,
    listContractsByCustomerId,
    deleteFollowUpRow,
  },
): Promise<{ id: string }> {
  // 1. Fetch follow-up by ID → notFound if missing
  // 2. Resolve project ID for permission check
  // 3. assertCanUpdateFollowUp (same permission as update)
  // 4. Hard delete the row
  // 5. Return { id }
}
```

Add the DB function:
```typescript
async function deleteFollowUpRow(
  followUpId: string,
  client: AdminClient = createAdminSupabaseClient(),
): Promise<void> {
  const { error } = await client.from("follow_ups").delete().eq("id", followUpId);
  if (error) {
    throw new Error(error.message);
  }
}
```

### 2. API Route Addition
**File**: `src/app/api/follow-ups/[followUpId]/route.ts`

Add DELETE handler to existing file:

```typescript
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ followUpId: string }> },
) {
  // 1. getRequiredSessionUser()
  // 2. Call deleteFollowUp({ followUpId, sessionUser })
  // 3. Record audit event (action: "follow_up.deleted")
  // 4. Return Response.json({ success: true })
}
```

### 3. Delete Button Component
**File**: `src/components/follow-ups/follow-up-delete-button.tsx`

Client component with confirmation dialog:

```tsx
"use client";

// useState for showConfirm, useTransition for delete action
// On click: show confirmation dialog (Arabic text)
// On confirm: fetch(`/api/follow-ups/${followUpId}`, { method: "DELETE" })
// On success: router.refresh()
```

Confirmation text:
- Title: "حذف المتابعة"
- Message: "هل أنت متأكد من حذف هذه المتابعة؟ لا يمكن التراجع عن هذا الإجراء."
- Confirm button: "حذف" (red/destructive)
- Cancel button: "إلغاء"

### 4. Integration
- Add delete button to follow-up rows in:
  - `src/components/follow-ups/follow-ups-table.tsx`
  - `src/components/customers/customer-follow-up-history.tsx`
- Only show for users who have permission (same as edit permission)

### Verification
- Admin can delete any follow-up
- Manager can delete any follow-up
- Collector can delete own follow-ups only
- Viewer cannot see delete button
- Confirmation dialog appears before deletion
- Deleted follow-up no longer appears in lists
- Audit log records the deletion
