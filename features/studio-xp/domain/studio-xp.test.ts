import { describe, expect, it } from "vitest";

import { buildStudioXpViewModel } from "@/features/studio-xp/domain/studio-xp";

describe("Studio XP view model", () => {
  it("builds organization-wide progress and attributed shared activity", () => {
    const view = buildStudioXpViewModel({
      totalXp: 410,
      timezone: "America/Vancouver",
      isAdmin: false,
      events: [
        {
          id: "event-1",
          eventType: "focus_session_completed",
          points: 10,
          description: "Completed Pomodoro focus: Prepare lesson",
          actorName: "Alice",
          createdAt: "2026-06-04T01:00:00.000Z",
        },
      ],
    });

    expect(view).toMatchObject({
      level: 3,
      totalXp: 410,
      xpToNextLevel: 490,
      progressPercent: 2,
      isAdmin: false,
    });
    expect(view.activities[0]).toMatchObject({
      actorName: "Alice",
      points: 10,
    });
  });

  it("does not create per-member XP totals", () => {
    const view = buildStudioXpViewModel({
      totalXp: 0,
      timezone: "America/Vancouver",
      isAdmin: true,
      events: [],
    });

    expect(view).not.toHaveProperty("memberTotals");
    expect(view.activities).toEqual([]);
  });
});
