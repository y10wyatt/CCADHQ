"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { isMissingSchemaError } from "@/shared/database/is-missing-schema-error";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const resourceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  url: z.string().trim().url().max(1000),
  category: z.enum([
    "Meetings",
    "Students",
    "Marketing",
    "Finance",
    "Teaching",
    "Admin",
    "Tech",
    "Other",
  ]),
  description: z.string().trim().max(400),
  owner: z.enum(["William", "Alice", "Team"]),
  pinned: z.boolean(),
});

export interface ResourceActionResult {
  ok: boolean;
  error?: string;
}

export async function createResource(
  input: z.input<typeof resourceSchema>,
): Promise<ResourceActionResult> {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return invalidInput();

  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("resources").insert({
    organization_id: member.organization.id,
    title: parsed.data.title,
    url: parsed.data.url,
    category: parsed.data.category,
    description: parsed.data.description,
    owner: parsed.data.owner,
    pinned: parsed.data.pinned,
    created_by_member_id: member.id,
  });

  return finish(error, "Unable to create the resource.");
}

export async function updateResource(
  input: z.input<typeof resourceSchema> & { resourceId: string },
): Promise<ResourceActionResult> {
  const parsed = resourceSchema.extend({ resourceId: uuid }).safeParse(input);
  if (!parsed.success) return invalidInput();

  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("resources")
    .update({
      title: parsed.data.title,
      url: parsed.data.url,
      category: parsed.data.category,
      description: parsed.data.description,
      owner: parsed.data.owner,
      pinned: parsed.data.pinned,
    })
    .eq("id", parsed.data.resourceId);

  return finish(error, "Unable to update the resource.");
}

export async function archiveResource(
  resourceId: string,
): Promise<ResourceActionResult> {
  const parsed = uuid.safeParse(resourceId);
  if (!parsed.success) return invalidInput();

  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("resources")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data);

  return finish(error, "Unable to archive the resource.");
}

function finish(
  error: { code?: string; message: string } | null,
  message: string,
): ResourceActionResult {
  revalidatePath("/resources");

  if (!error) return { ok: true };
  if (isMissingSchemaError(error)) {
    return {
      ok: false,
      error: "Resources are not ready yet. Apply the Supabase migration first.",
    };
  }

  return { ok: false, error: message };
}

function invalidInput(): ResourceActionResult {
  return { ok: false, error: "Check the resource details and try again." };
}
