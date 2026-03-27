import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthorizationError } from "@/lib/auth/permissions";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

const VALID_BATCH_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_USER_UUID = "550e8400-e29b-41d4-a716-446655440001";

async function loadApproveRouteModule() {
  const modulePath = "../../src/app/api/imports/[batchId]/approve/route.ts";
  return import(modulePath);
}

describe("imports approve route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the documented approval payload shape for an authorized admin", async () => {
    const getRequiredSessionUser = vi
      .fn()
      .mockResolvedValue(createSessionUser({ id: VALID_USER_UUID, roles: [createRoleAssignment("admin")] }));
    const applyImportBatch = vi.fn().mockResolvedValue({
      approvedAt: "2026-03-23T14:30:00Z",
      batchId: VALID_BATCH_UUID,
      status: "approved",
      summary: {
        created: 25,
        issues: 8,
        skipped: 5,
        updated: 120,
      },
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

    vi.doMock("@/features/imports/services/apply-import-batch", () => ({ applyImportBatch }));

    const { POST } = await loadApproveRouteModule();
    const response = await POST(
      new Request(`http://localhost/api/imports/${VALID_BATCH_UUID}/approve`, { method: "POST" }),
      {
        params: Promise.resolve({ batchId: VALID_BATCH_UUID }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      approvedAt: "2026-03-23T14:30:00Z",
      batchId: VALID_BATCH_UUID,
      status: "approved",
      summary: {
        created: 25,
        issues: 8,
        skipped: 5,
        updated: 120,
      },
    });
  });

  it("returns the standard forbidden error shape for an unauthorized user", async () => {
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

    const { POST } = await loadApproveRouteModule();
    const response = await POST(
      new Request(`http://localhost/api/imports/${VALID_BATCH_UUID}/approve`, { method: "POST" }),
      {
        params: Promise.resolve({ batchId: VALID_BATCH_UUID }),
      },
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
