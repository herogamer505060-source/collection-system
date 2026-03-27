import type { Tables } from "@/types/database";

export type CustomerIdentityMatch = Pick<
  Tables<"customer_project_identities">,
  "customer_id" | "customer_import_key" | "normalized_name" | "project_id"
>;

export function buildCustomerImportKey(projectCode: string, normalizedName: string): string {
  return `${projectCode.trim().toLowerCase()}::${normalizedName.trim().toLowerCase()}`;
}

export function matchCustomerByImportKey(
  identities: CustomerIdentityMatch[],
  projectCode: string,
  normalizedName: string,
): CustomerIdentityMatch | null {
  const customerImportKey = buildCustomerImportKey(projectCode, normalizedName);

  return (
    identities.find(
      (identity) => identity.customer_import_key.trim().toLowerCase() === customerImportKey,
    ) ?? null
  );
}
