import { describe, expect, it } from "vitest";

import { canManageImports, canReadImports } from "@/lib/auth/role-scopes";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

describe("import role access contract", () => {
  it("allows only admins and managers to manage imports", () => {
    expect(canManageImports(createSessionUser({ roles: [createRoleAssignment("admin")] }))).toBe(true);
    expect(canManageImports(createSessionUser({ roles: [createRoleAssignment("manager", "project-parco")] }))).toBe(true);
    expect(canManageImports(createSessionUser({ roles: [createRoleAssignment("viewer")] }))).toBe(false);
    expect(canManageImports(createSessionUser({ roles: [createRoleAssignment("collector", "project-parco")] }))).toBe(false);
  });

  it("allows viewers to read import screens without write access", () => {
    const viewer = createSessionUser({ roles: [createRoleAssignment("viewer")] });

    expect(canReadImports(viewer)).toBe(true);
    expect(canManageImports(viewer)).toBe(false);
  });
});
