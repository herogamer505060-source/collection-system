import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

async function loadBatchDetailRouteModule() {
  const modulePath = "../../src/app/api/imports/[batchId]/route.ts";
  return import(modulePath);
}

describe("imports batch detail route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the documented batch detail payload shape for an authorized viewer", async () => {
    const getRequiredSessionUser = vi
      .fn()
      .mockResolvedValue(createSessionUser({ roles: [createRoleAssignment("viewer", "project-parco")] }));
    const getImportBatchDetail = vi.fn().mockResolvedValue({
      batchId: "batch-1",
      batchType: "installments",
      counts: {
        issueCount: 8,
        rowsImported: 137,
        rowsSkipped: 5,
        rowsTotal: 150,
        rowsUpdated: 120,
        rowsValid: 142,
      },
      files: [{ fileId: "file-1", fileName: "Rep_REI006 (5).xlsx", sheetName: "report" }],
      issues: [
        {
          id: "issue-1",
          issueType: "duplicate_unit_status",
          messageAr: "الوحدة B21 ظهرت كمباعة ومتاحة في نفس الوقت",
          severity: "high",
        },
      ],
      status: "approved_with_issues",
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

    vi.doMock("@/server/queries/imports/get-import-batch-detail", () => ({ getImportBatchDetail }));

    const { GET } = await loadBatchDetailRouteModule();
    const response = await GET(new Request("http://localhost/api/imports/batch-1", { method: "GET" }), {
      params: Promise.resolve({ batchId: "batch-1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      batchId: "batch-1",
      batchType: "installments",
      counts: {
        issueCount: 8,
        rowsImported: 137,
        rowsSkipped: 5,
        rowsTotal: 150,
        rowsUpdated: 120,
        rowsValid: 142,
      },
      files: [{ fileId: "file-1", fileName: "Rep_REI006 (5).xlsx", sheetName: "report" }],
      issues: [
        {
          id: "issue-1",
          issueType: "duplicate_unit_status",
          messageAr: "الوحدة B21 ظهرت كمباعة ومتاحة في نفس الوقت",
          severity: "high",
        },
      ],
      status: "approved_with_issues",
    });
  });
});
