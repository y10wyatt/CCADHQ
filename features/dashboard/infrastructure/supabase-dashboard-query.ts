import type { CurrentMember } from "@/features/auth/domain/current-member";
import { buildCharacterSummaries } from "@/features/character-xp/domain/character-xp";
import { buildDashboardViewModel } from "@/features/dashboard/application/build-dashboard-view-model";
import type { DashboardQuery } from "@/features/dashboard/application/dashboard-query";
import type { DashboardViewModel } from "@/features/dashboard/domain/dashboard-view-model";
import type { LeadView } from "@/features/leads/domain/leads";
import type { Database } from "@/shared/database/database.types";
import { getWeeklyQuests } from "@/features/weekly-quests/application/get-weekly-quests";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

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

    const [
      outstandingTasks,
      priorityTasks,
      xpTotal,
      recentXp,
      financeEntries,
      leads,
      members,
      characterXpEvents,
      weeklyQuests,
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .neq("status", "done")
        .is("archived_at", null),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .neq("status", "done")
        .in("priority", ["high", "urgent"])
        .is("archived_at", null),
      supabase
        .from("xp_events")
        .select("points")
        .eq("organization_id", organizationId),
      supabase
        .from("xp_events")
        .select("id, description, points, actor_member_id, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("finance_entries")
        .select("entry_type, amount_minor")
        .eq("organization_id", organizationId)
        .gte("entry_date", monthRange.start)
        .lt("entry_date", monthRange.end)
        .is("archived_at", null),
      supabase
        .from("leads")
        .select("*")
        .eq("organization_id", organizationId),
      supabase
        .from("organization_members")
        .select(
          "id, profile:profiles!organization_members_user_id_fkey(display_name, avatar_url)",
        )
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("joined_at"),
      supabase
        .from("character_xp_events")
        .select("member_id, event_type, points")
        .eq("organization_id", organizationId),
      getWeeklyQuests(this.member),
    ]);

    const firstError = [
      outstandingTasks.error,
      priorityTasks.error,
      xpTotal.error,
      recentXp.error,
      financeEntries.error,
      leads.error,
      members.error,
      characterXpEvents.error,
    ].find(Boolean);

    if (firstError) {
      throw new Error(`Unable to load Home dashboard: ${firstError.message}`);
    }

    const memberNames = new Map(
      (members.data ?? []).map((candidate) => [
        candidate.id,
        candidate.profile?.display_name ?? "Unnamed member",
      ]),
    );

    return buildDashboardViewModel({
      organizationName: this.member.organization.name,
      timezone: this.member.organization.timezone,
      currencyCode: this.member.organization.currencyCode,
      now: this.now,
      outstandingTaskCount: outstandingTasks.count ?? 0,
      priorityTaskCount: priorityTasks.count ?? 0,
      totalXp: (xpTotal.data ?? []).reduce(
        (total, event) => total + event.points,
        0,
      ),
      financeEntries: (financeEntries.data ?? []).map((entry) => ({
        entryType: entry.entry_type,
        amountMinor: entry.amount_minor,
      })),
      leads: (leads.data ?? []).map(mapLead),
      characters: buildCharacterSummaries({
        members: (members.data ?? []).map((candidate) => ({
          id: candidate.id,
          name: candidate.profile?.display_name ?? "Unnamed member",
          avatarUrl: candidate.profile?.avatar_url ?? null,
        })),
        events: (characterXpEvents.data ?? []).map((event) => ({
          memberId: event.member_id,
          eventType: event.event_type,
          points: event.points,
        })),
      }),
      weeklyQuests,
      recentXpEvents: (recentXp.data ?? []).map((event) => ({
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
