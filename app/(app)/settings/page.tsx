import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getStudioAccess } from "@/features/studio-access/application/get-studio-access";
import { StudioAccessWorkspace } from "@/features/studio-access/ui/studio-access-workspace";
import { Card } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { StatusPill } from "@/shared/ui/status-pill";

export default async function SettingsPage() {
  const member = await requireCurrentMember();
  const access =
    member.role === "admin" ? await getStudioAccess(member) : null;

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Studio settings"
        description="Organization context, staff invitations, and account access."
        action={<StatusPill tone="neutral">{member.role}</StatusPill>}
      />
      <section className="grid gap-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold">Organization</h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <Info label="Name" value={member.organization.name} />
              <Info label="Timezone" value={member.organization.timezone} />
              <Info label="Currency" value={member.organization.currencyCode} />
            </dl>
          </Card>
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Your permissions</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  What this account can manage inside CCAD HQ.
                </p>
              </div>
              <StatusPill tone={member.role === "admin" ? "success" : "info"}>
                {member.role}
              </StatusPill>
            </div>
            <p className="mt-5 text-sm leading-6">
              {member.role === "admin"
                ? "You can manage studio records, settings, invitations, and staff access."
                : "You can manage studio records. An admin manages invitations and staff access."}
            </p>
            {access && (
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <Info
                  label="Active staff"
                  value={String(
                    access.members.filter((candidate) => candidate.isActive)
                      .length,
                  )}
                />
                <Info
                  label="Pending invites"
                  value={String(
                    access.invitations.filter(
                      (invitation) => invitation.displayStatus === "pending",
                    ).length,
                  )}
                />
              </dl>
            )}
          </Card>
        </div>

        {access ? (
          <div className="grid gap-4">
            <div>
              <h2 className="text-lg font-semibold">Staff access</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Invite staff and keep CCAD account access current.
              </p>
            </div>
            <StudioAccessWorkspace
              access={access}
              timezone={member.organization.timezone}
            />
          </div>
        ) : (
          <Card>
            <h2 className="text-lg font-semibold">Staff access</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Admins manage staff invitations and account access from Settings.
            </p>
          </Card>
        )}
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
