"use client";

import { Award, Minus, Plus, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createStudioXpCorrection } from "@/features/studio-xp/application/actions";
import type { StudioXpViewModel } from "@/features/studio-xp/domain/studio-xp";
import { PresenceWorkspace } from "@/features/presence/ui/presence-workspace";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function StudioXpOverview({ studio }: { studio: StudioXpViewModel }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function submitCorrection() {
    startTransition(async () => {
      setMessage(null);
      const result = await createStudioXpCorrection({
        correctionId: crypto.randomUUID(),
        points: Number(points),
        reason,
      });

      if (!result.ok) {
        setMessage(result.error ?? "Unable to record the correction.");
        return;
      }

      setPoints("");
      setReason("");
      setMessage(
        result.newLevel &&
          result.previousLevel &&
          result.newLevel > result.previousLevel
          ? `Correction recorded. CCAD reached level ${result.newLevel}.`
          : `Correction recorded. Studio XP is now ${result.newTotal ?? studio.totalXp}.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      {message && (
        <p
          aria-live="polite"
          className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
        >
          {message}
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <StatusPill tone="info">CCAD level</StatusPill>
          <p className="mt-5 font-mono text-5xl font-semibold">
            {studio.level}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Shared studio progression
          </p>
        </Card>
        <Card>
          <StatusPill tone="success">Total Studio XP</StatusPill>
          <p className="mt-5 font-mono text-5xl font-semibold">
            {studio.totalXp}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Earned by CCAD as one organization
          </p>
        </Card>
        <Card>
          <StatusPill tone="neutral">Next level</StatusPill>
          <p className="mt-5 font-mono text-5xl font-semibold">
            {studio.xpToNextLevel}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            XP until level {studio.level + 1}
          </p>
        </Card>
      </section>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Level progress</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The organization is the character. No individual totals exist.
            </p>
          </div>
          <StatusPill tone="info">{studio.progressPercent}%</StatusPill>
        </div>
        <div
          className="mt-6 h-3 overflow-hidden rounded-full bg-muted"
          aria-label={`${studio.progressPercent}% progress to the next CCAD level`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={studio.progressPercent}
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${studio.progressPercent}%` }}
          />
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold">Focus and presence</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional live studio context, including Pixel Office.
          </p>
        </div>
        <div className="mt-5">
          <PresenceWorkspace />
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Shared XP activity</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Attribution provides context without scoring individual staff.
              </p>
            </div>
            <Award className="size-5 text-accent" aria-hidden="true" />
          </div>
          <div className="mt-5 divide-y divide-border">
            {studio.activities.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Completed Pomodoros, tasks, and corrections will appear here.
              </p>
            ) : (
              studio.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm leading-6">{activity.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activity.actorName
                        ? `Recorded by ${activity.actorName}`
                        : "System recorded"}{" "}
                      | {activity.occurredAtLabel}
                    </p>
                  </div>
                  <StatusPill tone={activity.points > 0 ? "success" : "warning"}>
                    {activity.points > 0 ? "+" : ""}
                    {activity.points} XP
                  </StatusPill>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="grid content-start gap-5">
          <Card>
            <h2 className="text-lg font-semibold">MVP awards</h2>
            <div className="mt-5 grid gap-3">
              <AwardRule
                icon={<Sparkles aria-hidden="true" />}
                label="Full Pomodoro focus"
                points="+10 XP"
              />
              <AwardRule
                icon={<Plus aria-hidden="true" />}
                label="Complete task"
                points="+20 XP"
              />
              <AwardRule
                icon={<Minus aria-hidden="true" />}
                label="Admin correction"
                points="Signed"
              />
            </div>
          </Card>

          {studio.isAdmin && (
            <Card>
              <h2 className="text-lg font-semibold">Admin correction</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Corrections append a visible signed ledger event. Existing XP
                events are never edited.
              </p>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  Points
                  <input
                    className={fieldClass}
                    type="number"
                    min="-100000"
                    max="100000"
                    value={points}
                    onChange={(event) => setPoints(event.target.value)}
                    placeholder="Use a negative value to subtract"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Reason
                  <textarea
                    className={`${fieldClass} min-h-24 py-3`}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Why is this correction needed?"
                  />
                </label>
                <Button
                  disabled={
                    isPending ||
                    !reason.trim() ||
                    !points ||
                    Number(points) === 0
                  }
                  onClick={submitCorrection}
                >
                  Record correction
                </Button>
              </div>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function AwardRule({
  icon,
  label,
  points,
}: {
  icon: React.ReactNode;
  label: string;
  points: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
      <span className="flex items-center gap-3 text-sm font-medium">
        <span className="text-accent">{icon}</span>
        {label}
      </span>
      <StatusPill tone="neutral">{points}</StatusPill>
    </div>
  );
}
