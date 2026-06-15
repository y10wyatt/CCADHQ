import type { CurrentMember } from "@/features/auth/domain/current-member";
import type { StudioNote } from "@/features/studio-notes/domain/studio-notes";
import type { Database } from "@/shared/database/database.types";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getStudioNotes(
  member: CurrentMember,
): Promise<StudioNote[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("studio_notes")
    .select("*")
    .eq("organization_id", member.organization.id)
    .is("archived_at", null)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load Studio Notes: ${error.message}`);
  }

  return (data ?? []).map(mapStudioNote);
}

function mapStudioNote(
  note: Database["public"]["Tables"]["studio_notes"]["Row"],
): StudioNote {
  return {
    id: note.id,
    text: note.note_text,
    author: note.author,
    category: note.category,
    priority: note.priority,
    pinned: note.pinned,
    createdAt: note.created_at,
  };
}
