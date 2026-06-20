import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getLeadBoard } from "@/features/leads/application/get-leads";
import { LeadsWorkspace } from "@/features/leads/ui/leads-workspace";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function LeadsPage() {
  const member = await requireCurrentMember();
  const board = await getLeadBoard(member);

  return (
    <>
      <PageHeader
        eyebrow="Leads"
        title="Admissions pipeline"
        description="Prospective students, parent conversations, follow-ups, and expected enrollment revenue."
        action={<StatusPill tone="info">{board.metrics.activeLeads} active leads</StatusPill>}
      />
      <LeadsWorkspace board={board} />
    </>
  );
}
