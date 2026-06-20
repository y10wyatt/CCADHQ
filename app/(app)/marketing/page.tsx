import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getMarketingDashboard } from "@/features/marketing/application/get-marketing";
import { MarketingDashboard } from "@/features/marketing/ui/marketing-dashboard";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function MarketingPage() {
  const member = await requireCurrentMember();
  const marketing = await getMarketingDashboard(member);

  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        title="Content ideas"
        description="Create, edit, move, and archive real marketing content ideas."
        action={<StatusPill tone="info">{marketing.ideas.length} ideas</StatusPill>}
      />
      <MarketingDashboard data={marketing} />
    </>
  );
}
