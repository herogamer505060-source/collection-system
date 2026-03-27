# API Contracts: Collections Management MVP

**Feature**: 001-collections-mvp
**Date**: 2026-03-23

## Shared Conventions

- Authentication: Supabase Auth session required for every route.
- Authorization:
  - `admin`: all routes
  - `manager`: all import and follow-up routes, read access to all data
  - `collector`: read assigned data, create and edit own follow-ups only
  - `viewer`: read-only routes only
- Dates use ISO 8601 strings.
- Money values are decimal JSON numbers rendered with Egyptian Pound formatting in the UI.
- Import issue messages are returned in Arabic with Western digits.
- Standard error shape:

```json
{
  "error": {
    "code": "forbidden",
    "message": "ليس لديك صلاحية لتنفيذ هذا الإجراء"
  }
}
```

## Import Routes

### POST /api/imports/upload
Upload one Excel file and create an import batch plus import file record.

**Auth**: `admin`, `manager`

**Request**: `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| file | binary | yes | `.xlsx` file |
| importType | string | yes | `installments` \| `sold_units` \| `available_units` |

Phase 1 note:
- Detailed contract enrichment is deferred to Phase 2 and is not accepted by the Phase 1 upload contract.

**Response 201**:

```json
{
  "batchId": "uuid",
  "fileId": "uuid",
  "fileName": "Rep_REI006 (5).xlsx",
  "importType": "installments",
  "status": "uploaded"
}
```

### POST /api/imports/{batchId}/preview
Parse, normalize, validate, and match an uploaded file without committing business data.

**Auth**: `admin`, `manager`

**Response 200**:

```json
{
  "batchId": "uuid",
  "status": "ready_for_review",
  "detectedColumns": ["المشروع", "Customer", "كود الوحدة", "كود القسط"],
  "counts": {
    "totalRows": 150,
    "validRows": 142,
    "skippedRows": 5,
    "issueRows": 8
  },
  "sampleRows": [
    {
      "sourceRowNumber": 12,
      "project": "IL Parco",
      "customerName": "عميل تجريبي",
      "unitCode": "B28+B29",
      "amountDue": 50000
    }
  ],
  "issues": [
    {
      "id": "uuid",
      "severity": "high",
      "issueType": "unknown_project",
      "rawValue": "IL Parko",
      "messageAr": "اسم المشروع غير معروف: IL Parko",
      "sourceRowNumber": 45
    }
  ],
  "changeSummary": {
    "customersToCreate": 5,
    "customersToMatch": 80,
    "contractsToCreate": 3,
    "contractsToUpdate": 1,
    "installmentsToCreate": 22,
    "installmentsToUpdate": 120,
    "linksToCreate": 6
  }
}
```

### POST /api/imports/{batchId}/approve
Commit a previewed batch and execute insert/update/preserve behavior.

**Auth**: `admin`, `manager`

**Response 200**:

```json
{
  "batchId": "uuid",
  "status": "approved",
  "summary": {
    "created": 25,
    "updated": 120,
    "skipped": 5,
    "issues": 8
  },
  "approvedAt": "2026-03-23T14:30:00Z"
}
```

Notes:
- Follow-ups, promise-to-pay data, collector assignments, and manual operational notes are preserved.
- Source-owned financial and contractual fields are updated automatically.

### POST /api/imports/{batchId}/reject
Reject a previewed batch without applying changes.

**Auth**: `admin`, `manager`

**Request**:

```json
{
  "reason": "تم اكتشاف ملف خاطئ"
}
```

**Response 200**:

```json
{
  "batchId": "uuid",
  "status": "rejected"
}
```

### GET /api/imports/{batchId}
Return one batch with files, counts, summary, and issues for the import details screen.

**Auth**: `admin`, `manager`, `viewer`

**Response 200**:

```json
{
  "batchId": "uuid",
  "batchType": "installments",
  "status": "approved_with_issues",
  "counts": {
    "rowsTotal": 150,
    "rowsValid": 142,
    "rowsImported": 137,
    "rowsUpdated": 120,
    "rowsSkipped": 5,
    "issueCount": 8
  },
  "files": [
    {
      "fileId": "uuid",
      "fileName": "Rep_REI006 (5).xlsx",
      "sheetName": "report"
    }
  ],
  "issues": [
    {
      "id": "uuid",
      "severity": "high",
      "issueType": "duplicate_unit_status",
      "messageAr": "الوحدة B21 ظهرت كمباعة ومتاحة في نفس الوقت"
    }
  ]
}
```

## Follow-Up Routes

### POST /api/follow-ups
Create a follow-up for a customer and optionally a specific contract.

**Auth**: `admin`, `manager`, `collector`

**Request**:

```json
{
  "customerId": "uuid",
  "contractId": "uuid",
  "followUpDate": "2026-03-23T10:00:00Z",
  "contactType": "call",
  "note": "تم التواصل وتم الاتفاق على السداد الأسبوع القادم",
  "customerResponse": "سيحول المبلغ يوم الخميس",
  "promisedToPay": true,
  "promiseDate": "2026-03-27",
  "nextActionDate": "2026-03-28",
  "collectorUserId": "uuid"
}
```

**Response 201**:

```json
{
  "id": "uuid",
  "customerId": "uuid",
  "contractId": "uuid",
  "followUpDate": "2026-03-23T10:00:00Z",
  "contactType": "call",
  "note": "تم التواصل وتم الاتفاق على السداد الأسبوع القادم",
  "followUpStatus": "open",
  "createdBy": "uuid"
}
```

### PATCH /api/follow-ups/{followUpId}
Update an existing follow-up. Deletion is not supported.

**Auth**: `admin`, `manager`, `collector` (own follow-ups only)

**Request**:

```json
{
  "note": "تأكيد جديد من العميل",
  "customerResponse": "سيتم السداد غدا",
  "promisedToPay": true,
  "promiseDate": "2026-03-28",
  "nextActionDate": "2026-03-29",
  "followUpStatus": "done"
}
```

**Response 200**:

```json
{
  "id": "uuid",
  "followUpStatus": "done",
  "updatedAt": "2026-03-23T12:00:00Z"
}
```

## Admin User Routes

### POST /api/admin/users
Create a user account and assign an application role.

**Auth**: `admin`

**Request**:

```json
{
  "email": "collector@example.com",
  "fullName": "موظف التحصيل",
  "role": "collector",
  "defaultProjectId": "uuid",
  "temporaryPassword": "TempPass123!"
}
```

**Response 201**:

```json
{
  "userId": "uuid",
  "profileId": "uuid",
  "role": "collector",
  "isActive": true
}
```

### PATCH /api/admin/users/{userId}
Update role assignment or activation state.

**Auth**: `admin`

**Request**:

```json
{
  "role": "manager",
  "defaultProjectId": "uuid",
  "isActive": true
}
```

**Response 200**:

```json
{
  "userId": "uuid",
  "role": "manager",
  "isActive": true
}
```

## Dashboard Route

### GET /api/dashboard/kpis?projectId={uuid}
Return dashboard aggregates, ranked debtors, recent follow-ups, and the last successful import timestamp.

**Auth**: all authenticated roles (scope filtered by role)

**Response 200**:

```json
{
  "totalDue": 15000000,
  "totalCollected": 8500000,
  "totalOutstanding": 6500000,
  "totalOverdue": 3200000,
  "totalPenalties": 150000,
  "collectionPercentage": 56.67,
  "customersPaid": 45,
  "customersUnpaid": 30,
  "customersOverdue": 25,
  "openPromises": 12,
  "topOverdueCustomers": [
    {
      "customerId": "uuid",
      "customerName": "عميل متأخر",
      "projectName": "IL Parco",
      "totalOverdue": 500000,
      "lastFollowUpDate": "2026-03-20"
    }
  ],
  "recentFollowUps": [
    {
      "id": "uuid",
      "customerName": "عميل",
      "followUpDate": "2026-03-23",
      "summary": "تم الاتفاق على السداد"
    }
  ],
  "lastImportAt": "2026-03-22T16:00:00Z"
}
```

## Server Query Contracts

Read-heavy pages are rendered through server components and typed query services rather than public REST endpoints. Query services must support:

- Customers list: search by partial Arabic name, filter by project and payment status, paginate after 50 rows.
- Customer profile: contracts, units, installments, follow-ups, promise-to-pay context, aggregate totals.
- Contracts list/detail: customer, project, units, due/collected/outstanding totals, follow-ups.
- Installments list: payment status, delay days, due date, contract/customer context.
- Units list: project/status filters, sold unit contract linkage, conflict badge for bad source data.
- Follow-ups list: collector, date range, follow-up status, promise-to-pay filters.
- Import batches list: newest first with status, row counts, issue count, uploader, and last update.
