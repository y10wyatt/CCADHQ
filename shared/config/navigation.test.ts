import { describe, expect, it } from "vitest";

import { navigationItems } from "@/shared/config/navigation";

describe("navigationItems", () => {
  it("keeps the approved admissions dashboard tabs in their required order", () => {
    expect(navigationItems.map((item) => item.label)).toEqual([
      "Dashboard",
      "Leads",
      "Students",
      "Marketing",
      "Finance",
      "Tasks",
      "Team",
      "Settings",
    ]);
  });

  it("uses unique destinations", () => {
    const destinations = navigationItems.map((item) => item.href);

    expect(new Set(destinations).size).toBe(destinations.length);
  });
});
