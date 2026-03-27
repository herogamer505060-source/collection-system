import { StatusBadge } from "@/components/ui/status-badge";
import {
  getUnitStatusLabel,
  getUnitStatusVariant,
} from "@/features/customers/presentation";

type UnitStatusCellProps = {
  statusConflict: boolean;
  unitStatus: string;
};

export function UnitStatusCell({ statusConflict, unitStatus }: UnitStatusCellProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge variant={getUnitStatusVariant(unitStatus)}>{getUnitStatusLabel(unitStatus)}</StatusBadge>
      {statusConflict ? <StatusBadge variant="danger">تعارض مصدر</StatusBadge> : null}
    </div>
  );
}
