import { getXpProgress } from "@/shared/domain/xp-progress";
import type { CharacterXpEventType } from "@/shared/database/database.types";

export interface CharacterMemberSnapshot {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface CharacterXpEventSnapshot {
  memberId: string;
  eventType: CharacterXpEventType;
  points: number;
}

export interface CharacterSummary {
  id: string;
  name: string;
  avatarSrc: string;
  level: number;
  characterXp: number;
  xpToNextLevel: number;
  progressPercent: number;
  streakLabel: string;
  focusLabel: string;
  taskLabel: string;
}

export function buildCharacterSummaries(input: {
  members: CharacterMemberSnapshot[];
  events: CharacterXpEventSnapshot[];
}): CharacterSummary[] {
  return input.members.map((member) => {
    const memberEvents = input.events.filter(
      (event) => event.memberId === member.id,
    );
    const progress = getXpProgress(
      memberEvents.reduce((total, event) => total + event.points, 0),
    );
    const focusCount = countEvents(memberEvents, "focus_session_completed");
    const taskCount = countEvents(memberEvents, "task_completed");
    const questCount = countEvents(memberEvents, "weekly_quest_completed");

    return {
      id: member.id,
      name: member.name,
      avatarSrc: member.avatarUrl ?? getFallbackAvatar(member.name),
      level: progress.level,
      characterXp: progress.totalXp,
      xpToNextLevel: progress.xpToNextLevel,
      progressPercent: progress.progressPercent,
      streakLabel:
        questCount > 0
          ? `${questCount} weekly quest${questCount === 1 ? "" : "s"} completed`
          : "No weekly quests completed yet",
      focusLabel:
        focusCount === 1 ? "1 focus session" : `${focusCount} focus sessions`,
      taskLabel:
        taskCount === 1 ? "1 task completed" : `${taskCount} tasks completed`,
    };
  });
}

function countEvents(
  events: CharacterXpEventSnapshot[],
  eventType: CharacterXpEventType,
) {
  return events.filter((event) => event.eventType === eventType).length;
}

function getFallbackAvatar(name: string) {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes("alice")) return "/placeholders/alice-avatar.svg";
  if (normalized.includes("william")) return "/placeholders/william-avatar.svg";
  return "/placeholders/studio-desk.svg";
}
