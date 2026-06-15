"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const noteSchema = z.object({
  text: z.string().trim().min(1).max(800),
  author: z.enum(["William", "Alice", "Team"]),
  category: z.enum([
    "Reminder",
    "Content Idea",
    "Student Follow-up",
    "Admin",
    "Website",
    "Marketing",
    "Random",
  ]),
  priority: z.enum(["Normal", "Important"]),
  pinned: z.boolean(),
});

export interface StudioNoteActionResult {
  ok: boolean;
  error?: string;
}

export async function createStudioNote(
  input: z.input<typeof noteSchema>,
): Promise<StudioNoteActionResult> {
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("studio_notes").insert({
    organization_id: member.organization.id,
    note_text: parsed.data.text,
    author: parsed.data.author,
    category: parsed.data.category,
    priority: parsed.data.priority,
    pinned: parsed.data.pinned,
    created_by_member_id: member.id,
  });
  return finish(error, "Unable to create the studio note.");
}

export async function updateStudioNote(
  input: z.input<typeof noteSchema> & { noteId: string },
): Promise<StudioNoteActionResult> {
  const parsed = noteSchema.extend({ noteId: uuid }).safeParse(input);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("studio_notes")
    .update({
      note_text: parsed.data.text,
      author: parsed.data.author,
      category: parsed.data.category,
      priority: parsed.data.priority,
      pinned: parsed.data.pinned,
    })
    .eq("id", parsed.data.noteId);
  return finish(error, "Unable to update the studio note.");
}

export async function archiveStudioNote(
  noteId: string,
): Promise<StudioNoteActionResult> {
  const parsed = uuid.safeParse(noteId);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("studio_notes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data);
  return finish(error, "Unable to delete the studio note.");
}

function finish(
  error: { message: string } | null,
  message: string,
): StudioNoteActionResult {
  revalidatePath("/");
  return error ? { ok: false, error: message } : { ok: true };
}

function invalidInput(): StudioNoteActionResult {
  return { ok: false, error: "Check the note details and try again." };
}
