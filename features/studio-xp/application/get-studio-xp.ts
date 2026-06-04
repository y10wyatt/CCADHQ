import type { CurrentMember } from "@/features/auth/domain/current-member";
import { getStudioProgress } from "@/features/dashboard/domain/studio-progress";
import {
  buildStudioXpViewModel,
  type StudioXpViewModel,
} from "@/features/studio-xp/domain/studio-xp";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getStudioXp(
  member: CurrentMember,
): Promise<StudioXpViewModel> {
  const supabase = await createServerSupabaseClient();
  const organizationId = member.organization.id;
  const [points, events] = await Promise.all([
    supabase
      .from("xp_events")
      .select("points")
      .eq("organization_id", organizationId),
    supabase
      .from("xp_events")
      .select(
        "id, event_type, points, description, actor_member_id, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (points.error || events.error) {
    throw new Error(
      `Unable to load Studio XP: ${points.error?.message ?? events.error?.message}`,
    );
  }

  const actorIds = [
    ...new Set(
      (events.data ?? [])
        .map((event) => event.actor_member_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const actors =
    actorIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("organization_members")
          .select(
            "id, profile:profiles!organization_members_user_id_fkey(display_name)",
          )
          .in("id", actorIds);

  if (actors.error) {
    throw new Error(`Unable to load Studio XP actors: ${actors.error.message}`);
  }

  const actorNames = new Map(
    (actors.data ?? []).map((actor) => [
      actor.id,
      actor.profile?.display_name ?? null,
    ]),
  );
  const totalXp = (points.data ?? []).reduce(
    (total, event) => total + event.points,
    0,
  );

  return buildStudioXpViewModel({
    totalXp,
    timezone: member.organization.timezone,
    isAdmin: member.role === "admin",
    events: (events.data ?? []).map((event) => ({
      id: event.id,
      eventType: event.event_type,
      points: event.points,
      description: event.description,
      actorName: event.actor_member_id
        ? (actorNames.get(event.actor_member_id) ?? null)
        : null,
      createdAt: event.created_at,
    })),
  });
}

export async function getStudioXpSummary(member: CurrentMember) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("xp_events")
    .select("points")
    .eq("organization_id", member.organization.id);

  if (error) {
    throw new Error(`Unable to load Studio XP summary: ${error.message}`);
  }

  return getStudioProgress(
    (data ?? []).reduce((total, event) => total + event.points, 0),
  );
}
