import { describe, expect, it } from "vitest";

import { buildWeeklyQuestViews } from "@/features/weekly-quests/domain/weekly-quests";

describe("buildWeeklyQuestViews", () => {
  it("formats quest progress and XP rewards", () => {
    const quests = buildWeeklyQuestViews([
      {
        id: "quest-1",
        title: "Close the weekly studio admin loop",
        description: "Review the operational loose ends.",
        status: "active",
        studioStatKey: "stability",
        xpValue: 250,
        characterXpValue: 25,
        progressCurrent: 3,
        progressTarget: 5,
        dueAt: "2026-06-05T12:00:00.000Z",
        completedAt: null,
        completedByName: null,
        createdByName: "William",
      },
    ]);

    expect(quests[0]).toMatchObject({
      stat: "Stability",
      rewardLabel: "+250 Studio XP",
      characterRewardLabel: "+25 Character XP",
      progressLabel: "3 of 5 steps",
      progressPercent: 60,
    });
  });
});
