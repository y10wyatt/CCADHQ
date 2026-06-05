import { describe, expect, it } from "vitest";

import { buildDashboardViewModel } from "@/features/dashboard/application/build-dashboard-view-model";

describe("buildDashboardViewModel", () => {
  it("creates organization-scoped at-a-glance summaries", () => {
    const dashboard = buildDashboardViewModel({
      organizationName: "Cloud Centre of Art & Design",
      timezone: "America/Vancouver",
      currencyCode: "CAD",
      now: new Date("2026-06-03T22:00:00.000Z"),
      outstandingTaskCount: 4,
      priorityTaskCount: 2,
      totalXp: 640,
      financeEntries: [
        { entryType: "income", amountMinor: 120000 },
        { entryType: "expense", amountMinor: 25000 },
      ],
      recentXpEvents: [
        {
          id: "xp-1",
          description: "CCAD completed a task",
          points: 20,
          createdAt: "2026-06-03T20:00:00.000Z",
        },
      ],
    });

    expect(dashboard.greeting).toBe("Good afternoon, CCAD");
    expect(dashboard.metrics.map((metric) => metric.value)).toEqual([
      "4",
      "640",
      "$950.00",
    ]);
    expect(dashboard.characters.map((character) => character.name)).toEqual([
      "William",
      "Alice",
    ]);
    expect(dashboard.weeklyQuests).toHaveLength(2);
    expect(dashboard.activities[0].occurredAtLabel).toContain("+20 XP");
  });
});
