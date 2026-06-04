import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { getPresenceFocusState } from "@/features/presence/application/get-presence-focus-state";
import { getStudioXpSummary } from "@/features/studio-xp/application/get-studio-xp";
import { AppShell } from "@/shared/ui/app-shell";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const member = await requireCurrentMember();
  const [studioProgress, presenceFocusState] = await Promise.all([
    getStudioXpSummary(member),
    getPresenceFocusState(member),
  ]);

  return (
    <AppShell
      member={member}
      studioProgress={studioProgress}
      presenceFocusState={presenceFocusState}
    >
      {children}
    </AppShell>
  );
}
