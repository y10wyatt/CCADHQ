import Link from "next/link";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { Card } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function SettingsPage() {
  const member = await requireCurrentMember();

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Studio settings"
        description="Organization-level context used across CCAD HQ."
        action={<StatusPill tone="neutral">{member.role}</StatusPill>}
      />
      <section className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Organization</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <Info label="Name" value={member.organization.name} />
            <Info label="Timezone" value={member.organization.timezone} />
            <Info label="Currency" value={member.organization.currencyCode} />
          </dl>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Access</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Staff invitations and permissions are managed from Team.
          </p>
          <Link
            href="/team"
            className="mt-5 inline-flex rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm font-medium transition-colors hover:border-accent/60 hover:bg-muted"
          >
            Open Team
          </Link>
        </Card>
      </section>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 leading-6">{value}</dd>
    </div>
  );
}
