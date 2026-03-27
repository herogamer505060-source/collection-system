import type { AppRole, RoleAssignment, SessionUser } from "@/lib/auth/get-session-user";

type SessionUserOverrides = Partial<Omit<SessionUser, "roles">> & {
  roles?: RoleAssignment[];
};

export function createRoleAssignment(role: AppRole, projectId: string | null = null): RoleAssignment {
  return { projectId, role };
}

export function createSessionUser(overrides: SessionUserOverrides = {}): SessionUser {
  return {
    defaultProjectId: "project-parco",
    email: "user@example.com",
    fullName: "مستخدم تجريبي",
    id: "user-1",
    isActive: true,
    roles: [createRoleAssignment("viewer")],
    ...overrides,
  };
}
