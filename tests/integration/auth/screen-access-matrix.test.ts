import { describe, expect, it } from "vitest";

import { canAccessProject, canAccessContract } from "@/lib/auth/role-scopes";

import { createRoleAssignment, createSessionUser } from "../../helpers/session-user";

describe("screen access matrix", () => {
  it("keeps project-scoped viewers inside their assigned project", () => {
    const viewer = createSessionUser({ roles: [createRoleAssignment("viewer", "project-parco")] });

    expect(canAccessProject(viewer, "project-parco", ["viewer"])).toBe(true);
    expect(canAccessProject(viewer, "project-centro", ["viewer"])).toBe(false);
  });

  it("allows collectors to access only their own assigned contracts", () => {
    const collector = createSessionUser({
      id: "collector-1",
      roles: [createRoleAssignment("collector", "project-parco")],
    });

    expect(
      canAccessContract(collector, {
        collectorUserId: "collector-1",
        projectId: "project-parco",
      }),
    ).toBe(true);

    expect(
      canAccessContract(collector, {
        collectorUserId: "collector-2",
        projectId: "project-parco",
      }),
    ).toBe(false);
  });

  it("allows admins across every project boundary", () => {
    const admin = createSessionUser({ roles: [createRoleAssignment("admin")] });

    expect(canAccessProject(admin, "project-parco")).toBe(true);
    expect(
      canAccessContract(admin, {
        collectorUserId: "collector-2",
        projectId: "project-centro",
      }),
    ).toBe(true);
  });
});
