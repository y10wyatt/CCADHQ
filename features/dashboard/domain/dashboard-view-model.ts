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

export interface DashboardViewModel {
  dateLabel: string;
  greeting: string;
  studioLevel: number;
  totalXp: number;
  xpToNextLevel: number;
  xpProgressPercent: number;
  metrics: DashboardMetric[];
  activities: DashboardActivity[];
}
