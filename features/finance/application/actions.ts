"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const financeDetailsSchema = z.object({
  entryType: z.enum(["income", "expense"]),
  amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryId: uuid,
  description: z.string().trim().min(1).max(240),
  note: z.string().trim().max(2000).nullable().optional(),
  recurrence: z.enum(["none", "weekly", "monthly", "yearly"]).default("none"),
});

export interface FinanceActionResult {
  ok: boolean;
  error?: string;
}

export async function createFinanceEntry(
  input: z.input<typeof financeDetailsSchema>,
): Promise<FinanceActionResult> {
  const parsed = financeDetailsSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_finance_entry", {
    target_organization_id: member.organization.id,
    finance_entry_type: parsed.data.entryType,
    finance_amount_minor: parsed.data.amountMinor,
    finance_entry_date: parsed.data.entryDate,
    finance_category_id: parsed.data.categoryId,
    finance_description: parsed.data.description,
    finance_note: parsed.data.note ?? null,
    finance_recurrence: parsed.data.recurrence,
  });
  return finish(error, "Unable to create the finance entry.");
}

export async function updateFinanceEntry(
  input: z.input<typeof financeDetailsSchema> & { entryId: string },
): Promise<FinanceActionResult> {
  const parsed = financeDetailsSchema.extend({ entryId: uuid }).safeParse(input);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_finance_entry", {
    target_entry_id: parsed.data.entryId,
    finance_entry_type: parsed.data.entryType,
    finance_amount_minor: parsed.data.amountMinor,
    finance_entry_date: parsed.data.entryDate,
    finance_category_id: parsed.data.categoryId,
    finance_description: parsed.data.description,
    finance_note: parsed.data.note ?? null,
    finance_recurrence: parsed.data.recurrence,
  });
  return finish(error, "Unable to update the finance entry.");
}

export async function archiveFinanceEntry(
  entryId: string,
): Promise<FinanceActionResult> {
  const parsed = uuid.safeParse(entryId);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("archive_finance_entry", {
    target_entry_id: parsed.data,
  });
  return finish(error, "Unable to archive the finance entry.");
}

function finish(error: { message: string } | null, message: string) {
  revalidatePath("/");
  revalidatePath("/finance");
  return error ? { ok: false, error: message } : { ok: true };
}

function invalidInput(): FinanceActionResult {
  return { ok: false, error: "Check the finance details and try again." };
}
