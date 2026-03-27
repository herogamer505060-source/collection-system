import type { ImportIssueType, MapImportIssueInput } from "@/features/imports/types";

type MessageBuilder = (input: MapImportIssueInput & { rawValueText: string | null }) => string;

const ISSUE_MESSAGE_BUILDERS: Record<ImportIssueType, MessageBuilder> = {
  unknown_project: ({ rawValueText }) => `اسم المشروع غير معروف: ${rawValueText ?? "بدون قيمة"}`,
  invalid_customer_name: ({ rawValueText }) => `اسم العميل غير صالح: ${rawValueText ?? "بدون قيمة"}`,
  invalid_date: ({ fieldLabel, rawValueText }) =>
    fieldLabel
      ? `تعذر قراءة التاريخ في ${fieldLabel}: ${rawValueText ?? "بدون قيمة"}`
      : `تعذر قراءة التاريخ: ${rawValueText ?? "بدون قيمة"}`,
  invalid_installment_code: ({ rawValueText }) => `كود القسط غير صالح: ${rawValueText ?? "بدون قيمة"}`,
  invalid_money: ({ fieldLabel, rawValueText }) =>
    fieldLabel
      ? `تعذر قراءة القيمة المالية في ${fieldLabel}: ${rawValueText ?? "بدون قيمة"}`
      : `تعذر قراءة القيمة المالية: ${rawValueText ?? "بدون قيمة"}`,
  invalid_number: ({ fieldLabel, rawValueText }) =>
    fieldLabel
      ? `تعذر قراءة الرقم في ${fieldLabel}: ${rawValueText ?? "بدون قيمة"}`
      : `تعذر قراءة الرقم: ${rawValueText ?? "بدون قيمة"}`,
  invalid_unit_code: ({ rawValueText }) => `كود الوحدة غير صالح: ${rawValueText ?? "بدون قيمة"}`,
  missing_required_field: ({ fieldLabel }) => `الحقل المطلوب مفقود: ${fieldLabel ?? "قيمة مطلوبة"}`,
  duplicate_business_key: ({ rawValueText }) =>
    `يوجد صف مكرر بنفس المفتاح التشغيلي: ${rawValueText ?? "بدون قيمة"}`,
  duplicate_unit_status: ({ rawValueText }) =>
    `الوحدة ${rawValueText ?? "بدون قيمة"} ظهرت كمباعة ومتاحة في نفس الوقت`,
  unmatched_unit: ({ rawValueText }) => `تعذر مطابقة الوحدة ${rawValueText ?? "بدون قيمة"} مع ملف الوحدات`,
};

export function getImportIssueMessageAr(
  input: MapImportIssueInput & { rawValueText: string | null },
): string {
  return ISSUE_MESSAGE_BUILDERS[input.issueType](input);
}
