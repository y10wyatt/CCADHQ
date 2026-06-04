import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { SupabaseDashboardQuery } from "@/features/dashboard/infrastructure/supabase-dashboard-query";
import { DashboardOverview } from "@/features/dashboard/ui/dashboard-overview";
import { PageHeader } from "@/shared/ui/page-header";

export default async function HomePage() {
  const member = await requireCurrentMember();
  const dashboard = await new SupabaseDashboardQuery(member).getOverview();

  return (
    <>
      <PageHeader
        eyebrow={dashboard.dateLabel}
        title={dashboard.greeting}
        description="A quick read on what needs attention across the studio."
      />
      <DashboardOverview dashboard={dashboard} />
    </>
  );
}
