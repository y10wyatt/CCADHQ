import type {
  LeadAssignedStaff,
  LeadSource,
  LeadStatus,
} from "@/shared/database/database.types";

export type { LeadAssignedStaff, LeadSource, LeadStatus };

export const leadStatuses: LeadStatus[] = [
  "New Inquiry",
  "Contacted",
  "Consultation Booked",
  "Trial Class",
  "Proposal Sent",
  "Enrolled",
  "Lost",
];

export const activeLeadStatuses: LeadStatus[] = leadStatuses.filter(
  (status) => status !== "Enrolled" && status !== "Lost",
);

export const leadSources: LeadSource[] = [
  "Website",
  "Referral",
  "Xiaohongshu",
  "Instagram",
  "Workshop",
  "RISD Event",
  "Other",
];

export const leadAssignedStaffOptions: LeadAssignedStaff[] = [
  "William",
  "Alice",
  "Gerald",
  "Team",
  "Other",
];

export type FollowUpState = "overdue" | "due-today" | "due-soon" | "scheduled";

export interface LeadView {
  id: string;
  studentName: string;
  grade: string;
  school: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  programInterest: string;
  targetSchools: string[];
  goals: string;
  timeline: string;
  source: LeadSource;
  status: LeadStatus;
  potentialRevenueMinor: number;
  assignedStaff: LeadAssignedStaff;
  createdAt: string;
  lastContactedDate: string | null;
  nextFollowUpDate: string | null;
  notes: string;
  convertedStudentId: string | null;
  convertedAt: string | null;
}

export interface LeadActivityView {
  id: string;
  leadId: string;
  activityDate: string;
  title: string;
  notes: string;
  createdAt: string;
}

export interface LeadBoardView {
  leads: LeadView[];
  metrics: LeadOverviewMetrics;
  sourceReports: LeadSourceReport[];
  todayIso: string;
  currencyCode: string;
}

export interface LeadOverviewMetrics {
  activeLeads: number;
  newLeadsThisMonth: number;
  consultationsScheduled: number;
  enrolledThisMonth: number;
  conversionRate: number;
  pipelineRevenueMinor: number;
  followUpsDueToday: number;
  overdueFollowUps: number;
}

export interface LeadSourceReport {
  source: LeadSource;
  leads: number;
  enrollments: number;
  conversionRate: number;
  revenueMinor: number;
}

export function buildLeadOverviewMetrics({
  leads,
  now,
}: {
  leads: LeadView[];
  now: Date;
}): LeadOverviewMetrics {
  const monthPrefix = now.toISOString().slice(0, 7);
  const todayIso = now.toISOString().slice(0, 10);
  const activeLeads = leads.filter((lead) => isActiveLead(lead)).length;
  const enrolledThisMonth = leads.filter(
    (lead) => lead.convertedAt?.startsWith(monthPrefix) ?? false,
  ).length;

  return {
    activeLeads,
    newLeadsThisMonth: leads.filter((lead) => lead.createdAt.startsWith(monthPrefix))
      .length,
    consultationsScheduled: leads.filter(
      (lead) => lead.status === "Consultation Booked",
    ).length,
    enrolledThisMonth,
    conversionRate:
      leads.length === 0 ? 0 : Math.round((enrolledThisMonth / leads.length) * 100),
    pipelineRevenueMinor: leads
      .filter(isActiveLead)
      .reduce((total, lead) => total + lead.potentialRevenueMinor, 0),
    followUpsDueToday: leads.filter(
      (lead) => isActiveLead(lead) && lead.nextFollowUpDate === todayIso,
    ).length,
    overdueFollowUps: leads.filter(
      (lead) =>
        isActiveLead(lead) &&
        lead.nextFollowUpDate !== null &&
        lead.nextFollowUpDate < todayIso,
    ).length,
  };
}

export function buildLeadSourceReports(leads: LeadView[]): LeadSourceReport[] {
  return leadSources.map((source) => {
    const sourceLeads = leads.filter((lead) => lead.source === source);
    const enrollments = sourceLeads.filter(
      (lead) => lead.status === "Enrolled" || lead.convertedStudentId,
    );

    return {
      source,
      leads: sourceLeads.length,
      enrollments: enrollments.length,
      conversionRate:
        sourceLeads.length === 0
          ? 0
          : Math.round((enrollments.length / sourceLeads.length) * 100),
      revenueMinor: enrollments.reduce(
        (total, lead) => total + lead.potentialRevenueMinor,
        0,
      ),
    };
  });
}

export function getFollowUpState(
  nextFollowUpDate: string | null,
  todayIso: string,
): FollowUpState {
  if (!nextFollowUpDate) return "scheduled";
  if (nextFollowUpDate < todayIso) return "overdue";
  if (nextFollowUpDate === todayIso) return "due-today";

  const today = new Date(`${todayIso}T00:00:00.000Z`);
  const followUp = new Date(`${nextFollowUpDate}T00:00:00.000Z`);
  const daysUntil = Math.ceil(
    (followUp.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  return daysUntil <= 3 ? "due-soon" : "scheduled";
}

export function isActiveLead(lead: Pick<LeadView, "status" | "convertedStudentId">) {
  return lead.status !== "Enrolled" && lead.status !== "Lost" && !lead.convertedStudentId;
}

export function formatMoney(minor: number, currencyCode: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}
