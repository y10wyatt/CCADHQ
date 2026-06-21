import type { DashboardViewModel } from "@/features/dashboard/domain/dashboard-view-model";
import type { CharacterSummary } from "@/features/character-xp/domain/character-xp";
import {
  buildLeadOverviewMetrics,
  buildLeadSourceReports,
  type LeadView,
} from "@/features/leads/domain/leads";
import type { WeeklyQuestView } from "@/features/weekly-quests/domain/weekly-quests";
import { getStudioProgress } from "@/features/dashboard/domain/studio-progress";

export interface DashboardSnapshot {
  organizationName: string;
  timezone: string;
  currencyCode: string;
  now: Date;
  outstandingTaskCount: number;
  priorityTaskCount: number;
  totalXp: number;
  financeEntries: Array<{
    entryType: "income" | "expense";
    amountMinor: number;
  }>;
  leads: LeadView[];
  recentXpEvents: Array<{
    id: string;
    description: string;
    points: number;
    actorName: string | null;
    createdAt: string;
  }>;
  characters: CharacterSummary[];
  weeklyQuests: WeeklyQuestView[];
}

export function buildDashboardViewModel(
  snapshot: DashboardSnapshot,
): DashboardViewModel {
  const progress = getStudioProgress(snapshot.totalXp);
  const currency = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: snapshot.currencyCode,
  });
  const safeNow = getSafeDate(snapshot.now);
  const date = createDateFormatter(
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: snapshot.timezone,
    },
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "America/Vancouver",
    },
  );
  const activityDate = createDateFormatter(
    {
      month: "short",
      day: "numeric",
      timeZone: snapshot.timezone,
    },
    {
      month: "short",
      day: "numeric",
      timeZone: "America/Vancouver",
    },
  );
  const incomeMinor = sumFinance(snapshot.financeEntries, "income");
  const expenseMinor = sumFinance(snapshot.financeEntries, "expense");
  const netMinor = incomeMinor - expenseMinor;

  return {
    dateLabel: date.format(safeNow),
    greeting: `${getGreeting(safeNow, snapshot.timezone)}, ${getShortOrganizationName(snapshot.organizationName)}`,
    studioLevel: progress.level,
    totalXp: progress.totalXp,
    xpToNextLevel: progress.xpToNextLevel,
    xpProgressPercent: progress.progressPercent,
    metrics: [
      {
        label: "Outstanding tasks",
        value: snapshot.outstandingTaskCount.toString(),
        detail:
          snapshot.priorityTaskCount === 0
            ? "No high or urgent tasks"
            : `${snapshot.priorityTaskCount} high or urgent`,
        href: "/tasks",
        tone: snapshot.priorityTaskCount > 0 ? "warning" : "neutral",
      },
      {
        label: "Studio XP",
        value: progress.totalXp.toString(),
        detail: `Level ${progress.level} | ${progress.xpToNextLevel} XP to level ${progress.level + 1}`,
        href: "/studio-xp",
        tone: "info",
      },
      {
        label: `${getMonthName(safeNow, snapshot.timezone)} net`,
        value: currency.format(netMinor / 100),
        detail: `Income ${currency.format(incomeMinor / 100)} | Expenses ${currency.format(expenseMinor / 100)}`,
        href: "/finance",
        tone: netMinor > 0 ? "success" : netMinor < 0 ? "warning" : "neutral",
      },
    ],
    leadsOverview: {
      ...buildLeadOverviewMetrics({ leads: snapshot.leads, now: safeNow }),
      currencyCode: snapshot.currencyCode,
    },
    leadSourceReports: buildLeadSourceReports(snapshot.leads),
    characters: snapshot.characters,
    weeklyQuests: snapshot.weeklyQuests,
    activities: snapshot.recentXpEvents.map((event) => ({
      id: event.id,
      description: event.description,
      actorName: event.actorName ?? "CCAD",
      occurredAtLabel: `${event.points > 0 ? "+" : ""}${event.points} XP | ${formatActivityDate(activityDate, event.createdAt)}`,
      tone: event.points > 0 ? "success" : "warning",
    })),
  };
}

function sumFinance(
  entries: DashboardSnapshot["financeEntries"],
  entryType: "income" | "expense",
) {
  return entries
    .filter((entry) => entry.entryType === entryType)
    .reduce((total, entry) => total + entry.amountMinor, 0);
}

function getGreeting(now: Date, timezone: string) {
  const hour = Number(
    createDateFormatter(
      {
        hour: "numeric",
        hourCycle: "h23",
        timeZone: timezone,
      },
      {
        hour: "numeric",
        hourCycle: "h23",
        timeZone: "America/Vancouver",
      },
    ).format(now),
  );

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getMonthName(now: Date, timezone: string) {
  return createDateFormatter(
    {
      month: "long",
      timeZone: timezone,
    },
    {
      month: "long",
      timeZone: "America/Vancouver",
    },
  ).format(now);
}

function getShortOrganizationName(organizationName: string) {
  return organizationName === "Cloud Centre of Art & Design"
    ? "CCAD"
    : organizationName;
}

function formatActivityDate(formatter: Intl.DateTimeFormat, value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "date unavailable";
  }

  return formatter.format(date);
}

function getSafeDate(value: Date) {
  return Number.isNaN(value.getTime()) ? new Date() : value;
}

function createDateFormatter(
  options: Intl.DateTimeFormatOptions,
  fallbackOptions: Intl.DateTimeFormatOptions,
) {
  try {
    return new Intl.DateTimeFormat("en-CA", options);
  } catch {
    return new Intl.DateTimeFormat("en-CA", fallbackOptions);
  }
}
