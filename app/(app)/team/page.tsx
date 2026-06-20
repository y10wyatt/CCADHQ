import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getStudioAccess } from "@/features/studio-access/application/get-studio-access";
import { StudioAccessWorkspace } from "@/features/studio-access/ui/studio-access-workspace";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function TeamPage() {
  const member = await requireCurrentMember();
  const access = await getStudioAccess(member);

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Staff access"
        description="Invite staff and keep CCAD account access current."
        action={<StatusPill tone="info">Admin only</StatusPill>}
      />
      <StudioAccessWorkspace
        access={access}
        timezone={member.organization.timezone}
      />
    </>
  );
}
