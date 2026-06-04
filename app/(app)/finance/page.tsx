import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getFinance } from "@/features/finance/application/get-finance";
import { FinanceWorkspace } from "@/features/finance/ui/finance-workspace";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function FinancePage() {
  const member = await requireCurrentMember();
  const finance = await getFinance(member);
  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Monthly studio snapshot"
        description="Review income and expenses, record manual entries, and keep a durable internal history."
        action={
          <StatusPill tone="neutral">{finance.currencyCode} ledger</StatusPill>
        }
      />
      <FinanceWorkspace finance={finance} />
    </>
  );
}
