import type { CurrentMember } from "@/features/auth/domain/current-member";
import type {
  FocusRoomViewModel,
  FocusSessionView,
} from "@/features/focus/domain/focus-room";
import { isLongBreakAvailable } from "@/features/focus/domain/focus-room";
import type { Database } from "@/shared/database/database.types";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getFocusRoom(
  member: CurrentMember,
): Promise<FocusRoomViewModel> {
  const supabase = await createServerSupabaseClient();
  const organizationId = member.organization.id;

  const [
    active,
    categories,
    tasks,
    recent,
    completedPomodoros,
    latestCompletedPomodoro,
    latestCompletedLongBreak,
  ] =
    await Promise.all([
      supabase
        .from("focus_sessions")
        .select("*")
        .eq("member_id", member.id)
        .in("state", ["running", "paused"])
        .maybeSingle(),
      supabase
        .from("work_categories")
        .select("id, name")
        .eq("organization_id", organizationId)
        .is("archived_at", null)
        .order("name"),
      supabase
        .from("tasks")
        .select("id, title, description, work_category_id")
        .eq("organization_id", organizationId)
        .neq("status", "done")
        .is("archived_at", null)
        .order("updated_at", { ascending: false })
        .limit(30),
      supabase
        .from("focus_sessions")
        .select("*")
        .eq("member_id", member.id)
        .eq("kind", "focus")
        .in("state", ["completed", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("focus_sessions")
        .select("id", { count: "exact", head: true })
        .eq("member_id", member.id)
        .eq("mode", "pomodoro")
        .eq("kind", "focus")
        .eq("state", "completed")
        .eq("recorded_duration_seconds", 1500),
      supabase
        .from("focus_sessions")
        .select("completed_at")
        .eq("member_id", member.id)
        .eq("mode", "pomodoro")
        .eq("kind", "focus")
        .eq("state", "completed")
        .eq("recorded_duration_seconds", 1500)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("focus_sessions")
        .select("completed_at")
        .eq("member_id", member.id)
        .eq("kind", "long_break")
        .eq("state", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const firstError = [
    active.error,
    categories.error,
    tasks.error,
    recent.error,
    completedPomodoros.error,
    latestCompletedPomodoro.error,
    latestCompletedLongBreak.error,
  ].find(Boolean);

  if (firstError) {
    throw new Error(`Unable to load Focus Room: ${firstError.message}`);
  }

  const completedCount = completedPomodoros.count ?? 0;

  return {
    activeSession: active.data ? mapSession(active.data) : null,
    categories: (categories.data ?? []).map((category) => ({
      id: category.id,
      name: category.name,
    })),
    tasks: (tasks.data ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      workCategoryId: task.work_category_id,
    })),
    recentSessions: (recent.data ?? []).map(mapSession),
    longBreakAvailable: isLongBreakAvailable(
      completedCount,
      latestCompletedPomodoro.data?.completed_at ?? null,
      latestCompletedLongBreak.data?.completed_at ?? null,
    ),
  };
}

function mapSession(
  session: Database["public"]["Tables"]["focus_sessions"]["Row"],
): FocusSessionView {
  return {
    id: session.id,
    mode: session.mode,
    kind: session.kind,
    state: session.state,
    workName: session.work_name,
    workDescription: session.work_description,
    workCategoryId: session.work_category_id,
    workCategoryName: session.work_category_name,
    linkedTaskId: session.linked_task_id,
    continuedFromSessionId: session.continued_from_session_id,
    plannedDurationSeconds: session.planned_duration_seconds,
    startedAt: session.started_at,
    resumedAt: session.resumed_at,
    endsAt: session.ends_at,
    remainingSecondsAtPause: session.remaining_seconds_at_pause,
    elapsedSecondsAtPause: session.elapsed_seconds_at_pause,
    recordedDurationSeconds: session.recorded_duration_seconds,
    completedAt: session.completed_at,
  };
}
