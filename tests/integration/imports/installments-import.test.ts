import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadApplyImportBatchModule() {
  const modulePath = "../../../src/features/imports/services/apply-import-batch.ts";
  return import(modulePath);
}

describe("installments import integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("re-imports the same installments batch without creating duplicates", async () => {
    const upsertImportBatch = vi
      .fn()
      .mockResolvedValueOnce({
        approvedAt: "2026-03-24T09:00:00Z",
        batchId: "batch-1",
        status: "approved",
        summary: { created: 25, issues: 0, skipped: 0, updated: 0 },
      })
      .mockResolvedValueOnce({
        approvedAt: "2026-03-24T09:10:00Z",
        batchId: "batch-1",
        status: "approved",
        summary: { created: 0, issues: 0, skipped: 0, updated: 25 },
      });

    vi.doMock("@/server/services/import-upsert-service", () => ({ upsertImportBatch }));

    const { applyImportBatch } = await loadApplyImportBatchModule();
    const firstRun = await applyImportBatch({ actorId: "manager-1", batchId: "batch-1" });
    const secondRun = await applyImportBatch({ actorId: "manager-1", batchId: "batch-1" });

    expect(firstRun.summary).toEqual({ created: 25, issues: 0, skipped: 0, updated: 0 });
    expect(secondRun.summary).toEqual({ created: 0, issues: 0, skipped: 0, updated: 25 });
  });
});
