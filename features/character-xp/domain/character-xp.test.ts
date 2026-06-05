import { describe, expect, it } from "vitest";

import { buildCharacterSummaries } from "@/features/character-xp/domain/character-xp";

describe("buildCharacterSummaries", () => {
  it("builds member-linked character progression without ranking members", () => {
    const summaries = buildCharacterSummaries({
      members: [
        {
          id: "member-william",
          name: "William",
          avatarUrl: null,
        },
        {
          id: "member-alice",
          name: "Alice",
          avatarUrl: "/alice.svg",
        },
      ],
      events: [
        {
          memberId: "member-william",
          eventType: "focus_session_completed",
          points: 10,
        },
        {
          memberId: "member-william",
          eventType: "task_completed",
          points: 15,
        },
        {
          memberId: "member-alice",
          eventType: "weekly_quest_completed",
          points: 25,
        },
      ],
    });

    expect(summaries.map((summary) => summary.name)).toEqual([
      "William",
      "Alice",
    ]);
    expect(summaries[0]).toMatchObject({
      avatarSrc: "/placeholders/william-avatar.svg",
      characterXp: 25,
      focusLabel: "1 focus session",
      taskLabel: "1 task completed",
    });
    expect(summaries[1]).toMatchObject({
      avatarSrc: "/alice.svg",
      streakLabel: "1 weekly quest completed",
    });
  });
});
