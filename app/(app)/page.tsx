import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { SupabaseDashboardQuery } from "@/features/dashboard/infrastructure/supabase-dashboard-query";
import { DashboardOverview } from "@/features/dashboard/ui/dashboard-overview";
import { getStudioNotes } from "@/features/studio-notes/application/get-studio-notes";
import { PageHeader } from "@/shared/ui/page-header";

export default async function HomePage() {
  const member = await requireCurrentMember();
  const [dashboard, studioNotes] = await Promise.all([
    new SupabaseDashboardQuery(member).getOverview(),
    getStudioNotes(member),
  ]);

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
