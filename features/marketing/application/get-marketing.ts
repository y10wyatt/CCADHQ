import type { CurrentMember } from "@/features/auth/domain/current-member";
import {
  marketingDashboardData,
  type ContentIdea,
  type MarketingAccountId,
  type MarketingDashboardData,
} from "@/features/marketing/domain/marketing";
import type { Database, MarketingAccount } from "@/shared/database/database.types";
import { isMissingSchemaError } from "@/shared/database/is-missing-schema-error";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const accountToId: Record<MarketingAccount, MarketingAccountId> = {
  CCAD: "ccad",
  William: "william",
  Alice: "alice",
  Mascot: "mascot",
};

export async function getMarketingDashboard(
  member: CurrentMember,
): Promise<MarketingDashboardData> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("marketing_content_ideas")
    .select("*")
    .eq("organization_id", member.organization.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingSchemaError(error)) {
      return marketingDashboardData;
    }

    throw new Error(`Unable to load Marketing: ${error.message}`);
  }

  return {
    ...marketingDashboardData,
    ideas: (data ?? []).map(mapContentIdea),
  };
}

function mapContentIdea(
  idea: Database["public"]["Tables"]["marketing_content_ideas"]["Row"],
): ContentIdea {
  return {
    id: idea.id,
    title: idea.title,
    account: accountToId[idea.account],
    owner: idea.owner,
    lane: idea.content_lane,
    audience: idea.audience,
    format: idea.format,
    priority: idea.priority,
    deadline: idea.deadline ?? "",
    cta: idea.cta,
    status: idea.status,
    notes: idea.notes,
  };
}
