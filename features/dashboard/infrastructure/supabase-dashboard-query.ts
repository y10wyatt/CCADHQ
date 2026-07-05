import type { CurrentMember } from "@/features/auth/domain/current-member";
import { buildCharacterSummaries } from "@/features/character-xp/domain/character-xp";
import { buildDashboardViewModel } from "@/features/dashboard/application/build-dashboard-view-model";
import type { DashboardQuery } from "@/features/dashboard/application/dashboard-query";
import type { DashboardViewModel } from "@/features/dashboard/domain/dashboard-view-model";
import { buildDashboardStudentPlan } from "@/features/dashboard/domain/student-plan";
import type { LeadView } from "@/features/leads/domain/leads";
import type { Database } from "@/shared/database/database.types";
import {
  buildWeeklyQuestViews,
  type WeeklyQuestSnapshot,
} from "@/features/weekly-quests/domain/weekly-quests";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

interface DashboardOverviewPayload {
  outstanding_task_count: number;
  priority_task_count: number;
  total_xp: number;
  recent_xp: Array<{
    id: string;
    description: string;
    points: number;
    actor_member_id: string | null;
    created_at: string;
  }>;
  finance_entries: Array<{
    entry_type: "income" | "expense";
    amount_minor: number;
  }>;
  leads: Database["public"]["Tables"]["leads"]["Row"][];
  members: Array<{
    id: string;
    display_name: string;
    avatar_url: string | null;
  }>;
  character_xp_events: Array<{
    member_id: string;
    event_type: Database["public"]["Tables"]["character_xp_events"]["Row"]["event_type"];
    points: number;
  }>;
  weekly_quests: Database["public"]["Tables"]["weekly_quests"]["Row"][];
  students: Array<{
    id: string;
    name: string;
    status: Database["public"]["Tables"]["students"]["Row"]["status"];
    follow_up_needed: boolean;
    remaining_class_credits: number;
  }>;
  class_sessions: Array<{
    id: string;
    student_id: string;
    scheduled_start: string;
    status: Database["public"]["Tables"]["class_sessions"]["Row"]["status"];
    lesson_goal: string;
  }>;
  student_action_items: Array<{
    id: string;
    student_id: string;
    title: string;
    due_date: string | null;
    assigned_to: Database["public"]["Tables"]["student_action_items"]["Row"]["assigned_to"];
  }>;
}

export class SupabaseDashboardQuery implements DashboardQuery {
  constructor(
    private readonly member: CurrentMember,
    private readonly now = new Date(),
  ) {}

  async getOverview(): Promise<DashboardViewModel> {
    const supabase = await createServerSupabaseClient();
    const organizationId = this.member.organization.id;
    const monthRange = getOrganizationMonthRange(
      this.now,
      this.member.organization.timezone,
    );

    const startedAt = performance.now();
    const { data, error } = await supabase.rpc("get_dashboard_overview", {
      target_organization_id: organizationId,
      month_start: monthRange.start,
      month_end: monthRange.end,
    });

    if (error || !data) {
      throw new Error(
        `Unable to load Home dashboard: ${error?.message ?? "No data returned"}`,
      );
    }

    const overview = data as unknown as DashboardOverviewPayload;
    console.info("Dashboard overview loaded", {
      durationMs: Math.round(performance.now() - startedAt),
    });

    const memberNames = new Map(
      overview.members.map((candidate) => [
        candidate.id,
        candidate.display_name ?? "Unnamed member",
      ]),
    );
    const weeklyQuests = buildWeeklyQuestViews(
      overview.weekly_quests.map((quest) =>
        mapWeeklyQuest(quest, memberNames),
      ),
    );

    return buildDashboardViewModel({
      organizationName: this.member.organization.name,
      timezone: this.member.organization.timezone,
      currencyCode: this.member.organization.currencyCode,
      now: this.now,
      outstandingTaskCount: Number(overview.outstanding_task_count),
      priorityTaskCount: Number(overview.priority_task_count),
      totalXp: Number(overview.total_xp),
      studentPlan: buildDashboardStudentPlan({
        now: this.now,
        timezone: this.member.organization.timezone,
        students: overview.students.map((student) => ({
          id: student.id,
          name: student.name,
          status: student.status,
          followUpNeeded: student.follow_up_needed,
          remainingClassCredits: student.remaining_class_credits ?? 0,
        })),
        sessions: overview.class_sessions.map((session) => ({
          id: session.id,
          studentId: session.student_id,
          scheduledStart: session.scheduled_start,
          status: session.status,
          lessonGoal: session.lesson_goal,
        })),
        actionItems: overview.student_action_items.map((item) => ({
          id: item.id,
          studentId: item.student_id,
          title: item.title,
          dueDate: item.due_date,
          assignedTo: item.assigned_to,
        })),
      }),
      financeEntries: overview.finance_entries.map((entry) => ({
        entryType: entry.entry_type,
        amountMinor: entry.amount_minor,
      })),
      leads: overview.leads.map(mapLead),
      characters: buildCharacterSummaries({
        members: overview.members.map((candidate) => ({
          id: candidate.id,
          name: candidate.display_name ?? "Unnamed member",
          avatarUrl: candidate.avatar_url ?? null,
        })),
        events: overview.character_xp_events.map((event) => ({
          memberId: event.member_id,
          eventType: event.event_type,
          points: event.points,
        })),
      }),
      weeklyQuests,
      recentXpEvents: overview.recent_xp.map((event) => ({
        id: event.id,
        description: event.description,
        points: event.points,
        actorName: event.actor_member_id
          ? (memberNames.get(event.actor_member_id) ?? "Inactive member")
          : null,
        createdAt: event.created_at,
      })),
    });
  }
}

function mapLead(lead: Database["public"]["Tables"]["leads"]["Row"]): LeadView {
  return {
    id: lead.id,
    studentName: lead.student_name,
    grade: lead.grade,
    school: lead.school,
    parentName: lead.parent_name,
    parentEmail: lead.parent_email,
    parentPhone: lead.parent_phone,
    programInterest: lead.program_interest,
    targetSchools: lead.target_schools,
    goals: lead.goals,
    timeline: lead.timeline,
    source: lead.source,
    status: lead.status,
    potentialRevenueMinor: lead.potential_revenue_minor,
    assignedStaff: lead.assigned_staff,
    createdAt: lead.created_at,
    lastContactedDate: lead.last_contacted_date,
    nextFollowUpDate: lead.next_follow_up_date,
    notes: lead.notes,
    convertedStudentId: lead.converted_student_id,
    convertedAt: lead.converted_at,
  };
}

function mapWeeklyQuest(
  quest: Database["public"]["Tables"]["weekly_quests"]["Row"],
  memberNames: Map<string, string>,
): WeeklyQuestSnapshot {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    status: quest.status,
    studioStatKey: quest.studio_stat_key,
    xpValue: quest.xp_value,
    characterXpValue: quest.character_xp_value,
    progressCurrent: quest.progress_current,
    progressTarget: quest.progress_target,
    dueAt: quest.due_at,
    completedAt: quest.completed_at,
    completedByName: quest.completed_by_member_id
      ? (memberNames.get(quest.completed_by_member_id) ?? "Inactive member")
      : null,
    createdByName:
      memberNames.get(quest.created_by_member_id) ?? "Inactive member",
  };
}

export function getOrganizationMonthRange(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: timezone,
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return {
    start: `${year}-${String(month).padStart(2, "0")}-01`,
    end: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
}
