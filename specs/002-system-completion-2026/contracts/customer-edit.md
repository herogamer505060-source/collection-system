# Contract: Customer Notes & Edit

## Purpose
Display customer notes on the profile page and restrict editing to admin/manager roles.

## Status: Partially Built
- `CustomerEditForm` component ✅ exists
- `updateCustomer()` service ✅ exists
- Customer update API route ✅ exists
- Customer update Zod schema ✅ exists

## Remaining Work

### 1. Notes Display on Profile Page
**File**: `src/app/(dashboard)/customers/[customerId]/page.tsx`

Display the `notes` field prominently on the customer profile page below the customer name/contact section.

```tsx
{customer.notes && (
  <div className="rounded-[1.75rem] border border-border/70 bg-white/80 p-5">
    <h3 className="font-display text-lg font-bold text-foreground">ملاحظات</h3>
    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
  </div>
)}
```

### 2. Role Restriction on Edit
**File**: `src/server/services/customers-service.ts`

Add admin/manager check before the existing `requirePermission` call:

```typescript
// Add at the top of updateCustomer():
const isAdminOrManager = input.sessionUser.roles.some(
  (a) => a.role === "admin" || a.role === "manager"
);
if (!isAdminOrManager) {
  throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
}
```

### 3. Conditional Edit Button in UI
**File**: `src/app/(dashboard)/customers/[customerId]/page.tsx`

Only show the edit button/form if the session user is admin or manager:

```tsx
const canEdit = sessionUser.roles.some(
  (a) => a.role === "admin" || a.role === "manager"
);
// Pass canEdit to the component that renders the edit button
```

### Verification
- Notes display on customer profile for all roles
- Edit button visible only for admin/manager
- Collector/viewer cannot see edit button
- Direct API call from collector returns 403
