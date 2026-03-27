import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

async function loadUploadRouteModule() {
  const modulePath = "../../src/app/api/imports/upload/route.ts";
  return import(modulePath);
}

describe("imports upload route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the documented upload payload shape for an authorized manager", async () => {
    const getRequiredSessionUser = vi
      .fn()
      .mockResolvedValue(createSessionUser({ roles: [createRoleAssignment("manager", "project-parco")] }));
    const storeUploadedFile = vi.fn().mockResolvedValue({
      batchId: "batch-1",
      fileId: "file-1",
      fileName: "report.xlsx",
      importType: "installments",
      status: "uploaded",
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

    vi.doMock("@/features/imports/services/store-uploaded-file", () => ({ storeUploadedFile }));

    const formData = new FormData();
    formData.append("file", new File(["test"], "report.xlsx"));
    formData.append("importType", "installments");

    const { POST } = await loadUploadRouteModule();
    const response = await POST({ formData: async () => formData } as Request);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      batchId: "batch-1",
      fileId: "file-1",
      fileName: "report.xlsx",
      importType: "installments",
      status: "uploaded",
    });
  });
});
