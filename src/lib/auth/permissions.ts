import type { AppRole, SessionUser } from "./get-session-user";
import { AuthorizationError as ApiAuthorizationError } from "@/lib/errors/api-error";

export type PermissionKey =
  | "dashboard.read"
  | "imports.read"
  | "imports.manage"
  | "customers.read"
  | "contracts.read"
  | "installments.read"
  | "units.read"
  | "followUps.read"
  | "followUps.manageOwn"
  | "followUps.manageAny"
  | "admin.users.manage"
  | "reports.read";

export type AppScreen =
  | "dashboard"
  | "imports"
  | "customers"
  | "contracts"
  | "installments"
  | "units"
  | "followUps"
  | "users"
  | "reports";

export const UNAUTHENTICATED_MESSAGE = "يجب تسجيل الدخول أولا";
export const FORBIDDEN_MESSAGE = "ليس لديك صلاحية لتنفيذ هذا الإجراء";

const ROLE_PERMISSION_MAP: Record<AppRole, PermissionKey[]> = {
  admin: [
    "dashboard.read",
    "imports.read",
    "imports.manage",
    "customers.read",
    "contracts.read",
    "installments.read",
    "units.read",
    "followUps.read",
    "followUps.manageOwn",
    "followUps.manageAny",
    "admin.users.manage",
    "reports.read",
  ],
  manager: [
    "dashboard.read",
    "imports.read",
    "imports.manage",
    "customers.read",
    "contracts.read",
    "installments.read",
    "units.read",
    "followUps.read",
    "followUps.manageAny",
    "reports.read",
  ],
  collector: [
    "dashboard.read",
    "customers.read",
    "contracts.read",
    "installments.read",
    "units.read",
    "followUps.read",
    "followUps.manageOwn",
    "reports.read",
  ],
  viewer: [
    "dashboard.read",
    "imports.read",
    "customers.read",
    "contracts.read",
    "installments.read",
    "units.read",
    "followUps.read",
    "reports.read",
  ],
};

export const SCREEN_PERMISSION_MAP: Record<AppScreen, PermissionKey> = {
  dashboard: "dashboard.read",
  imports: "imports.read",
  customers: "customers.read",
  contracts: "contracts.read",
  installments: "installments.read",
  units: "units.read",
  followUps: "followUps.read",
  users: "admin.users.manage",
  reports: "reports.read",
};

export { ApiAuthorizationError as AuthorizationError };

export function getRolePermissions(role: AppRole): PermissionKey[] {
  return ROLE_PERMISSION_MAP[role];
}

export function hasPermission(
  sessionUser: SessionUser | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!sessionUser || !sessionUser.isActive) {
    return false;
  }

  return sessionUser.roles.some((assignment) =>
    ROLE_PERMISSION_MAP[assignment.role].includes(permission),
  );
}

export function requirePermission(
  sessionUser: SessionUser | null | undefined,
  permission: PermissionKey,
  message = FORBIDDEN_MESSAGE,
): void {
  if (!sessionUser) {
    throw new ApiAuthorizationError("unauthenticated", UNAUTHENTICATED_MESSAGE, 401);
  }

  if (!hasPermission(sessionUser, permission)) {
    throw new ApiAuthorizationError("forbidden", message, 403);
  }
}

export function canAccessScreen(
  sessionUser: SessionUser | null | undefined,
  screen: AppScreen,
): boolean {
  return hasPermission(sessionUser, SCREEN_PERMISSION_MAP[screen]);
}
