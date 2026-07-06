import { Suspense } from "react";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { buildDashboardViewModel } from "@/features/dashboard/application/build-dashboard-view-model";
import { SupabaseDashboardQuery } from "@/features/dashboard/infrastructure/supabase-dashboard-query";
import { DashboardOverview } from "@/features/dashboard/ui/dashboard-overview";
import { getStudioNotes } from "@/features/studio-notes/application/get-studio-notes";
import { CardSkeleton, SkeletonBlock } from "@/shared/ui/skeleton";
import { PageHeader } from "@/shared/ui/page-header";

export default async function HomePage() {
  const member = await requireCurrentMember();

  return (
    <>
      <PageHeader
        eyebrow="Studio overview"
        title={`Welcome back, ${member.displayName}`}
        description="Finances, work needing attention, student plans, and admissions at a glance."
      />
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent member={member} />
      </Suspense>
    </>
  );
}

async function DashboardContent({
  member,
}: {
  member: Awaited<ReturnType<typeof requireCurrentMember>>;
}) {
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

  return <DashboardOverview dashboard={dashboard} studioNotes={studioNotes} />;
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
    studentPlan: [],
    financeEntries: [],
    leads: [],
    recentXpEvents: [],
    characters: [],
    weeklyQuests: [],
  });
}

function DashboardLoading() {
  return (
    <div aria-label="Loading dashboard summaries" className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <CardSkeleton key={item} />
        ))}
      </section>
      <SkeletonBlock className="h-72 rounded-xl" />
      <SkeletonBlock className="h-64 rounded-xl" />
    </div>
  );
}
