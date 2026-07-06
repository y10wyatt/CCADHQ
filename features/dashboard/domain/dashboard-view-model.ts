import type { CharacterSummary } from "@/features/character-xp/domain/character-xp";
import type {
  LeadOverviewMetrics,
  LeadSourceReport,
} from "@/features/leads/domain/leads";
import type { WeeklyQuestView } from "@/features/weekly-quests/domain/weekly-quests";
import type { DashboardStudentPlanItem } from "@/features/dashboard/domain/student-plan";

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
  actorName: string;
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
  studentPlan: DashboardStudentPlanItem[];
  leadsOverview: LeadOverviewMetrics & {
    currencyCode: string;
  };
  leadSourceReports: LeadSourceReport[];
  characters: CharacterSummary[];
  weeklyQuests: WeeklyQuestView[];
  activities: DashboardActivity[];
}
