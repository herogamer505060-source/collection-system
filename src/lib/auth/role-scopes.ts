import type { AppRole, SessionUser } from "./get-session-user";

export const ROLE_LABELS_AR: Record<AppRole, string> = {
  admin: "مدير النظام",
  manager: "مدير",
  collector: "محصل",
  viewer: "مشاهد",
};

const ROLE_PRIORITY: Record<AppRole, number> = {
  admin: 4,
  manager: 3,
  collector: 2,
  viewer: 1,
};

type ContractScopeInput = {
  collectorUserId: string | null;
  projectId: string;
};

type FollowUpScopeInput = {
  collectorUserId: string | null;
  createdBy: string;
  projectId: string | null;
};

export function getPrimaryRole(sessionUser: SessionUser | null | undefined): AppRole | null {
  if (!sessionUser || sessionUser.roles.length === 0) {
    return null;
  }

  return [...sessionUser.roles]
    .sort((left, right) => ROLE_PRIORITY[right.role] - ROLE_PRIORITY[left.role])[0]
    .role;
}

export function getRoleLabels(sessionUser: SessionUser | null | undefined): string[] {
  if (!sessionUser) {
    return [];
  }

  return [...new Set(sessionUser.roles.map((assignment) => ROLE_LABELS_AR[assignment.role]))];
}

export function hasRoleAssignment(
  sessionUser: SessionUser | null | undefined,
  role: AppRole,
  projectId?: string,
): boolean {
  if (!sessionUser || !sessionUser.isActive) {
    return false;
  }

  return sessionUser.roles.some((assignment) => {
    if (assignment.role !== role) {
      return false;
    }

    if (!projectId) {
      return true;
    }

    return assignment.projectId === null || assignment.projectId === projectId;
  });
}

export function getAssignedProjectIds(
  sessionUser: SessionUser | null | undefined,
  role?: AppRole,
): string[] {
  if (!sessionUser) {
    return [];
  }

  return [...new Set(
    sessionUser.roles
      .filter((assignment) => !role || assignment.role === role)
      .map((assignment) => assignment.projectId)
      .filter((projectId): projectId is string => Boolean(projectId)),
  )];
}

export function canAccessProject(
  sessionUser: SessionUser | null | undefined,
  projectId: string,
  allowedRoles: AppRole[] = ["admin", "manager", "viewer", "collector"],
): boolean {
  if (!sessionUser || !sessionUser.isActive) {
    return false;
  }

  return sessionUser.roles.some(
    (assignment) =>
      allowedRoles.includes(assignment.role) &&
      (assignment.projectId === null || assignment.projectId === projectId),
  );
}

export function canReadImports(sessionUser: SessionUser | null | undefined): boolean {
  return (
    hasRoleAssignment(sessionUser, "admin") ||
    hasRoleAssignment(sessionUser, "manager") ||
    hasRoleAssignment(sessionUser, "viewer")
  );
}

export function canManageImports(sessionUser: SessionUser | null | undefined): boolean {
  return hasRoleAssignment(sessionUser, "admin") || hasRoleAssignment(sessionUser, "manager");
}

export function canAccessContract(
  sessionUser: SessionUser | null | undefined,
  input: ContractScopeInput,
): boolean {
  if (!sessionUser || !sessionUser.isActive) {
    return false;
  }

  if (canAccessProject(sessionUser, input.projectId, ["admin", "manager", "viewer"])) {
    return true;
  }

  return (
    hasRoleAssignment(sessionUser, "collector", input.projectId) &&
    input.collectorUserId === sessionUser.id
  );
}

export function canReadFollowUp(
  sessionUser: SessionUser | null | undefined,
  input: FollowUpScopeInput,
): boolean {
  if (!sessionUser || !sessionUser.isActive) {
    return false;
  }

  if (hasRoleAssignment(sessionUser, "admin")) {
    return true;
  }

  if (input.projectId && canAccessProject(sessionUser, input.projectId, ["manager", "viewer"])) {
    return true;
  }

  return (
    input.projectId !== null &&
    hasRoleAssignment(sessionUser, "collector", input.projectId) &&
    (input.collectorUserId === sessionUser.id || input.createdBy === sessionUser.id)
  );
}

export function canWriteFollowUp(
  sessionUser: SessionUser | null | undefined,
  input: FollowUpScopeInput,
): boolean {
  if (!sessionUser || !sessionUser.isActive) {
    return false;
  }

  if (hasRoleAssignment(sessionUser, "admin") || hasRoleAssignment(sessionUser, "manager")) {
    return true;
  }

  return (
    input.projectId !== null &&
    hasRoleAssignment(sessionUser, "collector", input.projectId) &&
    input.createdBy === sessionUser.id &&
    (input.collectorUserId === null || input.collectorUserId === sessionUser.id)
  );
}
