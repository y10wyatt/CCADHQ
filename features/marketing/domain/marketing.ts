import type { MarketingOwner } from "@/shared/database/database.types";

export type MarketingAccountId = "ccad" | "william" | "alice" | "mascot";

export type MarketingStatus =
  | "Idea Bank"
  | "Selected This Week"
  | "Script Needed"
  | "Ready to Film"
  | "Editing"
  | "Scheduled"
  | "Posted"
  | "Review Performance";

export interface ContentIdea {
  id: string;
  title: string;
  account: MarketingAccountId;
  owner: MarketingOwner;
  lane: string;
  audience: string;
  format: string;
  priority: "High" | "Medium" | "Low";
  deadline: string;
  cta: string;
  status: MarketingStatus;
  notes: string;
}

export interface MarketingDashboardData {
  workflowStatuses: MarketingStatus[];
  ideas: ContentIdea[];
}

export const accountLabels: Record<MarketingAccountId, string> = {
  ccad: "CCAD",
  william: "William",
  alice: "Alice",
  mascot: "Mascot",
};

export const marketingStatuses: MarketingStatus[] = [
  "Idea Bank",
  "Selected This Week",
  "Script Needed",
  "Ready to Film",
  "Editing",
  "Scheduled",
  "Posted",
  "Review Performance",
];
