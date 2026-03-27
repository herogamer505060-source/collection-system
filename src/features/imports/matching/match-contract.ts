import type { ContractMatch } from "@/features/imports/types";

function normalizeContractCode(value: string): string {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function normalizeUnitToken(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function buildContractKey(input: {
  contractCode?: string | null;
  customerImportKey: string;
  unitCodes: string[];
}): string {
  const contractCode = input.contractCode?.trim();

  if (contractCode) {
    return `code::${normalizeContractCode(contractCode)}`;
  }

  const normalizedUnitSet = Array.from(new Set(input.unitCodes.map(normalizeUnitToken))).sort();

  return `${input.customerImportKey.trim().toLowerCase()}::${normalizedUnitSet.join("+")}`;
}

export function matchContractByKey(
  contracts: ContractMatch[],
  input: Parameters<typeof buildContractKey>[0],
): ContractMatch | null {
  const contractKey = buildContractKey(input).toLowerCase();

  return (
    contracts.find((contract) => contract.contract_key.trim().toLowerCase() === contractKey) ?? null
  );
}
