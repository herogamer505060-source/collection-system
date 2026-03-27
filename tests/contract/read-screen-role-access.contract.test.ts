import { describe, expect, it } from "vitest";

import { canAccessScreen } from "@/lib/auth/permissions";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

describe("read screen role access contract", () => {
  it("allows viewer access to read-only screens", () => {
    const viewer = createSessionUser({ roles: [createRoleAssignment("viewer")] });

    expect(canAccessScreen(viewer, "dashboard")).toBe(true);
    expect(canAccessScreen(viewer, "imports")).toBe(true);
    expect(canAccessScreen(viewer, "customers")).toBe(true);
    expect(canAccessScreen(viewer, "users")).toBe(false);
  });

  it("allows collector access to operational read screens but not imports", () => {
    const collector = createSessionUser({ roles: [createRoleAssignment("collector", "project-parco")] });

    expect(canAccessScreen(collector, "customers")).toBe(true);
    expect(canAccessScreen(collector, "contracts")).toBe(true);
    expect(canAccessScreen(collector, "imports")).toBe(false);
  });
});
