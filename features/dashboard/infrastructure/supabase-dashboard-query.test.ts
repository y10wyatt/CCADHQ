import { describe, expect, it } from "vitest";

import { getOrganizationMonthRange } from "@/features/dashboard/infrastructure/supabase-dashboard-query";

describe("getOrganizationMonthRange", () => {
  it("uses the organization timezone at UTC month boundaries", () => {
    expect(
      getOrganizationMonthRange(
        new Date("2026-01-01T07:30:00.000Z"),
        "America/Vancouver",
      ),
    ).toEqual({
      start: "2025-12-01",
      end: "2026-01-01",
    });
  });

  it("rolls December into the next year", () => {
    expect(
      getOrganizationMonthRange(
        new Date("2026-12-15T20:00:00.000Z"),
        "America/Vancouver",
      ),
    ).toEqual({
      start: "2026-12-01",
      end: "2027-01-01",
    });
  });
});
