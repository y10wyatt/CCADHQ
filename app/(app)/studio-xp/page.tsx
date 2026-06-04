import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getStudioXp } from "@/features/studio-xp/application/get-studio-xp";
import { StudioXpOverview } from "@/features/studio-xp/ui/studio-xp-overview";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function StudioXpPage() {
  const member = await requireCurrentMember();
  const studio = await getStudioXp(member);

  return (
    <>
      <PageHeader
        eyebrow="Studio XP"
        title="CCAD levels up together"
        description="Shared operational progress without individual scores, levels, or leaderboards."
        action={
          <StatusPill tone="info">
            Level {studio.level} | {studio.totalXp} XP
          </StatusPill>
        }
      />
      <StudioXpOverview studio={studio} />
    </>
  );
}
