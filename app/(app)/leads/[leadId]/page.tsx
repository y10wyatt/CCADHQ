import Link from "next/link";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getLeadDetail } from "@/features/leads/application/get-leads";
import { LeadDetailWorkspace } from "@/features/leads/ui/lead-detail-workspace";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const member = await requireCurrentMember();
  const detail = await getLeadDetail(member, leadId);

  return (
    <>
      <PageHeader
        eyebrow="Lead detail"
        title={detail.lead.studentName}
        description="Admissions profile, parent contact context, timeline, and follow-up state."
        action={<StatusPill tone="info">{detail.lead.status}</StatusPill>}
      />
      <Link href="/leads" className="mb-5 inline-flex text-sm font-medium text-accent">
        Back to Leads
      </Link>
      <LeadDetailWorkspace
        lead={detail.lead}
        activities={detail.activities}
        todayIso={new Date().toISOString().slice(0, 10)}
        currencyCode={member.organization.currencyCode}
      />
    </>
  );
}
