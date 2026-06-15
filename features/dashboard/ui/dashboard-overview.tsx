"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";

import type {
  DashboardActivity,
  DashboardViewModel,
} from "@/features/dashboard/domain/dashboard-view-model";
import type { StudioNote } from "@/features/studio-notes/domain/studio-notes";
import { StudioNotesPanel } from "@/features/studio-notes/ui/studio-notes-panel";
import { WeeklyQuestsPanel } from "@/features/weekly-quests/ui/weekly-quests-panel";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

interface DashboardOverviewProps {
  dashboard: DashboardViewModel;
  studioNotes: StudioNote[];
}

export function DashboardOverview({ dashboard, studioNotes }: DashboardOverviewProps) {
  const [showActivity, setShowActivity] = useState(true);

  return (
    <div className="grid gap-5">
      <section
        aria-label="Studio metrics"
        className="grid gap-4 md:grid-cols-3"
      >
        {dashboard.metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="group">
            <Card
              className={cn(
                "h-full transition-colors group-hover:border-accent/60",
                metricCardTone(metric.tone),
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <StatusPill tone={metric.tone}>{metric.label}</StatusPill>
                <ArrowUpRight
                  className="size-4 text-muted-foreground transition-colors group-hover:text-accent"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-6 font-mono text-4xl font-semibold tracking-tight">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {metric.detail}
              </p>
            </Card>
          </Link>
        ))}
      </section>

      <StudioNotesPanel notes={studioNotes} />

      <StudioXpSummary dashboard={dashboard} />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Character XP</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lightweight rhythm stats for the current studio crew.
              </p>
            </div>
            <Sparkles className="size-5 text-accent" aria-hidden="true" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {dashboard.characters.map((character) => (
              <Card key={character.id} className="h-full">
                <div className="flex items-center gap-4">
                  <Image
                    src={character.avatarSrc}
                    alt=""
                    width={72}
                    height={72}
                    className="size-16 rounded-lg border border-border bg-muted object-cover"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">
                      {character.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Character Level {character.level}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-mono text-2xl font-semibold">
                      {character.characterXp}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Character XP
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-semibold">
                      {character.xpToNextLevel}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      XP to next level
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Character level progress</span>
                    <span>{character.progressPercent}%</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    aria-label={`${character.progressPercent}% character progress`}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={character.progressPercent}
                  >
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${character.progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                  <p>{character.streakLabel}</p>
                  <p>{character.focusLabel}</p>
                  <p>{character.taskLabel}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <WeeklyQuestsPanel quests={dashboard.weeklyQuests} />
        </div>
      </section>

      <RecentActivityCard
        activities={dashboard.activities}
        expanded={showActivity}
        onToggle={() => setShowActivity((current) => !current)}
      />
    </div>
  );
}

function StudioXpSummary({ dashboard }: { dashboard: DashboardViewModel }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <StatusPill tone="info">Studio XP</StatusPill>
          <p className="mt-5 text-5xl font-semibold">
            Level {dashboard.studioLevel}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {dashboard.xpToNextLevel} XP until the studio reaches level{" "}
            {dashboard.studioLevel + 1}.
          </p>
        </div>
        <Link
          href="/studio-xp"
          className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm font-medium transition-colors hover:border-accent/60 hover:bg-muted"
        >
          View Studio XP
        </Link>
      </div>
      <div className="mt-8">
        <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
          <span>{dashboard.totalXp} total XP</span>
          <span>{dashboard.xpProgressPercent}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          aria-label={`${dashboard.xpProgressPercent}% progress to next level`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={dashboard.xpProgressPercent}
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${dashboard.xpProgressPercent}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

function RecentActivityCard({
  activities,
  expanded,
  onToggle,
}: {
  activities: DashboardActivity[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="p-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={expanded}
      >
        <span>
          <span className="font-semibold">Recent studio activity</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Shared progress with who completed each item.
          </span>
        </span>
        <span className="flex items-center gap-2 text-sm font-medium text-accent">
          {expanded ? "Hide" : "Show"}
          {expanded ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
          )}
        </span>
      </button>
      {expanded && (
        <div className="divide-y divide-border border-t border-border px-6">
          {activities.length === 0 ? (
            <p className="py-4 text-sm leading-6 text-muted-foreground">
              No Studio XP activity yet. Completed work will appear here.
            </p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium leading-6">
                    {activity.actorName} completed: {activity.description}
                  </p>
                </div>
                <StatusPill tone={activity.tone}>
                  {activity.occurredAtLabel}
                </StatusPill>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}

function metricCardTone(tone: DashboardViewModel["metrics"][number]["tone"]) {
  const tones: Record<
    DashboardViewModel["metrics"][number]["tone"],
    string
  > = {
    neutral: "bg-gradient-to-br from-white to-slate-50",
    info: "bg-gradient-to-br from-sky-50 to-blue-50",
    success: "bg-gradient-to-br from-emerald-50 to-teal-50",
    warning: "bg-gradient-to-br from-amber-50 to-orange-50",
  };

  return tones[tone];
}
