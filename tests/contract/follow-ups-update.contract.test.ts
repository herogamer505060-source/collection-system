import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthorizationError } from "@/lib/auth/permissions";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

async function loadFollowUpsUpdateRouteModule() {
  const modulePath = "../../src/app/api/follow-ups/[followUpId]/route.ts";
  return import(modulePath);
}

describe("follow-ups update route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the documented update payload shape for an authorized manager", async () => {
    const getRequiredSessionUser = vi
      .fn()
      .mockResolvedValue(createSessionUser({ roles: [createRoleAssignment("manager", "project-parco")] }));
    const updateFollowUp = vi.fn().mockResolvedValue({
      followUpStatus: "done",
      id: "follow-up-1",
      updatedAt: "2026-03-23T12:00:00Z",
    });

    vi.doMock("@/lib/auth/get-session-user", async () => {
      const actual = await vi.importActual<typeof import("@/lib/auth/get-session-user")>(
        "@/lib/auth/get-session-user",
      );

      return {
        ...actual,
        getRequiredSessionUser,
      };
    });

    vi.doMock("@/server/services/follow-ups-service", async () => {
      const actual = await vi.importActual<typeof import("@/server/services/follow-ups-service")>(
        "@/server/services/follow-ups-service",
      );

      return {
        ...actual,
        updateFollowUp,
      };
    });

    const { PATCH } = await loadFollowUpsUpdateRouteModule();
    const response = await PATCH(
      new Request("http://localhost/api/follow-ups/follow-up-1", {
        body: JSON.stringify({
          followUpStatus: "done",
          nextActionDate: "2026-03-29",
          note: "تأكيد جديد من العميل",
          promiseDate: "2026-03-28",
          promisedToPay: true,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }),
      { params: Promise.resolve({ followUpId: "follow-up-1" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      followUpStatus: "done",
      id: "follow-up-1",
      updatedAt: "2026-03-23T12:00:00Z",
    });
  });

  it("returns the standard forbidden error shape when a collector updates another user's follow-up", async () => {
    const getRequiredSessionUser = vi
      .fn()
      .mockRejectedValue(new AuthorizationError("forbidden", "ليس لديك صلاحية لتنفيذ هذا الإجراء", 403));

    vi.doMock("@/lib/auth/get-session-user", async () => {
      const actual = await vi.importActual<typeof import("@/lib/auth/get-session-user")>(
        "@/lib/auth/get-session-user",
      );

      return {
        ...actual,
        getRequiredSessionUser,
      };
    });

    const { PATCH } = await loadFollowUpsUpdateRouteModule();
    const response = await PATCH(
      new Request("http://localhost/api/follow-ups/follow-up-2", { method: "PATCH" }),
      { params: Promise.resolve({ followUpId: "follow-up-2" }) },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "forbidden",
        message: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
      },
    });
  });
});
