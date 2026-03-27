import { StatusBadge } from "@/components/ui/status-badge";
import {
  getInstallmentPaymentStatusLabel,
  getInstallmentPaymentStatusVariant,
  type InstallmentPaymentStatus,
} from "@/features/customers/presentation";

type PaymentStatusBadgeProps = {
  status: InstallmentPaymentStatus;
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <StatusBadge variant={getInstallmentPaymentStatusVariant(status)}>
      {getInstallmentPaymentStatusLabel(status)}
    </StatusBadge>
  );
}
