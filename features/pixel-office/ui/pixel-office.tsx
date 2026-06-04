import Image from "next/image";

import type {
  PresenceConnectionState,
  PresenceLocation,
  PresenceMember,
  PresenceStatus,
} from "@/features/presence/domain/presence";
import {
  buildPixelOfficeScene,
  pixelOfficeZoneLabel,
  type PixelOfficeOccupant,
} from "@/features/pixel-office/domain/pixel-office";
import { cn } from "@/shared/lib/cn";

interface PixelOfficeProps {
  members: PresenceMember[];
  connectionState: PresenceConnectionState;
}

export function PixelOffice({
  members,
  connectionState,
}: PixelOfficeProps) {
  const occupants = buildPixelOfficeScene(members);

  return (
    <figure className="grid gap-3">
      <div className="relative aspect-[16/9] min-h-56 overflow-hidden rounded-lg border border-border bg-background">
        <Image
          src="/placeholders/pixel-office-empty.svg"
          alt=""
          fill
          sizes="(min-width: 1280px) 32rem, 100vw"
          className="object-cover"
          priority={false}
        />

        {occupants.length === 0 ? (
          <div className="absolute inset-x-4 bottom-4 rounded-md border border-border bg-background/90 px-3 py-2 text-center text-xs text-muted-foreground backdrop-blur">
            {emptyMessage(connectionState)}
          </div>
        ) : (
          <ol aria-label="Pixel Office occupants">
            {occupants.map((occupant) => (
              <PixelOccupant key={occupant.memberId} occupant={occupant} />
            ))}
          </ol>
        )}
      </div>

      <figcaption className="text-xs leading-5 text-muted-foreground">
        {occupants.length === 0
          ? "The office remains optional while coworking presence is unavailable."
          : `${occupants.length} ${occupants.length === 1 ? "coworker" : "coworkers"} shown. Positions are a playful approximation, never attendance.`}
      </figcaption>
    </figure>
  );
}

function PixelOccupant({ occupant }: { occupant: PixelOfficeOccupant }) {
  return (
    <li
      className="absolute -translate-x-1/2 -translate-y-full list-none"
      style={{
        left: `${occupant.leftPercent}%`,
        top: `${occupant.topPercent}%`,
      }}
    >
      <div
        className={cn(
          "group relative flex flex-col items-center",
          occupant.status === "away" && "opacity-55",
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "absolute -inset-1 rounded-lg border",
            statusFrame(occupant.status),
          )}
        />
        {occupant.avatarUrl ? (
          <Image
            src={occupant.avatarUrl}
            alt=""
            width={40}
            height={40}
            className="relative size-9 rounded-md object-cover [image-rendering:pixelated] sm:size-10"
          />
        ) : (
          <span className="relative grid size-9 place-items-center rounded-md bg-card text-xs font-bold text-accent shadow-lg [image-rendering:pixelated] sm:size-10">
            {occupant.displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="relative mt-1 max-w-20 truncate rounded-sm bg-background/90 px-1.5 py-0.5 text-[0.6rem] font-semibold shadow-sm sm:text-[0.65rem]">
          {occupant.displayName}
        </span>
        <span className="relative mt-0.5 rounded-sm bg-background/90 px-1 py-0.5 text-[0.5rem] font-medium text-muted-foreground shadow-sm sm:text-[0.55rem]">
          {statusLabel(occupant.status)}
        </span>
        <span className="sr-only">
          {pixelOfficeZoneLabel(occupant.zone)}. Current app location:{" "}
          {locationLabel(occupant.location)}.
        </span>
      </div>
    </li>
  );
}

function statusFrame(status: PresenceStatus) {
  const frames: Record<PresenceStatus, string> = {
    online: "border-success/70 bg-success/15",
    focusing: "border-accent bg-accent/20",
    break: "border-warning/80 bg-warning/15",
    away: "border-border bg-muted/30",
  };

  return frames[status];
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

function emptyMessage(state: PresenceConnectionState) {
  if (state === "connecting") return "Opening the Pixel Office...";
  if (state === "stale") return "Pixel Office is reconnecting.";
  if (state === "unavailable") return "Pixel Office is unavailable right now.";
  return "The Pixel Office is quiet.";
}
