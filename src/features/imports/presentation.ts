import type { ImportBatchType, ImportIssueSeverity, ImportIssueType } from "@/features/imports/types";

export function getImportBatchTypeLabel(batchType: ImportBatchType): string {
  switch (batchType) {
    case "installments":
      return "ملف الأقساط";
    case "sold_units":
      return "الوحدات المباعة";
    case "available_units":
      return "الوحدات المتاحة";
  }
}

export function getImportStatusLabel(status: string): string {
  switch (status) {
    case "uploaded":
      return "تم الرفع";
    case "processing":
      return "قيد المعالجة";
    case "ready_for_review":
      return "جاهز للمراجعة";
    case "approved":
      return "تم الاعتماد";
    case "approved_with_issues":
      return "اعتماد مع مشكلات";
    case "rejected":
      return "مرفوض";
    case "failed":
      return "فشل";
    default:
      return status;
  }
}

export function getImportStatusVariant(status: string): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (status) {
    case "approved":
      return "success";
    case "approved_with_issues":
      return "warning";
    case "ready_for_review":
      return "info";
    case "rejected":
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export function getImportSeverityLabel(severity: ImportIssueSeverity): string {
  switch (severity) {
    case "high":
      return "عالية";
    case "medium":
      return "متوسطة";
    case "low":
      return "منخفضة";
  }
}

export function getImportSeverityVariant(
  severity: ImportIssueSeverity,
): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (severity) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "info";
  }
}

export function getImportIssueTypeLabel(issueType: ImportIssueType): string {
  switch (issueType) {
    case "unknown_project":
      return "مشروع غير معروف";
    case "invalid_customer_name":
      return "اسم عميل غير صالح";
    case "invalid_date":
      return "تاريخ غير صالح";
    case "invalid_installment_code":
      return "كود قسط غير صالح";
    case "invalid_money":
      return "قيمة مالية غير صالحة";
    case "invalid_number":
      return "رقم غير صالح";
    case "invalid_unit_code":
      return "كود وحدة غير صالح";
    case "missing_required_field":
      return "حقل مطلوب مفقود";
    case "duplicate_business_key":
      return "تكرار مفتاح تشغيلي";
    case "duplicate_unit_status":
      return "تعارض حالة وحدة";
    case "unmatched_unit":
      return "وحدة غير مطابقة";
  }
}
