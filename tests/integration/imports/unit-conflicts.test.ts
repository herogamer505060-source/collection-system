import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadApplyImportBatchModule() {
  const modulePath = "../../../src/features/imports/services/apply-import-batch.ts";
  return import(modulePath);
}

describe("unit conflict import integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("surfaces sold-versus-available conflicts as approved-with-issues results", async () => {
    const upsertImportBatch = vi.fn().mockResolvedValue({
      approvedAt: "2026-03-24T10:00:00Z",
      batchId: "batch-conflict",
      status: "approved_with_issues",
      summary: { created: 0, issues: 1, skipped: 1, updated: 0 },
    });

    vi.doMock("@/server/services/import-upsert-service", () => ({ upsertImportBatch }));

    const { applyImportBatch } = await loadApplyImportBatchModule();
    const result = await applyImportBatch({ actorId: "manager-1", batchId: "batch-conflict" });

    expect(result.status).toBe("approved_with_issues");
    expect(result.summary).toEqual({ created: 0, issues: 1, skipped: 1, updated: 0 });
  });
});
