# Contract: Excel/CSV Export

## Purpose
Allow exporting any list page or report to Excel (.xlsx) or CSV with correct Arabic headers.

## Architecture

Server-side generation via API route. Client triggers download.

### Export API Route
**File**: `src/app/api/export/route.ts`

```typescript
export async function POST(request: Request) {
  // 1. getRequiredSessionUser()
  // 2. Parse body: { type, format, filters }
  //    type: "customers" | "contracts" | "installments" | "follow-ups" | "units" | report types
  //    format: "xlsx" | "csv"
  //    filters: { projectId?, search?, ... }
  // 3. Load data using existing query functions
  // 4. Generate file using exceljs (xlsx) or csv-exporter (csv)
  // 5. Return file with appropriate headers:
  //    Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (xlsx)
  //    Content-Type: text/csv; charset=utf-8 (csv)
  //    Content-Disposition: attachment; filename="report-name-2026-03-25.xlsx"
}
```

### Excel Exporter
**File**: `src/features/exports/excel-exporter.ts`

```typescript
import ExcelJS from "exceljs";

type ExportColumn = {
  header: string;  // Arabic header
  key: string;     // data key
  width?: number;
};

export async function generateExcel(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  sheetName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  // Set columns
  sheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 20,
  }));

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { horizontal: "right" };  // RTL
  sheet.views = [{ rightToLeft: true }];  // RTL worksheet

  // Add rows
  rows.forEach(row => sheet.addRow(row));

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
```

### CSV Exporter
**File**: `src/features/exports/csv-exporter.ts`

```typescript
type ExportColumn = {
  header: string;
  key: string;
};

export function generateCsv(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): string {
  const BOM = "\uFEFF";  // UTF-8 BOM for Arabic in Excel
  const headerLine = columns.map(c => escapeCell(c.header)).join(",");
  const dataLines = rows.map(row =>
    columns.map(c => escapeCell(String(row[c.key] ?? ""))).join(",")
  );
  return BOM + [headerLine, ...dataLines].join("\n");
}

function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

### Export Column Definitions
**File**: `src/features/exports/column-definitions.ts`

Central file mapping each export type to its Arabic columns:

```typescript
export const EXPORT_COLUMNS = {
  customers: [
    { header: "اسم العميل", key: "customerName" },
    { header: "رقم الجوال", key: "mobile" },
    { header: "البريد الإلكتروني", key: "email" },
    { header: "المتبقي", key: "outstanding" },
    { header: "الحالة", key: "status" },
  ],
  installments: [
    { header: "العميل", key: "customerName" },
    { header: "العقد", key: "contractCode" },
    { header: "المشروع", key: "projectName" },
    { header: "نوع القسط", key: "installmentType" },
    { header: "تاريخ الاستحقاق", key: "dueDate" },
    { header: "المستحق", key: "amountDue" },
    { header: "المحصل", key: "amountCollected" },
    { header: "المتبقي", key: "amountOutstanding" },
    { header: "الحالة", key: "paymentStatus" },
    { header: "الغرامة", key: "penaltyAmount" },
  ],
  // ... similar for contracts, follow-ups, units, and each report type
};
```

### Export Button Component
**File**: `src/components/ui/export-button.tsx`

```tsx
"use client";

import { useState } from "react";

type ExportButtonProps = {
  exportType: string;
  filters?: Record<string, string>;
  label?: string;
};

export function ExportButton({ exportType, filters, label = "تصدير Excel" }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport(format: "xlsx" | "csv") {
    setLoading(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: exportType, format, filters }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportType}-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        className="rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm font-semibold disabled:opacity-60"
        disabled={loading}
        onClick={() => handleExport("xlsx")}
      >
        {loading ? "جاري التصدير..." : label}
      </button>
      <button
        className="rounded-2xl border border-border/70 bg-background px-4 py-2 text-sm font-semibold disabled:opacity-60"
        disabled={loading}
        onClick={() => handleExport("csv")}
      >
        CSV
      </button>
    </div>
  );
}
```

### Integration
Add `<ExportButton>` to the actions area of `<FilterBar>` on:
- Customers page
- Contracts page
- Installments page
- Follow-ups page
- Units page
- All 8 report pages

### Verification
- Excel file downloads with correct Arabic headers and RTL sheet
- CSV file opens correctly in Excel (Arabic displayed properly with BOM)
- Export respects current page filters
- Empty dataset produces file with headers only
- Loading state prevents double-clicks
- File names include date for easy identification
