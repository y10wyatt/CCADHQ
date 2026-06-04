import { redirect } from "next/navigation";
import { cache } from "react";

import type { CurrentMember } from "@/features/auth/domain/current-member";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export const requireCurrentMember = cache(async (): Promise<CurrentMember> => {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;
  const { data: member, error } = await supabase
    .from("organization_members")
    .select(
      `
        id,
        user_id,
        role,
        profile:profiles!organization_members_user_id_fkey(display_name, avatar_url),
        organization:organizations!organization_members_organization_id_fkey(
          id,
          name,
          slug,
          timezone,
          currency_code
        )
      `,
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !member || !member.profile || !member.organization) {
    redirect("/access-pending");
  }

  return {
    id: member.id,
    userId: member.user_id,
    role: member.role,
    displayName: member.profile.display_name,
    avatarUrl: member.profile.avatar_url,
    organization: {
      id: member.organization.id,
      name: member.organization.name,
      slug: member.organization.slug,
      timezone: member.organization.timezone,
      currencyCode: member.organization.currency_code,
    },
  };
});
