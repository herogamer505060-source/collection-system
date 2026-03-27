import { parseCompositeUnitCode } from "@/features/imports/normalization/parse-composite-unit-code";
import type { UnitMatch } from "@/features/imports/types";

function normalizeSingleUnitCode(value: string): string {
  const [unitCode] = parseCompositeUnitCode(value);

  return unitCode ?? "";
}

export function buildUnitKey(projectCode: string, unitCode: string): string {
  return `${projectCode.trim().toLowerCase()}::${normalizeSingleUnitCode(unitCode)}`;
}

export function matchUnitByKey(
  units: UnitMatch[],
  projectCode: string,
  unitCode: string,
): UnitMatch | null {
  const unitKey = buildUnitKey(projectCode, unitCode).toLowerCase();

  return units.find((unit) => unit.unit_key.trim().toLowerCase() === unitKey) ?? null;
}
