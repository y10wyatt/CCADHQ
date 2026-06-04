import type { CurrentMember } from "@/features/auth/domain/current-member";
import type { PresenceFocusState } from "@/features/presence/domain/presence";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getPresenceFocusState(
  member: CurrentMember,
): Promise<PresenceFocusState | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("focus_sessions")
    .select("id, kind, state")
    .eq("member_id", member.id)
    .in("state", ["running", "paused"])
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load coworking presence: ${error.message}`);
  }

  if (!data || (data.state !== "running" && data.state !== "paused")) {
    return null;
  }

  return {
    id: data.id,
    kind: data.kind,
    state: data.state,
  };
}
