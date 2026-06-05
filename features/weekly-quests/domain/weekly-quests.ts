import type {
  StudioStatKey,
  WeeklyQuestStatus,
} from "@/shared/database/database.types";

export interface WeeklyQuestSnapshot {
  id: string;
  title: string;
  description: string | null;
  status: WeeklyQuestStatus;
  studioStatKey: StudioStatKey | null;
  xpValue: number;
  characterXpValue: number;
  progressCurrent: number;
  progressTarget: number;
  dueAt: string | null;
  completedAt: string | null;
  completedByName: string | null;
  createdByName: string | null;
}

export interface WeeklyQuestView {
  id: string;
  title: string;
  description: string | null;
  status: WeeklyQuestStatus;
  stat: string;
  statKey: StudioStatKey | null;
  rewardLabel: string;
  characterRewardLabel: string;
  progressCurrent: number;
  progressTarget: number;
  progressLabel: string;
  progressPercent: number;
  dueAt: string | null;
  completedAt: string | null;
  completedByName: string | null;
  createdByName: string | null;
}

export const studioStats: Array<{ value: StudioStatKey; label: string }> = [
  { value: "stability", label: "Stability" },
  { value: "reputation", label: "Reputation" },
  { value: "creativity", label: "Creativity" },
  { value: "community", label: "Community" },
];

export function buildWeeklyQuestViews(
  quests: WeeklyQuestSnapshot[],
): WeeklyQuestView[] {
  return quests.map((quest) => {
    const progressPercent =
      quest.progressTarget <= 0
        ? 0
        : Math.min(
            100,
            Math.floor((quest.progressCurrent / quest.progressTarget) * 100),
          );

    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      status: quest.status,
      stat: getStudioStatLabel(quest.studioStatKey),
      statKey: quest.studioStatKey,
      rewardLabel: `+${quest.xpValue} Studio XP`,
      characterRewardLabel: `+${quest.characterXpValue} Character XP`,
      progressCurrent: quest.progressCurrent,
      progressTarget: quest.progressTarget,
      progressLabel: `${quest.progressCurrent} of ${quest.progressTarget} steps`,
      progressPercent,
      dueAt: quest.dueAt,
      completedAt: quest.completedAt,
      completedByName: quest.completedByName,
      createdByName: quest.createdByName,
    };
  });
}

export function getStudioStatLabel(stat: StudioStatKey | null) {
  return studioStats.find((candidate) => candidate.value === stat)?.label ?? "Studio";
}
