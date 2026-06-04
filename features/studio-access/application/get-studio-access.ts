import { redirect } from "next/navigation";

import type { CurrentMember } from "@/features/auth/domain/current-member";
import {
  getInvitationDisplayStatus,
  type StudioAccessViewModel,
} from "@/features/studio-access/domain/studio-access";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getStudioAccess(
  member: CurrentMember,
): Promise<StudioAccessViewModel> {
  if (member.role !== "admin") redirect("/");

  const supabase = await createServerSupabaseClient();
  const organizationId = member.organization.id;
  const [members, invitations] = await Promise.all([
    supabase
      .from("organization_members")
      .select(
        "id, role, is_active, joined_at, profile:profiles!organization_members_user_id_fkey(display_name)",
      )
      .eq("organization_id", organizationId)
      .order("is_active", { ascending: false })
      .order("joined_at"),
    supabase
      .from("organization_invitations")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const firstError = [members.error, invitations.error].find(Boolean);
  if (firstError) {
    throw new Error(`Unable to load Studio Access: ${firstError.message}`);
  }

  const memberNames = new Map(
    (members.data ?? []).map((candidate) => [
      candidate.id,
      candidate.profile?.display_name ?? "Unnamed member",
    ]),
  );

  return {
    members: (members.data ?? []).map((candidate) => ({
      id: candidate.id,
      displayName: candidate.profile?.display_name ?? "Unnamed member",
      role: candidate.role,
      isActive: candidate.is_active,
      isCurrent: candidate.id === member.id,
      joinedAt: candidate.joined_at,
    })),
    invitations: (invitations.data ?? []).map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      displayStatus: getInvitationDisplayStatus(
        invitation.status,
        invitation.expires_at,
      ),
      invitedByName: invitation.invited_by_member_id
        ? memberNames.get(invitation.invited_by_member_id) ?? "Former member"
        : null,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    })),
  };
}
