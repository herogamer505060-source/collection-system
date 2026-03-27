import { describe, expect, it } from "vitest";

import { buildUnitKey, matchUnitByKey } from "@/features/imports/matching/match-unit";

describe("matchUnitByKey", () => {
  it("builds stable project-scoped unit keys", () => {
    expect(buildUnitKey("parco", " IL Parco - B22 ")).toBe("parco::B22");
  });

  it("matches normalized unit keys against existing units", () => {
    const match = matchUnitByKey(
      [
        {
          contract_price: null,
          floor_name: null,
          garden_area: null,
          id: "unit-1",
          list_price: null,
          project_id: "project-parco",
          source_available: false,
          source_sold: true,
          status_conflict: false,
          unit_code: "B22",
          unit_key: "parco::B22",
          unit_status: "sold",
        },
      ],
      "parco",
      "B22",
    );

    expect(match?.id).toBe("unit-1");
  });
});
