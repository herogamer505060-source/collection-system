import { describe, expect, it } from "vitest";

import { buildSessionUser } from "@/lib/auth/get-session-user";
import { hasPermission } from "@/lib/auth/permissions";
import { getAssignedProjectIds, getPrimaryRole } from "@/lib/auth/role-scopes";

describe("auth role integration", () => {
  it("builds a session user from auth and profile records", () => {
    const sessionUser = buildSessionUser({
      authUser: { email: "admin@example.com", id: "user-1" },
      profile: {
        created_at: "2026-03-24T00:00:00Z",
        default_project_id: "project-parco",
        email: "admin@example.com",
        full_name: "مدير النظام",
        id: "user-1",
        is_active: true,
        updated_at: "2026-03-24T00:00:00Z",
      },
      roles: [
        { project_id: null, role: "admin" },
        { project_id: "project-parco", role: "collector" },
        { project_id: null, role: "invalid-role" },
      ],
    });

    expect(sessionUser.roles).toHaveLength(2);
    expect(getPrimaryRole(sessionUser)).toBe("admin");
    expect(getAssignedProjectIds(sessionUser, "collector")).toEqual(["project-parco"]);
  });

  it("blocks inactive users even when roles exist", () => {
    const inactiveUser = buildSessionUser({
      authUser: { email: "viewer@example.com", id: "user-2" },
      profile: {
        created_at: "2026-03-24T00:00:00Z",
        default_project_id: null,
        email: "viewer@example.com",
        full_name: "مشاهد",
        id: "user-2",
        is_active: false,
        updated_at: "2026-03-24T00:00:00Z",
      },
      roles: [{ project_id: null, role: "viewer" }],
    });

    expect(hasPermission(inactiveUser, "dashboard.read")).toBe(false);
  });
});
