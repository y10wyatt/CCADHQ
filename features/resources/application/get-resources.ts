import type { CurrentMember } from "@/features/auth/domain/current-member";
import type { ResourceLink } from "@/features/resources/domain/resources";
import type { Database } from "@/shared/database/database.types";
import { isMissingSchemaError } from "@/shared/database/is-missing-schema-error";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getResources(
  member: CurrentMember,
): Promise<ResourceLink[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("organization_id", member.organization.id)
    .is("archived_at", null)
    .order("pinned", { ascending: false })
    .order("category")
    .order("title");

  if (error) {
    if (isMissingSchemaError(error)) {
      return [];
    }

    throw new Error(`Unable to load Resources: ${error.message}`);
  }

  return (data ?? []).map(mapResource);
}

function mapResource(
  resource: Database["public"]["Tables"]["resources"]["Row"],
): ResourceLink {
  return {
    id: resource.id,
    title: resource.title,
    url: resource.url,
    category: resource.category,
    description: resource.description,
    owner: resource.owner,
    pinned: resource.pinned,
    createdAt: resource.created_at,
  };
}
