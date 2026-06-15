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
        title="Content operations wall"
        description="Account identities, content lanes, and publishing roadmap for Xiaohongshu and social media planning."
        action={<StatusPill tone="info">4 account identities</StatusPill>}
      />
      <MarketingDashboard data={marketing} />
    </>
  );
}
