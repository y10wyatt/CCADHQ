"use client";

import Image from "next/image";
import { Radio, UsersRound } from "lucide-react";

import type {
  PresenceConnectionState,
  PresenceLocation,
  PresenceStatus,
} from "@/features/presence/domain/presence";
import { usePresence } from "@/features/presence/ui/presence-provider";
import { StatusPill } from "@/shared/ui/status-pill";

export function PresencePanel({ compact = false }: { compact?: boolean }) {
  const { members, connectionState } = usePresence();
  const focusingCount = members.filter(
    (member) => member.status === "focusing",
  ).length;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">
          {members.length === 0
            ? emptyLabel(connectionState)
            : `${members.length} ${members.length === 1 ? "person" : "people"} in the studio`}
        </p>
        <ConnectionPill state={connectionState} />
      </div>

      {members.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <Radio
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm leading-6 text-muted-foreground">
              {emptyDetail(connectionState)}
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid gap-2" aria-label="Coworking presence">
          {members.slice(0, compact ? 4 : undefined).map((member) => (
            <li
              key={member.memberId}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
            >
              {member.avatarUrl ? (
                <Image
                  src={member.avatarUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 rounded-md object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-md bg-background text-sm font-semibold text-accent"
                >
                  {member.displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {statusLabel(member.status)} | {locationLabel(member.location)}
                </p>
              </div>
              <StatusPill tone={statusTone(member.status)}>
                {statusLabel(member.status)}
              </StatusPill>
            </li>
          ))}
        </ul>
      )}

      {members.length > 0 && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <UsersRound className="size-3.5" aria-hidden="true" />
          {focusingCount > 0
            ? `${focusingCount} currently focusing. Status is approximate.`
            : "Coworking status is approximate and never used for attendance."}
        </p>
      )}
    </div>
  );
}

function ConnectionPill({ state }: { state: PresenceConnectionState }) {
  const labels: Record<PresenceConnectionState, string> = {
    connecting: "Connecting",
    live: "Live",
    stale: "Reconnecting",
    unavailable: "Unavailable",
  };

  return (
    <StatusPill
      tone={
        state === "live" ? "success" : state === "stale" ? "warning" : "neutral"
      }
    >
      {labels[state]}
    </StatusPill>
  );
}

function emptyLabel(state: PresenceConnectionState) {
  if (state === "connecting") return "Connecting to the studio";
  if (state === "stale") return "Last-known presence is stale";
  if (state === "unavailable") return "Presence is unavailable";
  return "The studio is quiet";
}

function emptyDetail(state: PresenceConnectionState) {
  if (state === "connecting") return "Coworking presence is joining now.";
  if (state === "stale") return "Trying to restore the realtime connection.";
  if (state === "unavailable") {
    return "Core workflows continue normally while realtime is unavailable.";
  }
  return "No connected coworkers are visible yet.";
}

function statusLabel(status: PresenceStatus) {
  const labels: Record<PresenceStatus, string> = {
    online: "Online",
    focusing: "Focusing",
    break: "On break",
    away: "Away",
  };
  return labels[status];
}

function locationLabel(location: PresenceLocation) {
  const labels: Record<PresenceLocation, string> = {
    home: "Home",
    focus_room: "Focus Room",
    tasks: "Tasks",
    finance: "Finance",
    pixel_office: "Pixel Office",
  };
  return labels[location];
}

function statusTone(status: PresenceStatus) {
  if (status === "focusing") return "info";
  if (status === "break") return "warning";
  if (status === "online") return "success";
  return "neutral";
}
