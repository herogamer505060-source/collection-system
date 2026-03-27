import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthorizationError } from "@/lib/auth/permissions";

import { createRoleAssignment, createSessionUser } from "../helpers/session-user";

async function loadPreviewRouteModule() {
  const modulePath = "../../src/app/api/imports/[batchId]/preview/route.ts";
  return import(modulePath);
}

describe("imports preview route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the documented preview payload shape for an authorized manager", async () => {
    const getRequiredSessionUser = vi
      .fn()
      .mockResolvedValue(createSessionUser({ roles: [createRoleAssignment("manager", "project-parco")] }));
    const buildImportPreview = vi.fn().mockResolvedValue({
      batchId: "batch-1",
      changeSummary: {
        contractsToCreate: 3,
        contractsToUpdate: 1,
        customersToCreate: 5,
        customersToMatch: 80,
        installmentsToCreate: 22,
        installmentsToUpdate: 120,
        linksToCreate: 6,
      },
      counts: {
        issueRows: 8,
        skippedRows: 5,
        totalRows: 150,
        validRows: 142,
      },
      detectedColumns: ["المشروع", "Customer", "كود الوحدة", "كود القسط"],
      issues: [
        {
          id: "issue-1",
          issueType: "unknown_project",
          messageAr: "اسم المشروع غير معروف: IL Parko",
          rawValue: "IL Parko",
          severity: "high",
          sourceRowNumber: 45,
        },
      ],
      sampleRows: [
        {
          amountDue: 50000,
          customerName: "عميل تجريبي",
          project: "IL Parco",
          sourceRowNumber: 12,
          unitCode: "B28+B29",
        },
      ],
      status: "ready_for_review",
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

    vi.doMock("@/features/imports/services/build-import-preview", () => ({ buildImportPreview }));

    const { POST } = await loadPreviewRouteModule();
    const response = await POST(new Request("http://localhost/api/imports/batch-1/preview", { method: "POST" }), {
      params: Promise.resolve({ batchId: "batch-1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      batchId: "batch-1",
      changeSummary: {
        contractsToCreate: 3,
        contractsToUpdate: 1,
        customersToCreate: 5,
        customersToMatch: 80,
        installmentsToCreate: 22,
        installmentsToUpdate: 120,
        linksToCreate: 6,
      },
      counts: {
        issueRows: 8,
        skippedRows: 5,
        totalRows: 150,
        validRows: 142,
      },
      detectedColumns: ["المشروع", "Customer", "كود الوحدة", "كود القسط"],
      issues: [
        {
          id: "issue-1",
          issueType: "unknown_project",
          messageAr: "اسم المشروع غير معروف: IL Parko",
          rawValue: "IL Parko",
          severity: "high",
          sourceRowNumber: 45,
        },
      ],
      sampleRows: [
        {
          amountDue: 50000,
          customerName: "عميل تجريبي",
          project: "IL Parco",
          sourceRowNumber: 12,
          unitCode: "B28+B29",
        },
      ],
      status: "ready_for_review",
    });
  });

  it("returns the standard unauthenticated error shape for an expired session", async () => {
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
    const response = await POST(new Request("http://localhost/api/imports/batch-2/preview", { method: "POST" }), {
      params: Promise.resolve({ batchId: "batch-2" }),
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
