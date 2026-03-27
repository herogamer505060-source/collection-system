import { describe, expect, it } from "vitest";

import { getRolePermissions } from "@/lib/auth/permissions";

describe("auth role permissions contract", () => {
  it("grants admin every foundational permission", () => {
    expect(getRolePermissions("admin")).toEqual(
      expect.arrayContaining([
        "dashboard.read",
        "imports.manage",
        "customers.read",
        "contracts.read",
        "installments.read",
        "units.read",
        "followUps.manageAny",
        "admin.users.manage",
      ]),
    );
  });

  it("keeps manager out of user administration", () => {
    expect(getRolePermissions("manager")).not.toContain("admin.users.manage");
  });

  it("limits collector to assigned-data reads and own follow-ups", () => {
    expect(getRolePermissions("collector")).toEqual(
      expect.arrayContaining(["customers.read", "followUps.manageOwn"]),
    );
    expect(getRolePermissions("collector")).not.toContain("imports.read");
  });

  it("keeps viewer read-only", () => {
    expect(getRolePermissions("viewer")).toEqual(
      expect.arrayContaining(["dashboard.read", "imports.read", "followUps.read"]),
    );
    expect(getRolePermissions("viewer")).not.toContain("followUps.manageOwn");
  });
});
