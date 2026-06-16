import { describe, expect, it } from "vitest";

import { navigationItems } from "@/shared/config/navigation";

describe("navigationItems", () => {
  it("keeps the approved MVP tabs in their required order", () => {
    expect(navigationItems.map((item) => item.label)).toEqual([
      "Home",
      "Focus Room",
      "Tasks",
      "Students",
      "Finance",
      "Marketing",
      "Resources",
    ]);
  });

  it("uses unique destinations", () => {
    const destinations = navigationItems.map((item) => item.href);

    expect(new Set(destinations).size).toBe(destinations.length);
  });
});
