export const presenceStatuses = [
  "online",
  "focusing",
  "break",
  "away",
] as const;

export const presenceLocations = [
  "home",
  "focus_room",
  "tasks",
  "finance",
  "pixel_office",
] as const;

export type PresenceStatus = (typeof presenceStatuses)[number];
export type PresenceLocation = (typeof presenceLocations)[number];
export type PresenceConnectionState =
  | "connecting"
  | "live"
  | "stale"
  | "unavailable";

export interface PixelOfficePosition {
  leftPercent: number;
  topPercent: number;
}

export interface PresencePayload {
  memberId: string;
  displayName: string;
  avatarUrl: string | null;
  status: PresenceStatus;
  location: PresenceLocation;
  focusSessionId: string | null;
  pixelOfficePosition: PixelOfficePosition | null;
  updatedAt: string;
  clientId: string;
  version: 1;
}

export interface PresenceMember {
  memberId: string;
  displayName: string;
  avatarUrl: string | null;
  status: PresenceStatus;
  location: PresenceLocation;
  pixelOfficePosition: PixelOfficePosition | null;
  updatedAt: string;
}

export interface PresenceFocusState {
  id: string;
  kind: "focus" | "short_break" | "long_break";
  state: "running" | "paused";
}

const statusPriority: Record<PresenceStatus, number> = {
  focusing: 4,
  break: 3,
  online: 2,
  away: 1,
};

export function derivePresenceStatus(
  focusState: PresenceFocusState | null,
  isAway: boolean,
): PresenceStatus {
  if (focusState?.state === "running") {
    return focusState.kind === "focus" ? "focusing" : "break";
  }

  return isAway ? "away" : "online";
}

export function getPresenceLocation(pathname: string): PresenceLocation {
  if (pathname.startsWith("/focus-room")) return "focus_room";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/pixel-office")) return "pixel_office";
  return "home";
}

export function normalizePresenceState(
  state: Record<string, unknown[]>,
): PresenceMember[] {
  const byMember = new Map<string, PresencePayload[]>();

  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      if (!isPresencePayload(entry)) continue;
      const existing = byMember.get(entry.memberId) ?? [];
      existing.push(entry);
      byMember.set(entry.memberId, existing);
    }
  }

  return [...byMember.values()]
    .map(normalizeMember)
    .sort((left, right) => {
      const priorityDifference =
        statusPriority[right.status] - statusPriority[left.status];
      return (
        priorityDifference || left.displayName.localeCompare(right.displayName)
      );
    });
}

export function isPresencePayload(value: unknown): value is PresencePayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PresencePayload>;

  return (
    candidate.version === 1 &&
    typeof candidate.memberId === "string" &&
    typeof candidate.displayName === "string" &&
    (candidate.avatarUrl === null || typeof candidate.avatarUrl === "string") &&
    presenceStatuses.includes(candidate.status as PresenceStatus) &&
    presenceLocations.includes(candidate.location as PresenceLocation) &&
    (candidate.focusSessionId === null ||
      typeof candidate.focusSessionId === "string") &&
    (candidate.pixelOfficePosition === undefined ||
      candidate.pixelOfficePosition === null ||
      isPixelOfficePosition(candidate.pixelOfficePosition)) &&
    typeof candidate.updatedAt === "string" &&
    !Number.isNaN(Date.parse(candidate.updatedAt)) &&
    typeof candidate.clientId === "string"
  );
}

function normalizeMember(entries: PresencePayload[]): PresenceMember {
  const status = entries.reduce(
    (highest, entry) =>
      statusPriority[entry.status] > statusPriority[highest]
        ? entry.status
        : highest,
    entries[0].status,
  );
  const mostRecent =
    [...entries]
      .filter((entry) => entry.status !== "away")
      .sort(compareUpdatedAt)[0] ?? [...entries].sort(compareUpdatedAt)[0];

  return {
    memberId: mostRecent.memberId,
    displayName: mostRecent.displayName,
    avatarUrl: mostRecent.avatarUrl,
    status,
    location: mostRecent.location,
    pixelOfficePosition: mostRecent.pixelOfficePosition ?? null,
    updatedAt: mostRecent.updatedAt,
  };
}

function compareUpdatedAt(left: PresencePayload, right: PresencePayload) {
  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}

function isPixelOfficePosition(
  value: unknown,
): value is PixelOfficePosition {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PixelOfficePosition>;

  return (
    typeof candidate.leftPercent === "number" &&
    Number.isFinite(candidate.leftPercent) &&
    candidate.leftPercent >= 0 &&
    candidate.leftPercent <= 100 &&
    typeof candidate.topPercent === "number" &&
    Number.isFinite(candidate.topPercent) &&
    candidate.topPercent >= 0 &&
    candidate.topPercent <= 100
  );
}
