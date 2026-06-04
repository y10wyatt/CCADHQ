import type {
  InvitationStatus,
  MemberRole,
} from "@/shared/database/database.types";

export interface StudioMemberView {
  id: string;
  displayName: string;
  role: MemberRole;
  isActive: boolean;
  isCurrent: boolean;
  joinedAt: string;
}

export interface StudioInvitationView {
  id: string;
  email: string;
  role: MemberRole;
  status: InvitationStatus;
  displayStatus: InvitationStatus;
  invitedByName: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface StudioAccessViewModel {
  members: StudioMemberView[];
  invitations: StudioInvitationView[];
}

export function getInvitationDisplayStatus(
  status: InvitationStatus,
  expiresAt: string | null,
  nowMs = Date.now(),
): InvitationStatus {
  if (
    status === "pending" &&
    expiresAt &&
    Date.parse(expiresAt) <= nowMs
  ) {
    return "expired";
  }

  return status;
}

export function formatAccessDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeZone: timezone,
  }).format(new Date(value));
}
