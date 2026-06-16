import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getResources } from "@/features/resources/application/get-resources";
import { ResourcesWorkspace } from "@/features/resources/ui/resources-workspace";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function ResourcesPage() {
  const member = await requireCurrentMember();
  const resources = await getResources(member);

  return (
    <>
      <PageHeader
        eyebrow="Studio reference shelf"
        title="Resources"
        description="Quickly jump to meeting notes, Google Docs, folders, references, and internal links without digging through old messages."
        action={<StatusPill tone="info">{resources.length} links</StatusPill>}
      />
      <ResourcesWorkspace resources={resources} />
    </>
  );
}
