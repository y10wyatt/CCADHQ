import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getPresenceFocusState } from "@/features/presence/application/get-presence-focus-state";
import { getStudioXpSummary } from "@/features/studio-xp/application/get-studio-xp";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";
import { AppShell } from "@/shared/ui/app-shell";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const [sessionResult, studioProgress, presenceFocusState] = await Promise.all([
    supabase.auth.getSession(),
    getStudioXpSummary(member),
    getPresenceFocusState(member),
  ]);

  return (
    <AppShell
      member={member}
      studioProgress={studioProgress}
      presenceFocusState={presenceFocusState}
      presenceAccessToken={sessionResult.data.session?.access_token ?? null}
    >
      {children}
    </AppShell>
  );
}
