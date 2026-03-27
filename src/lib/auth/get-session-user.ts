import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import {
  AuthorizationError,
  FORBIDDEN_MESSAGE,
  UNAUTHENTICATED_MESSAGE,
} from "./permissions";

export const APP_ROLES = ["admin", "manager", "collector", "viewer"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type RoleAssignment = {
  role: AppRole;
  projectId: string | null;
};

export type SessionUser = {
  id: string;
  email: string | null;
  fullName: string;
  defaultProjectId: string | null;
  isActive: boolean;
  roles: RoleAssignment[];
};

type ProfileRow = Tables<"profiles">;
type UserRoleRow = Tables<"user_roles">;

function isAppRole(role: string): role is AppRole {
  return APP_ROLES.includes(role as AppRole);
}

export function buildSessionUser(input: {
  authUser: Pick<User, "id" | "email">;
  profile: ProfileRow;
  roles: Array<Pick<UserRoleRow, "role" | "project_id">>;
}): SessionUser {
  return {
    id: input.authUser.id,
    email: input.authUser.email ?? input.profile.email,
    fullName: input.profile.full_name,
    defaultProjectId: input.profile.default_project_id,
    isActive: input.profile.is_active,
    roles: input.roles
      .filter((role): role is Pick<UserRoleRow, "role" | "project_id"> & { role: AppRole } =>
        isAppRole(role.role),
      )
      .map((role) => ({
        role: role.role,
        projectId: role.project_id,
      })),
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role, project_id").eq("user_id", user.id),
    ]);

  if (profileError || rolesError || !profile) {
    return null;
  }

  return buildSessionUser({
    authUser: user,
    profile,
    roles: roles ?? [],
  });
}

export async function getRequiredSessionUser(): Promise<SessionUser> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    throw new AuthorizationError("unauthenticated", UNAUTHENTICATED_MESSAGE, 401);
  }

  if (!sessionUser.isActive) {
    throw new AuthorizationError("forbidden", FORBIDDEN_MESSAGE, 403);
  }

  return sessionUser;
}
