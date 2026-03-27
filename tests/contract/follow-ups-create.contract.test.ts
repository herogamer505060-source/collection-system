import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthorizationError } from "@/lib/auth/permissions";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

async function loadFollowUpsCreateRouteModule() {
  const modulePath = "../../src/app/api/follow-ups/route.ts";
  return import(modulePath);
}

describe("follow-ups create route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the documented creation payload shape for an authorized collector", async () => {
    const getRequiredSessionUser = vi
      .fn()
      .mockResolvedValue(createSessionUser({ id: "collector-1", roles: [createRoleAssignment("collector", "project-parco")] }));
    const createFollowUp = vi.fn().mockResolvedValue({
      contactType: "call",
      contractId: "contract-1",
      createdBy: "collector-1",
      customerId: "customer-1",
      followUpDate: "2026-03-23T10:00:00Z",
      followUpStatus: "open",
      id: "follow-up-1",
      note: "تم التواصل وتم الاتفاق على السداد الأسبوع القادم",
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
        createFollowUp,
      };
    });

    const { POST } = await loadFollowUpsCreateRouteModule();
    const response = await POST(
      new Request("http://localhost/api/follow-ups", {
        body: JSON.stringify({
          collectorUserId: "collector-1",
          contactType: "call",
          contractId: "contract-1",
          customerId: "customer-1",
          followUpDate: "2026-03-23T10:00:00Z",
          note: "تم التواصل وتم الاتفاق على السداد الأسبوع القادم",
          promiseDate: "2026-03-27",
          promisedToPay: true,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      contactType: "call",
      contractId: "contract-1",
      createdBy: "collector-1",
      customerId: "customer-1",
      followUpDate: "2026-03-23T10:00:00Z",
      followUpStatus: "open",
      id: "follow-up-1",
      note: "تم التواصل وتم الاتفاق على السداد الأسبوع القادم",
    });
  });

  it("returns the standard unauthenticated error shape when the session is missing", async () => {
    const getRequiredSessionUser = vi
      .fn()
      .mockRejectedValue(new AuthorizationError("unauthenticated", "يجب تسجيل الدخول أولا", 401));

    vi.doMock("@/lib/auth/get-session-user", async () => {
      const actual = await vi.importActual<typeof import("@/lib/auth/get-session-user")>(
        "@/lib/auth/get-session-user",
      );

      return {
        ...actual,
        getRequiredSessionUser,
      };
    });

    const { POST } = await loadFollowUpsCreateRouteModule();
    const response = await POST(new Request("http://localhost/api/follow-ups", { method: "POST" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: "unauthenticated",
        message: "يجب تسجيل الدخول أولا",
      },
    });
  });
});
