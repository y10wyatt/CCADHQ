import type { CurrentMember } from "@/features/auth/domain/current-member";
import {
  getDateKey,
  getMonthKey,
  type FinanceEntryView,
  type FinanceViewModel,
} from "@/features/finance/domain/finance";
import type { Database } from "@/shared/database/database.types";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getFinance(member: CurrentMember): Promise<FinanceViewModel> {
  const supabase = await createServerSupabaseClient();
  const organizationId = member.organization.id;
  const [entries, categories, members] = await Promise.all([
    supabase
      .from("finance_entries")
      .select("*")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("finance_categories")
      .select("id, name, entry_type")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("organization_members")
      .select(
        "id, profile:profiles!organization_members_user_id_fkey(display_name)",
      )
      .eq("organization_id", organizationId)
      .order("joined_at"),
  ]);

  const firstError = [entries.error, categories.error, members.error].find(Boolean);
  if (firstError) {
    throw new Error(`Unable to load Finance: ${firstError.message}`);
  }

  const categoryNames = new Map(
    (categories.data ?? []).map((category) => [category.id, category.name]),
  );
  const memberNames = new Map(
    (members.data ?? []).map((candidate) => [
      candidate.id,
      candidate.profile?.display_name ?? "Unnamed member",
    ]),
  );

  const now = new Date();
  return {
    entries: (entries.data ?? []).map((financeEntry) =>
      mapEntry(financeEntry, member, categoryNames, memberNames),
    ),
    categories: (categories.data ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      entryType: category.entry_type,
    })),
    currencyCode: member.organization.currencyCode,
    timezone: member.organization.timezone,
    currentMonth: getMonthKey(now, member.organization.timezone),
    currentDate: getDateKey(now, member.organization.timezone),
  };
}

function mapEntry(
  entry: Database["public"]["Tables"]["finance_entries"]["Row"],
  member: CurrentMember,
  categoryNames: Map<string, string>,
  memberNames: Map<string, string>,
): FinanceEntryView {
  return {
    id: entry.id,
    entryType: entry.entry_type,
    amountMinor: entry.amount_minor,
    currencyCode: entry.currency_code,
    entryDate: entry.entry_date,
    categoryId: entry.category_id,
    categoryName:
      entry.category_name ?? categoryNames.get(entry.category_id) ?? "Inactive category",
    description: entry.description,
    note: entry.note,
    recurrence: entry.recurrence,
    creatorName: memberNames.get(entry.created_by_member_id) ?? "Inactive member",
    canManage:
      member.role === "admin" || member.id === entry.created_by_member_id,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}
