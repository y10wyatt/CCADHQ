"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const optionalUuid = z.string().uuid().nullable().optional();
const optionalDate = z.string().datetime().nullable().optional();
const taskDetailsSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  workCategoryId: uuid,
  priority: z.enum(["low", "normal", "high", "urgent"]),
  assigneeMemberId: optionalUuid,
  dueAt: optionalDate,
});

export interface TaskActionResult {
  ok: boolean;
  error?: string;
  xpAwarded?: boolean;
  previousLevel?: number;
  newLevel?: number;
}

export async function createTask(
  input: z.input<typeof taskDetailsSchema>,
): Promise<TaskActionResult> {
  const parsed = taskDetailsSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_task", {
    target_organization_id: member.organization.id,
    task_title: parsed.data.title,
    task_description: parsed.data.description ?? null,
    task_work_category_id: parsed.data.workCategoryId,
    task_priority: parsed.data.priority,
    task_assignee_member_id: parsed.data.assigneeMemberId ?? null,
    task_due_at: parsed.data.dueAt ?? null,
  });
  return finish(error, "Unable to create the task.");
}

export async function updateTask(input: {
  taskId: string;
  title: string;
  description?: string | null;
  workCategoryId: string;
  priority: "low" | "normal" | "high" | "urgent";
  assigneeMemberId?: string | null;
  dueAt?: string | null;
}): Promise<TaskActionResult> {
  const parsed = taskDetailsSchema
    .extend({ taskId: uuid })
    .safeParse(input);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_task_details", {
    target_task_id: parsed.data.taskId,
    task_title: parsed.data.title,
    task_description: parsed.data.description ?? null,
    task_work_category_id: parsed.data.workCategoryId,
    task_priority: parsed.data.priority,
    task_assignee_member_id: parsed.data.assigneeMemberId ?? null,
    task_due_at: parsed.data.dueAt ?? null,
  });
  return finish(error, "Unable to update the task.");
}

export async function transitionTask(
  taskId: string,
  status: "backlog" | "planned" | "in_progress" | "blocked" | "done",
): Promise<TaskActionResult> {
  const parsed = z
    .object({
      taskId: uuid,
      status: z.enum(["backlog", "planned", "in_progress", "blocked", "done"]),
    })
    .safeParse({ taskId, status });
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("transition_task", {
    target_task_id: parsed.data.taskId,
    target_status: parsed.data.status,
  });
  if (error) return finish(error, "Unable to move the task.");

  revalidateTaskPaths();
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

export async function archiveTask(taskId: string): Promise<TaskActionResult> {
  const parsed = uuid.safeParse(taskId);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("archive_task", {
    target_task_id: parsed.data,
  });
  return finish(error, "Unable to archive the task.");
}

function finish(
  error: { message: string } | null,
  message: string,
): TaskActionResult {
  revalidateTaskPaths();
  return error ? { ok: false, error: message } : { ok: true };
}

function invalidInput(): TaskActionResult {
  return { ok: false, error: "Check the task details and try again." };
}

function revalidateTaskPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/studio-xp");
  revalidatePath("/focus-room");
}
