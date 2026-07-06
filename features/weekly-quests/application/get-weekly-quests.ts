import type { CurrentMember } from "@/features/auth/domain/current-member";
import {
  buildWeeklyQuestViews,
  type WeeklyQuestSnapshot,
  type WeeklyQuestView,
} from "@/features/weekly-quests/domain/weekly-quests";
import type { Database } from "@/shared/database/database.types";
import { isMissingSchemaError } from "@/shared/database/is-missing-schema-error";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getWeeklyQuests(
  member: CurrentMember,
  options: { includeCompleted?: boolean } = {},
): Promise<WeeklyQuestView[]> {
  const supabase = await createServerSupabaseClient();
  const organizationId = member.organization.id;
  let questQuery = supabase
    .from("weekly_quests")
    .select("*")
    .eq("organization_id", organizationId)
    .neq("status", "archived");

  if (options.includeCompleted === false) {
    questQuery = questQuery.eq("status", "active");
  }

  const [quests, members] = await Promise.all([
    questQuery
      .order("status", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("organization_members")
      .select(
        "id, profile:profiles!organization_members_user_id_fkey(display_name)",
      )
      .eq("organization_id", organizationId),
  ]);

  const firstError = [quests.error, members.error].find(Boolean);
  if (firstError) {
    if (isMissingSchemaError(firstError)) {
      return [];
    }

    throw new Error(`Unable to load Weekly Quests: ${firstError.message}`);
  }

  const memberNames = new Map(
    (members.data ?? []).map((candidate) => [
      candidate.id,
      candidate.profile?.display_name ?? "Inactive member",
    ]),
  );

  return buildWeeklyQuestViews(
    (quests.data ?? []).map((quest) => mapQuest(quest, memberNames)),
  );
}

function mapQuest(
  quest: Database["public"]["Tables"]["weekly_quests"]["Row"],
  memberNames: Map<string, string>,
): WeeklyQuestSnapshot {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    status: quest.status,
    studioStatKey: quest.studio_stat_key,
    xpValue: quest.xp_value,
    characterXpValue: quest.character_xp_value,
    progressCurrent: quest.progress_current,
    progressTarget: quest.progress_target,
    dueAt: quest.due_at,
    completedAt: quest.completed_at,
    completedByName: quest.completed_by_member_id
      ? (memberNames.get(quest.completed_by_member_id) ?? "Inactive member")
      : null,
    createdByName: memberNames.get(quest.created_by_member_id) ?? "Inactive member",
  };
}
