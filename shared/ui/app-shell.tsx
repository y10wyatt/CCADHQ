"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleDollarSign,
  ClipboardList,
  Home,
  LogOut,
  Megaphone,
  Timer,
  UserCog,
} from "lucide-react";

import { signOut } from "@/features/auth/application/actions";
import type { CurrentMember } from "@/features/auth/domain/current-member";
import type { StudioProgress } from "@/features/dashboard/domain/studio-progress";
import type { PresenceFocusState } from "@/features/presence/domain/presence";
import { PresenceProvider } from "@/features/presence/ui/presence-provider";
import {
  navigationItems,
  type NavigationItem,
} from "@/shared/config/navigation";
import { cn } from "@/shared/lib/cn";
import { StatusPill } from "@/shared/ui/status-pill";

const icons = {
  home: Home,
  focus: Timer,
  tasks: ClipboardList,
  finance: CircleDollarSign,
  marketing: Megaphone,
} satisfies Record<NavigationItem["icon"], typeof Home>;

interface AppShellProps {
  children: React.ReactNode;
  member: CurrentMember;
  studioProgress: StudioProgress;
  presenceFocusState: PresenceFocusState | null;
  presenceAccessToken: string | null;
}

export function AppShell({
  children,
  member,
  studioProgress,
  presenceFocusState,
  presenceAccessToken,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <PresenceProvider
      accessToken={presenceAccessToken}
      member={member}
      focusState={presenceFocusState}
    >
      <div className="min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-border bg-card/88 p-4 shadow-[12px_0_40px_rgb(31_59_93/0.06)] backdrop-blur lg:flex lg:flex-col">
          <Brand />
          <nav aria-label="Primary navigation" className="mt-8 grid gap-1">
            {navigationItems.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
              />
            ))}
          </nav>
          <MemberSummary member={member} />
          <Link
            href="/studio-xp"
            className="mt-auto rounded-xl border border-border bg-gradient-to-br from-sky-50 to-emerald-50 p-4 shadow-sm transition-colors hover:border-accent/60"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Studio XP</p>
              <StatusPill tone="info">Level {studioProgress.level}</StatusPill>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {studioProgress.totalXp} XP | {studioProgress.xpToNextLevel} XP to
              the next level.
            </p>
          </Link>
        </aside>

        <header className="sticky top-0 z-20 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Brand compact />
            <div className="flex items-center gap-2">
              {member.role === "admin" && (
                <Link
                  href="/studio-access"
                  title="Studio Access"
                  className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <UserCog className="size-4" aria-hidden="true" />
                  <span className="sr-only">Studio Access</span>
                </Link>
              )}
              <p className="text-xs font-medium text-muted-foreground">
                {member.displayName}
              </p>
            </div>
          </div>
        </header>

        <main className="pb-24 lg:ml-64 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>

        <nav
          aria-label="Primary navigation"
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-card/95 p-2 backdrop-blur lg:hidden"
        >
          {navigationItems.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              compact
            />
          ))}
        </nav>
      </div>
    </PresenceProvider>
  );
}

function MemberSummary({ member }: { member: CurrentMember }) {
  return (
    <div className="mt-6 grid gap-2">
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-md bg-muted text-sm font-semibold text-accent">
            {member.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{member.displayName}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {member.role}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="sr-only">Sign out</span>
            </button>
          </form>
        </div>
      </div>
      {member.role === "admin" && (
        <Link
          href="/studio-access"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <UserCog className="size-4" aria-hidden="true" />
          <span>Studio Access</span>
        </Link>
      )}
    </div>
  );
}

interface NavigationLinkProps {
  item: NavigationItem;
  active: boolean;
  compact?: boolean;
}

function NavigationLink({ item, active, compact }: NavigationLinkProps) {
  const Icon = icons[item.icon];

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-blue-50 text-accent shadow-sm",
        compact
          ? "min-h-14 flex-col justify-center gap-1 px-2 py-1 text-[0.68rem]"
          : "px-3 py-2.5",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image
        src="/placeholders/studio-desk.svg"
        alt=""
        width={44}
        height={44}
        className={cn(
          "rounded-lg border border-border bg-card object-cover",
          compact ? "size-9" : "size-11",
        )}
      />
      <div>
        <p className={cn("font-semibold tracking-tight", compact && "text-sm")}>
          CCAD HQ
        </p>
        {!compact && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Studio command center
          </p>
        )}
      </div>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}
