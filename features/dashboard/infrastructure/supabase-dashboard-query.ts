import type { CurrentMember } from "@/features/auth/domain/current-member";
import { buildDashboardViewModel } from "@/features/dashboard/application/build-dashboard-view-model";
import type { DashboardQuery } from "@/features/dashboard/application/dashboard-query";
import type { DashboardViewModel } from "@/features/dashboard/domain/dashboard-view-model";
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
        .select("id, description, points, created_at")
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
    ]);

    const firstError = [
      outstandingTasks.error,
      priorityTasks.error,
      xpTotal.error,
      recentXp.error,
      financeEntries.error,
    ].find(Boolean);

    if (firstError) {
      throw new Error(`Unable to load Home dashboard: ${firstError.message}`);
    }

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
      recentXpEvents: (recentXp.data ?? []).map((event) => ({
        id: event.id,
        description: event.description,
        points: event.points,
        createdAt: event.created_at,
      })),
    });
  }
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
