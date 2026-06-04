"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const optionalUuid = z.string().uuid().nullable().optional();
const workName = z.string().trim().min(1).max(160);
const workDescription = z.string().trim().min(1).max(2000);
const categoryName = z.string().trim().min(1).max(80);

const startSchema = z
  .object({
    mode: z.enum(["pomodoro", "freeform"]),
    kind: z.enum(["focus", "short_break", "long_break"]),
    workName: z.string().trim().max(160).nullable().optional(),
    workDescription: z.string().trim().max(2000).nullable().optional(),
    workCategoryId: optionalUuid,
    linkedTaskId: optionalUuid,
    continuedFromSessionId: optionalUuid,
  })
  .superRefine((value, context) => {
    if (value.kind !== "focus") return;
    if (!value.workName) {
      context.addIssue({ code: "custom", path: ["workName"], message: "Required" });
    }
    if (!value.workDescription) {
      context.addIssue({
        code: "custom",
        path: ["workDescription"],
        message: "Required",
      });
    }
    if (!value.workCategoryId) {
      context.addIssue({
        code: "custom",
        path: ["workCategoryId"],
        message: "Required",
      });
    }
  });

export type FocusActionResult = {
  ok: boolean;
  error?: string;
  xpAwarded?: boolean;
  previousLevel?: number;
  newLevel?: number;
};

export async function startFocusSession(
  input: z.input<typeof startSchema>,
): Promise<FocusActionResult> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return invalidInput();

  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("start_focus_session", {
    target_organization_id: member.organization.id,
    session_mode: parsed.data.mode,
    session_kind: parsed.data.kind,
    session_work_name: parsed.data.workName ?? null,
    session_work_description: parsed.data.workDescription ?? null,
    session_work_category_id: parsed.data.workCategoryId ?? null,
    session_linked_task_id: parsed.data.linkedTaskId ?? null,
    session_continued_from_id: parsed.data.continuedFromSessionId ?? null,
  });

  return finish(error, "Unable to start the session.");
}

export async function pauseFocusSession(
  sessionId: string,
): Promise<FocusActionResult> {
  return runSessionRpc("pause_focus_session", sessionId, "Unable to pause.");
}

export async function resumeFocusSession(
  sessionId: string,
): Promise<FocusActionResult> {
  return runSessionRpc("resume_focus_session", sessionId, "Unable to resume.");
}

export async function cancelFocusSession(
  sessionId: string,
): Promise<FocusActionResult> {
  return runSessionRpc("cancel_focus_session", sessionId, "Unable to cancel.");
}

export async function completeFocusSession(
  sessionId: string,
): Promise<FocusActionResult> {
  const parsed = uuid.safeParse(sessionId);
  if (!parsed.success) return invalidInput();

  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("complete_focus_session", {
    target_session_id: parsed.data,
  });

  revalidateFocusPaths();
  if (error) return { ok: false, error: "Unable to complete the session." };

  const result = data as {
    xp_awarded?: boolean;
    previous_level?: number;
    new_level?: number;
  } | null;
  return {
    ok: true,
    xpAwarded: result?.xp_awarded ?? false,
    previousLevel: result?.previous_level,
    newLevel: result?.new_level,
  };
}

export async function updateFocusSessionDetails(input: {
  sessionId: string;
  workName: string;
  workDescription: string;
  workCategoryId: string;
  linkedTaskId?: string | null;
}): Promise<FocusActionResult> {
  const parsed = z
    .object({
      sessionId: uuid,
      workName,
      workDescription,
      workCategoryId: uuid,
      linkedTaskId: optionalUuid,
    })
    .safeParse(input);
  if (!parsed.success) return invalidInput();

  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_focus_session_details", {
    target_session_id: parsed.data.sessionId,
    session_work_name: parsed.data.workName,
    session_work_description: parsed.data.workDescription,
    session_work_category_id: parsed.data.workCategoryId,
    session_linked_task_id: parsed.data.linkedTaskId ?? null,
  });

  return finish(error, "Unable to save the work details.");
}

export async function createWorkCategory(
  name: string,
): Promise<FocusActionResult> {
  const parsed = categoryName.safeParse(name);
  if (!parsed.success) return invalidInput();

  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("work_categories").insert({
    organization_id: member.organization.id,
    name: parsed.data,
    created_by_member_id: member.id,
  });

  return finish(error, "Unable to add the category.");
}

export async function renameWorkCategory(
  categoryId: string,
  name: string,
): Promise<FocusActionResult> {
  const parsed = z.object({ categoryId: uuid, name: categoryName }).safeParse({
    categoryId,
    name,
  });
  if (!parsed.success) return invalidInput();

  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("work_categories")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.categoryId)
    .eq("organization_id", member.organization.id);

  return finish(error, "Unable to rename the category.");
}

export async function archiveWorkCategory(
  categoryId: string,
): Promise<FocusActionResult> {
  const parsed = uuid.safeParse(categoryId);
  if (!parsed.success) return invalidInput();

  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("work_categories")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("organization_id", member.organization.id);

  return finish(error, "Unable to archive the category.");
}

async function runSessionRpc(
  name: "pause_focus_session" | "resume_focus_session" | "cancel_focus_session",
  sessionId: string,
  errorMessage: string,
): Promise<FocusActionResult> {
  const parsed = uuid.safeParse(sessionId);
  if (!parsed.success) return invalidInput();

  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc(name, {
    target_session_id: parsed.data,
  });

  return finish(error, errorMessage);
}

function finish(
  error: { message: string } | null,
  errorMessage: string,
): FocusActionResult {
  revalidateFocusPaths();
  return error ? { ok: false, error: errorMessage } : { ok: true };
}

function invalidInput(): FocusActionResult {
  return { ok: false, error: "Check the required fields and try again." };
}

function revalidateFocusPaths() {
  revalidatePath("/focus-room");
  revalidatePath("/");
}
