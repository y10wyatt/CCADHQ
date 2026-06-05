export type DashboardTone = "neutral" | "info" | "success" | "warning";

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  href: string;
  tone: DashboardTone;
}

export interface DashboardActivity {
  id: string;
  description: string;
  occurredAtLabel: string;
  tone: DashboardTone;
}

export interface DashboardCharacter {
  id: string;
  name: string;
  avatarSrc: string;
  level: number;
  characterXp: number;
  xpToNextLevel: number;
  streakLabel: string;
  focusLabel: string;
  taskLabel: string;
}

export interface DashboardWeeklyQuest {
  id: string;
  title: string;
  stat: string;
  rewardLabel: string;
  progressLabel: string;
  progressPercent: number;
}

export interface DashboardViewModel {
  dateLabel: string;
  greeting: string;
  studioLevel: number;
  totalXp: number;
  xpToNextLevel: number;
  xpProgressPercent: number;
  metrics: DashboardMetric[];
  characters: DashboardCharacter[];
  weeklyQuests: DashboardWeeklyQuest[];
  activities: DashboardActivity[];
}
