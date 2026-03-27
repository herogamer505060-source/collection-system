# Contract: Collector Name Display

## Purpose
Replace raw UUID strings with human-readable collector names wherever `collector_user_id` is displayed.

## Affected Files
- `src/components/follow-ups/follow-ups-table.tsx` — add "المحصل" column
- `src/components/contracts/contracts-table.tsx` — add "المحصل" column
- `src/server/queries/follow-ups/get-follow-ups-list.ts` — pass profiles map to rows
- `src/server/queries/contracts/get-contracts-list.ts` — pass profiles map to rows

## Implementation Contract

### Input
- `data.profiles` from `ReadModelData` (already loaded)
- `collector_user_id` field on `follow_ups` and `contracts` tables

### Resolution Logic
```typescript
const profilesMap = new Map(data.profiles.map(p => [p.id, p.full_name]));
// For each row:
const collectorName = row.collector_user_id
  ? (profilesMap.get(row.collector_user_id) ?? row.collector_user_id)
  : "—";
```

### Output
- Each table row includes a `collectorName: string` field
- Displayed in a table column with header "المحصل"

### Edge Cases
- `collector_user_id` is null → display "—"
- `collector_user_id` exists but profile was deleted → display the UUID as fallback
- `profiles` table is empty → all collectors show UUID

### Verification
- Follow-ups list shows collector names instead of UUIDs
- Contracts list shows collector names instead of UUIDs
- No runtime errors when profiles table is empty
