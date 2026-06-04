import { getStudioProgress } from "@/features/dashboard/domain/studio-progress";
import type { XpEventType } from "@/shared/database/database.types";

export interface StudioXpEventSnapshot {
  id: string;
  eventType: XpEventType;
  points: number;
  description: string;
  actorName: string | null;
  createdAt: string;
}

export interface StudioXpActivity {
  id: string;
  eventType: XpEventType;
  points: number;
  description: string;
  actorName: string | null;
  occurredAtLabel: string;
}

export interface StudioXpViewModel {
  level: number;
  totalXp: number;
  xpToNextLevel: number;
  progressPercent: number;
  isAdmin: boolean;
  activities: StudioXpActivity[];
}

export function buildStudioXpViewModel(input: {
  totalXp: number;
  events: StudioXpEventSnapshot[];
  timezone: string;
  isAdmin: boolean;
}): StudioXpViewModel {
  const progress = getStudioProgress(input.totalXp);
  const date = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: input.timezone,
  });

  return {
    ...progress,
    isAdmin: input.isAdmin,
    activities: input.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      points: event.points,
      description: event.description,
      actorName: event.actorName,
      occurredAtLabel: date.format(new Date(event.createdAt)),
    })),
  };
}
