import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { buildDashboardViewModel } from "@/features/dashboard/application/build-dashboard-view-model";
import { SupabaseDashboardQuery } from "@/features/dashboard/infrastructure/supabase-dashboard-query";
import { DashboardOverview } from "@/features/dashboard/ui/dashboard-overview";
import { getStudioNotes } from "@/features/studio-notes/application/get-studio-notes";
import { PageHeader } from "@/shared/ui/page-header";

export default async function HomePage() {
  const member = await requireCurrentMember();
  const [dashboardResult, studioNotesResult] = await Promise.allSettled([
    new SupabaseDashboardQuery(member).getOverview(),
    getStudioNotes(member),
  ]);
  const dashboard =
    dashboardResult.status === "fulfilled"
      ? dashboardResult.value
      : buildFallbackDashboard(member);
  const studioNotes =
    studioNotesResult.status === "fulfilled" ? studioNotesResult.value : [];

  if (dashboardResult.status === "rejected") {
    console.error("Home dashboard fallback rendered", dashboardResult.reason);
  }

  if (studioNotesResult.status === "rejected") {
    console.error("Studio notes fallback rendered", studioNotesResult.reason);
  }

  return (
    <>
      <PageHeader
        eyebrow={dashboard.dateLabel}
        title={dashboard.greeting}
        description="A quick read on what needs attention across the studio."
      />
      <DashboardOverview dashboard={dashboard} studioNotes={studioNotes} />
    </>
  );
}

function buildFallbackDashboard(member: Awaited<ReturnType<typeof requireCurrentMember>>) {
  return buildDashboardViewModel({
    organizationName: member.organization.name,
    timezone: member.organization.timezone,
    currencyCode: member.organization.currencyCode,
    now: new Date(),
    outstandingTaskCount: 0,
    priorityTaskCount: 0,
    totalXp: 0,
    financeEntries: [],
    leads: [],
    recentXpEvents: [],
    characters: [],
    weeklyQuests: [],
  });
}
