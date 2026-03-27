export type CustomerStatus = "all_paid" | "has_outstanding" | "has_overdue";
export type ContractDerivedStatus = "outstanding" | "overdue" | "paid" | "partial";
export type InstallmentPaymentStatus = "overdue" | "paid" | "partial" | "unpaid";

export function getCustomerStatusLabel(status: CustomerStatus): string {
  switch (status) {
    case "all_paid":
      return "سدد بالكامل";
    case "has_outstanding":
      return "عليه رصيد";
    case "has_overdue":
      return "عليه متأخرات";
  }
}

export function getCustomerStatusVariant(
  status: CustomerStatus,
): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (status) {
    case "all_paid":
      return "success";
    case "has_outstanding":
      return "warning";
    case "has_overdue":
      return "danger";
  }
}

export function getContractDerivedStatusLabel(status: ContractDerivedStatus): string {
  switch (status) {
    case "paid":
      return "منتظم";
    case "partial":
      return "سداد جزئي";
    case "outstanding":
      return "مستحق";
    case "overdue":
      return "متأخر";
  }
}

export function getContractDerivedStatusVariant(
  status: ContractDerivedStatus,
): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
      return "info";
    case "outstanding":
      return "warning";
    case "overdue":
      return "danger";
  }
}

export function getInstallmentPaymentStatusLabel(status: InstallmentPaymentStatus): string {
  switch (status) {
    case "paid":
      return "مدفوع";
    case "partial":
      return "جزئي";
    case "unpaid":
      return "غير مدفوع";
    case "overdue":
      return "متأخر";
  }
}

export function getInstallmentPaymentStatusVariant(
  status: InstallmentPaymentStatus,
): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
      return "info";
    case "unpaid":
      return "warning";
    case "overdue":
      return "danger";
  }
}

export function getFollowUpStatusLabel(status: string): string {
  switch (status) {
    case "open":
      return "مفتوح";
    case "done":
      return "مغلق";
    case "missed":
      return "فائت";
    default:
      return status;
  }
}

export function getFollowUpStatusVariant(
  status: string,
): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (status) {
    case "done":
      return "success";
    case "missed":
      return "danger";
    case "open":
      return "warning";
    default:
      return "neutral";
  }
}

export function getContactTypeLabel(contactType: string): string {
  switch (contactType) {
    case "call":
      return "مكالمة";
    case "whatsapp":
      return "واتساب";
    case "meeting":
      return "اجتماع";
    case "email":
      return "بريد إلكتروني";
    case "other":
      return "أخرى";
    default:
      return contactType;
  }
}

export function getUnitStatusLabel(unitStatus: string): string {
  switch (unitStatus) {
    case "sold":
      return "مباعة";
    case "available":
      return "متاحة";
    default:
      return unitStatus;
  }
}

export function getUnitStatusVariant(
  unitStatus: string,
): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (unitStatus) {
    case "sold":
      return "info";
    case "available":
      return "success";
    default:
      return "neutral";
  }
}
