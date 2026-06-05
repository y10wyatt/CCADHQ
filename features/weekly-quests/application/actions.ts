"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const questSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1200).nullable().optional(),
  studioStatKey: z
    .enum(["stability", "reputation", "creativity", "community"])
    .nullable()
    .optional(),
  xpValue: z.number().int().min(0).max(5000),
  characterXpValue: z.number().int().min(0).max(500),
  progressCurrent: z.number().int().min(0).max(999),
  progressTarget: z.number().int().min(1).max(999),
  dueAt: z.string().datetime().nullable().optional(),
});

export interface WeeklyQuestActionResult {
  ok: boolean;
  error?: string;
  studioXpAwarded?: boolean;
  characterXpAwarded?: boolean;
  previousLevel?: number;
  newLevel?: number;
}

export async function createWeeklyQuest(
  input: z.input<typeof questSchema>,
): Promise<WeeklyQuestActionResult> {
  const parsed = questSchema.safeParse(input);
  if (!parsed.success || parsed.data.progressCurrent > parsed.data.progressTarget) {
    return invalidInput();
  }
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_weekly_quest", {
    target_organization_id: member.organization.id,
    quest_title: parsed.data.title,
    quest_description: parsed.data.description ?? null,
    quest_studio_stat_key: parsed.data.studioStatKey ?? null,
    quest_xp_value: parsed.data.xpValue,
    quest_character_xp_value: parsed.data.characterXpValue,
    quest_progress_target: parsed.data.progressTarget,
    quest_due_at: parsed.data.dueAt ?? null,
  });

  if (!error && parsed.data.progressCurrent > 0) {
    // Initial progress is intentionally edited after creation only once the
    // durable row exists; the create RPC keeps ownership and defaults simple.
    revalidateQuestPaths();
  }
  return finish(error, "Unable to create the weekly quest.");
}

export async function updateWeeklyQuest(
  input: z.input<typeof questSchema> & { questId: string },
): Promise<WeeklyQuestActionResult> {
  const parsed = questSchema.extend({ questId: uuid }).safeParse(input);
  if (!parsed.success || parsed.data.progressCurrent > parsed.data.progressTarget) {
    return invalidInput();
  }
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_weekly_quest", {
    target_quest_id: parsed.data.questId,
    quest_title: parsed.data.title,
    quest_description: parsed.data.description ?? null,
    quest_studio_stat_key: parsed.data.studioStatKey ?? null,
    quest_xp_value: parsed.data.xpValue,
    quest_character_xp_value: parsed.data.characterXpValue,
    quest_progress_current: parsed.data.progressCurrent,
    quest_progress_target: parsed.data.progressTarget,
    quest_due_at: parsed.data.dueAt ?? null,
  });
  return finish(error, "Unable to update the weekly quest.");
}

export async function completeWeeklyQuest(
  questId: string,
): Promise<WeeklyQuestActionResult> {
  const parsed = uuid.safeParse(questId);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("complete_weekly_quest", {
    target_quest_id: parsed.data,
  });
  if (error) return finish(error, "Unable to complete the weekly quest.");

  revalidateQuestPaths();
  const result = data as {
    studio_xp_awarded?: boolean;
    character_xp_awarded?: boolean;
    previous_level?: number;
    new_level?: number;
  } | null;
  return {
    ok: true,
    studioXpAwarded: result?.studio_xp_awarded ?? false,
    characterXpAwarded: result?.character_xp_awarded ?? false,
    previousLevel: result?.previous_level,
    newLevel: result?.new_level,
  };
}

export async function archiveWeeklyQuest(
  questId: string,
): Promise<WeeklyQuestActionResult> {
  const parsed = uuid.safeParse(questId);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("archive_weekly_quest", {
    target_quest_id: parsed.data,
  });
  return finish(error, "Unable to archive the weekly quest.");
}

function finish(
  error: { message: string } | null,
  message: string,
): WeeklyQuestActionResult {
  revalidateQuestPaths();
  return error ? { ok: false, error: message } : { ok: true };
}

function invalidInput(): WeeklyQuestActionResult {
  return { ok: false, error: "Check the weekly quest details and try again." };
}

function revalidateQuestPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/studio-xp");
}
