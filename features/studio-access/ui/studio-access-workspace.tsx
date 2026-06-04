"use client";

import { ShieldCheck, UserPlus, UsersRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createStudioInvitation,
  revokeStudioInvitation,
  updateStudioMemberAccess,
  type StudioAccessActionResult,
} from "@/features/studio-access/application/actions";
import {
  formatAccessDate,
  type StudioAccessViewModel,
  type StudioInvitationView,
  type StudioMemberView,
} from "@/features/studio-access/domain/studio-access";
import type { MemberRole } from "@/shared/database/database.types";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function StudioAccessWorkspace({
  access,
  timezone,
}: {
  access: StudioAccessViewModel;
  timezone: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("staff");
  const [message, setMessage] = useState<string | null>(null);

  function runAction(
    action: () => Promise<StudioAccessActionResult>,
    successMessage: string,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update Studio Access.");
        return;
      }
      setMessage(successMessage);
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      {message && (
        <p
          aria-live="polite"
          className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
        >
          {message}
        </p>
      )}

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Invite staff</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Invitations allow the email address to request a CCAD magic
                link for 14 days.
              </p>
            </div>
            <UserPlus className="size-5 text-accent" aria-hidden="true" />
          </div>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(
                () => createStudioInvitation({ email, role }),
                "Invitation ready. Ask the staff member to request a magic link.",
                () => setEmail(""),
              );
            }}
          >
            <label className="grid gap-2 text-sm font-medium">
              Email address
              <input
                className={fieldClass}
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="staff@example.com"
              />
            </label>
            <RoleSelect value={role} onChange={setRole} />
            <Button disabled={isPending || !email.trim()} type="submit">
              <UserPlus aria-hidden="true" />
              Create invitation
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Members</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                CCAD must always retain at least one active admin.
              </p>
            </div>
            <UsersRound className="size-5 text-accent" aria-hidden="true" />
          </div>
          <div className="mt-5 grid gap-3">
            {access.members.map((member) => (
              <MemberAccessCard
                key={member.id}
                member={member}
                timezone={timezone}
                disabled={isPending}
                onUpdate={(nextRole, isActive) =>
                  runAction(
                    () =>
                      updateStudioMemberAccess({
                        memberId: member.id,
                        role: nextRole,
                        isActive,
                      }),
                    `${member.displayName}'s access was updated.`,
                  )
                }
              />
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Invitation history</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Access changes also remain in the append-only database history.
            </p>
          </div>
          <ShieldCheck className="size-5 text-accent" aria-hidden="true" />
        </div>
        <div className="mt-5 divide-y divide-border">
          {access.invitations.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No staff invitations have been created.
            </p>
          ) : (
            access.invitations.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                timezone={timezone}
                disabled={isPending}
                onRevoke={() =>
                  window.confirm(`Revoke the invitation for ${invitation.email}?`) &&
                  runAction(
                    () => revokeStudioInvitation(invitation.id),
                    `Invitation for ${invitation.email} was revoked.`,
                  )
                }
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function MemberAccessCard({
  member,
  timezone,
  disabled,
  onUpdate,
}: {
  member: StudioMemberView;
  timezone: string;
  disabled: boolean;
  onUpdate: (role: MemberRole, isActive: boolean) => void;
}) {
  const [role, setRole] = useState(member.role);
  const changed = role !== member.role;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{member.displayName}</p>
          {member.isCurrent && <StatusPill tone="info">You</StatusPill>}
          <StatusPill tone={member.isActive ? "success" : "neutral"}>
            {member.isActive ? "Active" : "Inactive"}
          </StatusPill>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Joined {formatAccessDate(member.joinedAt, timezone)}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <RoleSelect value={role} onChange={setRole} compact />
        {changed && (
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => onUpdate(role, member.isActive)}
          >
            Save role
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled || (member.isCurrent && member.isActive)}
          onClick={() => {
            if (
              member.isActive &&
              !window.confirm(`Deactivate ${member.displayName}'s access?`)
            ) {
              return;
            }
            onUpdate(role, !member.isActive);
          }}
        >
          {member.isActive ? "Deactivate" : "Reactivate"}
        </Button>
      </div>
    </div>
  );
}

function InvitationRow({
  invitation,
  timezone,
  disabled,
  onRevoke,
}: {
  invitation: StudioInvitationView;
  timezone: string;
  disabled: boolean;
  onRevoke: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{invitation.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {capitalize(invitation.role)} invitation created{" "}
          {formatAccessDate(invitation.createdAt, timezone)}
          {invitation.invitedByName
            ? ` by ${invitation.invitedByName}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill tone={invitationTone(invitation.displayStatus)}>
          {capitalize(invitation.displayStatus)}
        </StatusPill>
        {invitation.status === "pending" && (
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={onRevoke}
          >
            <X aria-hidden="true" />
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
  compact = false,
}: {
  value: MemberRole;
  onChange: (role: MemberRole) => void;
  compact?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {!compact && "Role"}
      <select
        className={`${fieldClass} ${compact ? "min-h-9 py-1 text-xs" : ""}`}
        value={value}
        aria-label={compact ? "Member role" : undefined}
        onChange={(event) => onChange(event.target.value as MemberRole)}
      >
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>
    </label>
  );
}

function invitationTone(status: StudioInvitationView["displayStatus"]) {
  if (status === "accepted") return "success";
  if (status === "pending") return "info";
  if (status === "expired") return "warning";
  return "neutral";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}
