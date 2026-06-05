import type { DashboardViewModel } from "@/features/dashboard/domain/dashboard-view-model";
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
  recentXpEvents: Array<{
    id: string;
    description: string;
    points: number;
    createdAt: string;
  }>;
}

export function buildDashboardViewModel(
  snapshot: DashboardSnapshot,
): DashboardViewModel {
  const progress = getStudioProgress(snapshot.totalXp);
  const currency = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: snapshot.currencyCode,
  });
  const date = new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: snapshot.timezone,
  });
  const activityDate = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: snapshot.timezone,
  });
  const incomeMinor = sumFinance(snapshot.financeEntries, "income");
  const expenseMinor = sumFinance(snapshot.financeEntries, "expense");
  const netMinor = incomeMinor - expenseMinor;

  return {
    dateLabel: date.format(snapshot.now),
    greeting: `${getGreeting(snapshot.now, snapshot.timezone)}, ${getShortOrganizationName(snapshot.organizationName)}`,
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
        label: `${getMonthName(snapshot.now, snapshot.timezone)} net`,
        value: currency.format(netMinor / 100),
        detail: `Income ${currency.format(incomeMinor / 100)} | Expenses ${currency.format(expenseMinor / 100)}`,
        href: "/finance",
        tone: netMinor > 0 ? "success" : netMinor < 0 ? "warning" : "neutral",
      },
    ],
    characters: buildPlaceholderCharacters(),
    weeklyQuests: buildPlaceholderWeeklyQuests(),
    activities: snapshot.recentXpEvents.map((event) => ({
      id: event.id,
      description: event.description,
      occurredAtLabel: `${event.points > 0 ? "+" : ""}${event.points} XP | ${activityDate.format(new Date(event.createdAt))}`,
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
    new Intl.DateTimeFormat("en-CA", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: timezone,
    }).format(now),
  );

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getMonthName(now: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    timeZone: timezone,
  }).format(now);
}

function getShortOrganizationName(organizationName: string) {
  return organizationName === "Cloud Centre of Art & Design"
    ? "CCAD"
    : organizationName;
}

function buildPlaceholderCharacters() {
  return [
    {
      id: "william",
      name: "William",
      avatarSrc: "/placeholders/william-avatar.svg",
      level: 4,
      characterXp: 360,
      xpToNextLevel: 140,
      streakLabel: "3-day focus streak",
      focusLabel: "5 focus sessions",
      taskLabel: "8 tasks completed",
    },
    {
      id: "alice",
      name: "Alice",
      avatarSrc: "/placeholders/alice-avatar.svg",
      level: 3,
      characterXp: 240,
      xpToNextLevel: 160,
      streakLabel: "2-day focus streak",
      focusLabel: "4 focus sessions",
      taskLabel: "6 tasks completed",
    },
  ];
}

function buildPlaceholderWeeklyQuests() {
  return [
    {
      id: "quest-stability",
      title: "Close the weekly studio admin loop",
      stat: "Stability",
      rewardLabel: "+250 Studio XP",
      progressLabel: "3 of 5 steps",
      progressPercent: 60,
    },
    {
      id: "quest-reputation",
      title: "Prepare one public student-work highlight",
      stat: "Reputation",
      rewardLabel: "+250 Studio XP",
      progressLabel: "1 of 3 steps",
      progressPercent: 33,
    },
  ];
}
