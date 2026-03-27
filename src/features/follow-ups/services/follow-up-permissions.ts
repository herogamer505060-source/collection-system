import type { SessionUser } from "@/lib/auth/get-session-user";
import {
  AuthorizationError,
  FORBIDDEN_MESSAGE,
  UNAUTHENTICATED_MESSAGE,
} from "@/lib/auth/permissions";
import { canReadFollowUp, canWriteFollowUp, hasRoleAssignment } from "@/lib/auth/role-scopes";

export type FollowUpPermissionScope = {
  collectorUserId: string | null;
  createdBy: string;
  customerId: string;
  projectId: string | null;
};

export function assertCanCreateFollowUp(
  sessionUser: SessionUser | null | undefined,
  scope: Omit<FollowUpPermissionScope, "createdBy">,
): void {
  const actor = requireActiveUser(sessionUser);

  if (hasRoleAssignment(actor, "collector") && scope.collectorUserId && scope.collectorUserId !== actor.id) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }

  if (
    !canWriteFollowUp(actor, {
      collectorUserId: scope.collectorUserId,
      createdBy: actor.id,
      projectId: scope.projectId,
    })
  ) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }
}

export function assertCanUpdateFollowUp(
  sessionUser: SessionUser | null | undefined,
  scope: FollowUpPermissionScope,
): void {
  const actor = requireActiveUser(sessionUser);

  if (!canWriteFollowUp(actor, scope)) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }
}

export function canReadFollowUpRecord(
  sessionUser: SessionUser | null | undefined,
  scope: FollowUpPermissionScope,
): boolean {
  return canReadFollowUp(sessionUser, {
    collectorUserId: scope.collectorUserId,
    createdBy: scope.createdBy,
    projectId: scope.projectId,
  });
}

function requireActiveUser(sessionUser: SessionUser | null | undefined): SessionUser {
  if (!sessionUser) {
    throw new AuthorizationError("unauthenticated", UNAUTHENTICATED_MESSAGE, 401);
  }

  if (!sessionUser.isActive) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }

  return sessionUser;
}
