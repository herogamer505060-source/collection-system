import { afterEach, describe, expect, it, vi } from "vitest";

import { upsertImportBatch } from "@/server/services/import-upsert-service";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_ACTOR_UUID = "550e8400-e29b-41d4-a716-446655440001";
const VALID_BATCH_UUID = "550e8400-e29b-41d4-a716-446655440002";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("upsertImportBatch", () => {
  it("delegates to the transactional processor when available", async () => {
    const transactionalResult = {
      approvedAt: "2026-03-25T15:00:00Z",
      batchId: VALID_BATCH_UUID,
      status: "approved" as const,
      summary: {
        created: 3,
        issues: 0,
        skipped: 0,
        updated: 1,
      },
    };
    const processImportBatch = vi.fn().mockResolvedValue(transactionalResult);

    const result = await upsertImportBatch(
      { actorId: VALID_ACTOR_UUID, batchId: VALID_BATCH_UUID },
      {
        createContract: vi.fn(),
        createCustomer: vi.fn(),
        createInstallment: vi.fn(),
        createUnit: vi.fn(),
        ensureContractUnit: vi.fn(),
        finalizeImportBatch: vi.fn(),
        flagUnitConflict: vi.fn(),
        getImportBatchStaging: vi.fn(),
        listImportIssuesByBatchId: vi.fn(),
        processImportBatch,
        touchContract: vi.fn(),
        updateInstallment: vi.fn(),
        updateUnit: vi.fn(),
        upsertCustomerIdentity: vi.fn(),
      },
    );

    expect(processImportBatch).toHaveBeenCalledWith({
      actorId: VALID_ACTOR_UUID,
      batchId: VALID_BATCH_UUID,
    });
    expect(result).toEqual(transactionalResult);
  });

  it("rejects the non-transactional fallback outside tests", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(
      upsertImportBatch(
        { actorId: VALID_ACTOR_UUID, batchId: VALID_BATCH_UUID },
        {
          createContract: vi.fn(),
          createCustomer: vi.fn(),
          createInstallment: vi.fn(),
          createUnit: vi.fn(),
          ensureContractUnit: vi.fn(),
          finalizeImportBatch: vi.fn(),
          flagUnitConflict: vi.fn(),
          getImportBatchStaging: vi.fn(),
          listImportIssuesByBatchId: vi.fn(),
          touchContract: vi.fn(),
          updateInstallment: vi.fn(),
          updateUnit: vi.fn(),
          upsertCustomerIdentity: vi.fn(),
        },
      ),
    ).rejects.toMatchObject({ code: "TRANSACTION_REQUIRED" });

    vi.unstubAllEnvs();
  });

  it("creates customer, contract, link, and installment records from staged installment rows", async () => {
    const createCustomer = vi.fn().mockResolvedValue({ id: VALID_UUID });
    const createContract = vi.fn().mockResolvedValue({ id: VALID_UUID });
    const createInstallment = vi.fn().mockResolvedValue(undefined);
    const ensureContractUnit = vi.fn().mockResolvedValue(true);
    const finalizeImportBatch = vi.fn().mockResolvedValue(undefined);
    const upsertCustomerIdentity = vi.fn().mockResolvedValue(undefined);

    const result = await upsertImportBatch(
      { actorId: VALID_ACTOR_UUID, batchId: VALID_BATCH_UUID },
      {
        createContract,
        createCustomer,
        createInstallment,
        createUnit: vi.fn(),
        ensureContractUnit,
        finalizeImportBatch,
        flagUnitConflict: vi.fn(),
        getImportBatchStaging: vi.fn().mockResolvedValue({
          batch: { id: VALID_BATCH_UUID, status: "ready_for_review" },
          stagingData: {
            batchType: "installments",
            changeSummary: {
              contractsToCreate: 1,
              contractsToUpdate: 0,
              customersToCreate: 1,
              customersToMatch: 0,
              installmentsToCreate: 1,
              installmentsToUpdate: 0,
              linksToCreate: 1,
            },
            counts: {
              blockedRows: 0,
              issueRows: 0,
              skippedRows: 0,
              totalRows: 1,
              validRows: 1,
            },
            detectedColumns: [],
            fileId: VALID_UUID,
            generatedInstallmentKeys: 0,
            sampleRows: [],
            sheetName: "report",
            stagedAt: "2026-03-24T10:00:00Z",
            stagedRows: [
              {
                amountCollected: 1000,
                amountDue: 1000,
                amountOutstanding: 0,
                canApply: true,
                contract: { contractKey: "parco::ahmed::B28" },
                customer: {
                  customerImportKey: "parco::ahmed",
                  customerName: "أحمد علي",
                  normalizedName: "احمد علي",
                },
                dueDate: "2026-03-01",
                hasBlockingIssues: false,
                installment: { installmentKey: "INST-1", keySource: "source" },
                installmentCode: "INST-1",
                installmentType: "قسط",
                issues: [],
                kind: "installment",
                matchedUnitIds: [VALID_UUID],
                missingUnitCodes: [],
                penaltyAmount: 0,
                projectCode: "parco",
                projectId: VALID_UUID,
                projectName: "IL Parco",
                sourceRowNumber: 12,
                sourceType: "installments_report",
                unitCodes: ["B28"],
              },
            ],
          },
        }),
        listImportIssuesByBatchId: vi.fn().mockResolvedValue([]),
        touchContract: vi.fn(),
        updateInstallment: vi.fn(),
        updateUnit: vi.fn(),
        upsertCustomerIdentity,
      },
    );

    expect(createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        customerKey: "parco::ahmed",
      }),
    );
    expect(upsertCustomerIdentity).toHaveBeenCalled();
    expect(createContract).toHaveBeenCalledWith(
      expect.objectContaining({
        batchId: VALID_BATCH_UUID,
        customerId: VALID_UUID,
      }),
    );
    expect(ensureContractUnit).toHaveBeenCalledWith({ contractId: VALID_UUID, unitId: VALID_UUID });
    expect(createInstallment).toHaveBeenCalledWith(
      expect.objectContaining({
        contract_id: VALID_UUID,
        installment_key: "INST-1",
        payment_status: "paid",
      }),
    );
    expect(result).toMatchObject({
      batchId: VALID_BATCH_UUID,
      status: "approved",
      summary: {
        created: 4,
        issues: 0,
        skipped: 0,
        updated: 0,
      },
    });
    expect(finalizeImportBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        batchId: VALID_BATCH_UUID,
        rowsImported: 1,
        status: "approved",
      }),
    );
  });

  it("skips conflicting unit rows and marks the batch approved with issues", async () => {
    const flagUnitConflict = vi.fn().mockResolvedValue(undefined);
    const conflictBatchId = "550e8400-e29b-41d4-a716-446655440003";

    const result = await upsertImportBatch(
      { actorId: VALID_ACTOR_UUID, batchId: conflictBatchId },
      {
        createContract: vi.fn(),
        createCustomer: vi.fn(),
        createInstallment: vi.fn(),
        createUnit: vi.fn(),
        ensureContractUnit: vi.fn(),
        finalizeImportBatch: vi.fn().mockResolvedValue(undefined),
        flagUnitConflict,
        getImportBatchStaging: vi.fn().mockResolvedValue({
          batch: { id: conflictBatchId, status: "ready_for_review" },
          stagingData: {
            batchType: "sold_units",
            changeSummary: {
              contractsToCreate: 0,
              contractsToUpdate: 0,
              customersToCreate: 0,
              customersToMatch: 0,
              installmentsToCreate: 0,
              installmentsToUpdate: 0,
              linksToCreate: 0,
              unitsToCreate: 0,
              unitsToUpdate: 0,
            },
            counts: {
              blockedRows: 1,
              issueRows: 1,
              skippedRows: 0,
              totalRows: 1,
              validRows: 0,
            },
            detectedColumns: [],
            fileId: VALID_UUID,
            generatedInstallmentKeys: 0,
            sampleRows: [],
            sheetName: "report",
            stagedAt: "2026-03-24T10:00:00Z",
            stagedRows: [
              {
                canApply: false,
                hasBlockingIssues: true,
                issues: [
                  {
                    issueType: "duplicate_unit_status",
                    messageAr: "الوحدة B22 ظهرت كمباعة ومتاحة في نفس الوقت",
                    payload: null,
                    rawValue: "B22",
                    severity: "high",
                    sourceRowNumber: 18,
                  },
                ],
                kind: "unit",
                projectCode: "parco",
                projectId: VALID_UUID,
                projectName: "IL Parco",
                sourceRowNumber: 18,
                sourceType: "sold_units_report",
                unit: {
                  existingUnitId: VALID_UUID,
                  statusConflict: true,
                  unitCode: "B22",
                  unitKey: "parco::B22",
                },
                unitStatus: "sold",
              },
            ],
          },
        }),
        listImportIssuesByBatchId: vi.fn().mockResolvedValue([{ id: VALID_UUID }]),
        touchContract: vi.fn(),
        updateInstallment: vi.fn(),
        updateUnit: vi.fn(),
        upsertCustomerIdentity: vi.fn(),
      },
    );

    expect(flagUnitConflict).toHaveBeenCalledWith({
      batchId: conflictBatchId,
      unitId: VALID_UUID,
      unitStatus: "sold",
    });
    expect(result).toMatchObject({
      status: "approved_with_issues",
      summary: {
        issues: 1,
        skipped: 1,
      },
    });
  });
});
