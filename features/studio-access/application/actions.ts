"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const role = z.enum(["staff", "admin"]);

export interface StudioAccessActionResult {
  ok: boolean;
  error?: string;
}

export async function createStudioInvitation(input: {
  email: string;
  role: "staff" | "admin";
}): Promise<StudioAccessActionResult> {
  const parsed = z
    .object({
      email: z.string().trim().email().max(320),
      role,
    })
    .safeParse(input);
  if (!parsed.success) return invalidInput();

  const member = await requireAdmin();
  if (!member) return adminRequired();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_organization_invitation", {
    target_organization_id: member.organization.id,
    invitation_email: parsed.data.email,
    invitation_role: parsed.data.role,
  });

  return finish(
    error,
    error?.message.includes("already belongs")
      ? "That email already belongs to a CCAD member."
      : "Unable to create the invitation.",
  );
}

export async function revokeStudioInvitation(
  invitationId: string,
): Promise<StudioAccessActionResult> {
  const parsed = uuid.safeParse(invitationId);
  if (!parsed.success) return invalidInput();
  if (!(await requireAdmin())) return adminRequired();

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("revoke_organization_invitation", {
    target_invitation_id: parsed.data,
  });

  return finish(error, "Unable to revoke the invitation.");
}

export async function updateStudioMemberAccess(input: {
  memberId: string;
  role: "staff" | "admin";
  isActive: boolean;
}): Promise<StudioAccessActionResult> {
  const parsed = z
    .object({
      memberId: uuid,
      role,
      isActive: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) return invalidInput();
  if (!(await requireAdmin())) return adminRequired();

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_organization_member_access", {
    target_member_id: parsed.data.memberId,
    target_role: parsed.data.role,
    target_is_active: parsed.data.isActive,
  });

  return finish(
    error,
    error?.message.includes("At least one active admin")
      ? "CCAD must retain at least one active admin."
      : error?.message.includes("deactivate themselves")
        ? "You cannot deactivate your own account."
        : "Unable to update member access.",
  );
}

async function requireAdmin() {
  const member = await requireCurrentMember();
  return member.role === "admin" ? member : null;
}

function finish(
  error: { message: string } | null,
  message: string,
): StudioAccessActionResult {
  revalidatePath("/studio-access");
  return error ? { ok: false, error: message } : { ok: true };
}

function invalidInput(): StudioAccessActionResult {
  return { ok: false, error: "Check the access details and try again." };
}

function adminRequired(): StudioAccessActionResult {
  return { ok: false, error: "Admin access is required." };
}
