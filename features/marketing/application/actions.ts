"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import type { MarketingAccountId } from "@/features/marketing/domain/marketing";
import type { MarketingAccount } from "@/shared/database/database.types";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const accountFromId: Record<MarketingAccountId, MarketingAccount> = {
  ccad: "CCAD",
  william: "William",
  alice: "Alice",
  mascot: "Mascot",
};

const contentIdeaSchema = z.object({
  title: z.string().trim().min(1).max(180),
  account: z.enum(["ccad", "william", "alice", "mascot"]),
  owner: z.enum(["William", "Alice", "Team", "Other"]),
  lane: z.string().trim().max(120),
  audience: z.string().trim().max(180),
  format: z.string().trim().max(180),
  priority: z.enum(["Low", "Medium", "High"]),
  deadline: z.string().nullable().optional(),
  cta: z.string().trim().max(180),
  status: z.enum([
    "Idea Bank",
    "Selected This Week",
    "Script Needed",
    "Ready to Film",
    "Editing",
    "Scheduled",
    "Posted",
    "Review Performance",
  ]),
  notes: z.string().trim().max(2000),
});

export interface MarketingActionResult {
  ok: boolean;
  error?: string;
}

export async function createContentIdea(
  input: z.input<typeof contentIdeaSchema>,
): Promise<MarketingActionResult> {
  const parsed = contentIdeaSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("marketing_content_ideas").insert({
    organization_id: member.organization.id,
    title: parsed.data.title,
    account: accountFromId[parsed.data.account],
    owner: parsed.data.owner,
    content_lane: parsed.data.lane,
    audience: parsed.data.audience,
    format: parsed.data.format,
    priority: parsed.data.priority,
    deadline: parsed.data.deadline || null,
    cta: parsed.data.cta,
    status: parsed.data.status,
    notes: parsed.data.notes,
    created_by_member_id: member.id,
  });
  return finish(error, "Unable to create the content idea.");
}

export async function updateContentIdea(
  input: z.input<typeof contentIdeaSchema> & { ideaId: string },
): Promise<MarketingActionResult> {
  const parsed = contentIdeaSchema.extend({ ideaId: uuid }).safeParse(input);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("marketing_content_ideas")
    .update({
      title: parsed.data.title,
      account: accountFromId[parsed.data.account],
      owner: parsed.data.owner,
      content_lane: parsed.data.lane,
      audience: parsed.data.audience,
      format: parsed.data.format,
      priority: parsed.data.priority,
      deadline: parsed.data.deadline || null,
      cta: parsed.data.cta,
      status: parsed.data.status,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.ideaId);
  return finish(error, "Unable to update the content idea.");
}

export async function archiveContentIdea(
  ideaId: string,
): Promise<MarketingActionResult> {
  const parsed = uuid.safeParse(ideaId);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("marketing_content_ideas")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data);
  return finish(error, "Unable to delete the content idea.");
}

function finish(
  error: { message: string } | null,
  message: string,
): MarketingActionResult {
  revalidatePath("/marketing");
  revalidatePath("/");
  return error ? { ok: false, error: message } : { ok: true };
}

function invalidInput(): MarketingActionResult {
  return { ok: false, error: "Check the content idea details and try again." };
}
