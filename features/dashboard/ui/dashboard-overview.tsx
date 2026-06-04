import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, UsersRound } from "lucide-react";

import type { DashboardViewModel } from "@/features/dashboard/domain/dashboard-view-model";
import { PresencePanel } from "@/features/presence/ui/presence-panel";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

interface DashboardOverviewProps {
  dashboard: DashboardViewModel;
}

export function DashboardOverview({ dashboard }: DashboardOverviewProps) {
  return (
    <div className="grid gap-5">
      <section
        aria-label="Studio metrics"
        className="grid gap-4 md:grid-cols-3"
      >
        {dashboard.metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="group">
            <Card className="h-full transition-colors group-hover:border-accent/60 group-hover:bg-muted/50">
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

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden p-0">
          <div className="grid min-h-72 md:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col justify-between p-6 sm:p-8">
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
            </div>
            <Image
              src="/placeholders/pixel-office-empty.svg"
              alt=""
              width={960}
              height={540}
              className="h-full min-h-64 w-full border-t border-border object-cover md:border-l md:border-t-0"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Focus and presence</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ambient studio context, never a leaderboard.
              </p>
            </div>
            <UsersRound className="size-5 text-accent" aria-hidden="true" />
          </div>
          <div className="mt-6">
            <PresencePanel compact />
          </div>
          <Link
            href="/focus-room"
            className="mt-6 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm font-medium transition-colors hover:border-accent/60 hover:bg-muted"
          >
            Open Focus Room
            <Clock3 className="size-4 text-accent" aria-hidden="true" />
          </Link>
        </Card>
      </section>

      <Card>
        <div>
          <h2 className="text-lg font-semibold">Recent studio activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared progress and implementation milestones.
          </p>
        </div>
        <div className="mt-5 divide-y divide-border">
          {dashboard.activities.length === 0 ? (
            <p className="py-4 text-sm leading-6 text-muted-foreground">
              No Studio XP activity yet. Completed work will appear here.
            </p>
          ) : (
            dashboard.activities.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm leading-6">{activity.description}</p>
                <StatusPill tone={activity.tone}>
                  {activity.occurredAtLabel}
                </StatusPill>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
