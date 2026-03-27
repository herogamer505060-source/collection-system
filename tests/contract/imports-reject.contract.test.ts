import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

async function loadRejectRouteModule() {
  const modulePath = "../../src/app/api/imports/[batchId]/reject/route.ts";
  return import(modulePath);
}

describe("imports reject route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the documented rejection payload shape for an authorized manager", async () => {
    const getRequiredSessionUser = vi
      .fn()
      .mockResolvedValue(createSessionUser({ roles: [createRoleAssignment("manager", "project-parco")] }));
    const rejectImportBatch = vi.fn().mockResolvedValue({ id: "batch-1", status: "rejected" });

    vi.doMock("@/lib/auth/get-session-user", async () => {
      const actual = await vi.importActual<typeof import("@/lib/auth/get-session-user")>(
        "@/lib/auth/get-session-user",
      );

      return {
        ...actual,
        getRequiredSessionUser,
      };
    });

    vi.doMock("@/server/repositories/import-batch-staging-repository", () => ({ rejectImportBatch }));

    const { POST } = await loadRejectRouteModule();
    const response = await POST(
      new Request("http://localhost/api/imports/batch-1/reject", {
        body: JSON.stringify({ reason: "تم اكتشاف ملف خاطئ" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
      { params: Promise.resolve({ batchId: "batch-1" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ batchId: "batch-1", status: "rejected" });
  });
});
