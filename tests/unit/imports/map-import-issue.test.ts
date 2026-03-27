import { describe, expect, it } from "vitest";

async function loadMapImportIssueModule() {
  const modulePath = "../../../src/features/imports/validators/map-import-issue.ts";
  return import(modulePath);
}

describe("mapImportIssue", () => {
  it("maps unknown projects to a high-severity Arabic issue", async () => {
    const { mapImportIssue } = await loadMapImportIssueModule();

    expect(
      mapImportIssue({
        issueType: "unknown_project",
        rawValue: "IL Parko",
        sourceRowNumber: 45,
      }),
    ).toMatchObject({
      issueType: "unknown_project",
      messageAr: "اسم المشروع غير معروف: IL Parko",
      rawValue: "IL Parko",
      severity: "high",
      sourceRowNumber: 45,
    });
  });

  it("maps duplicate unit status conflicts to an actionable Arabic message", async () => {
    const { mapImportIssue } = await loadMapImportIssueModule();

    expect(
      mapImportIssue({
        issueType: "duplicate_unit_status",
        rawValue: "B21",
        sourceRowNumber: 18,
      }),
    ).toMatchObject({
      issueType: "duplicate_unit_status",
      messageAr: "الوحدة B21 ظهرت كمباعة ومتاحة في نفس الوقت",
      severity: "high",
      sourceRowNumber: 18,
    });
  });
});
