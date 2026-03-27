import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthorizationError } from "@/lib/auth/permissions";

async function loadPreviewRouteModule() {
  const modulePath = "../../../src/app/api/imports/[batchId]/preview/route.ts";
  return import(modulePath);
}

async function loadApproveRouteModule() {
  const modulePath = "../../../src/app/api/imports/[batchId]/approve/route.ts";
  return import(modulePath);
}

describe("import session expiry handling", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 from preview when the session expires before parsing starts", async () => {
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

    const { POST } = await loadPreviewRouteModule();
    const response = await POST(new Request("http://localhost/api/imports/batch-1/preview", { method: "POST" }), {
      params: Promise.resolve({ batchId: "batch-1" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: "unauthenticated",
        message: "يجب تسجيل الدخول أولا",
      },
    });
  });

  it("returns 401 from approve when the session expires before commit", async () => {
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

    const { POST } = await loadApproveRouteModule();
    const response = await POST(new Request("http://localhost/api/imports/batch-1/approve", { method: "POST" }), {
      params: Promise.resolve({ batchId: "batch-1" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: "unauthenticated",
        message: "يجب تسجيل الدخول أولا",
      },
    });
  });
});
