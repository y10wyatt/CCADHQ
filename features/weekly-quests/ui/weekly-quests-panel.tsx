"use client";

import { Archive, Check, Pencil, Plus, Target, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  archiveWeeklyQuest,
  completeWeeklyQuest,
  createWeeklyQuest,
  updateWeeklyQuest,
  type WeeklyQuestActionResult,
} from "@/features/weekly-quests/application/actions";
import {
  studioStats,
  type WeeklyQuestView,
} from "@/features/weekly-quests/domain/weekly-quests";
import type { StudioStatKey } from "@/shared/database/database.types";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function WeeklyQuestsPanel({
  quests,
  title = "Weekly quests",
  description = "Shared direction for the studio this week.",
}: {
  quests: WeeklyQuestView[];
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<WeeklyQuestView | null>(null);

  function runAction(
    action: () => Promise<WeeklyQuestActionResult>,
    successMessage: string,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update the weekly quest.");
        return;
      }
      setMessage(formatSuccessMessage(result, successMessage));
      onSuccess?.();
      router.refresh();
    });
  }

  function beginCreate() {
    setEditingQuest(null);
    setFormOpen(true);
  }

  function beginEdit(quest: WeeklyQuestView) {
    setEditingQuest(quest);
    setFormOpen(true);
  }

  return (
    <section className="grid gap-4" aria-label={title}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Target className="size-5 text-accent" aria-hidden="true" />
          <Button size="sm" onClick={beginCreate}>
            <Plus aria-hidden="true" />
            Add quest
          </Button>
        </div>
      </div>

      {message && (
        <p
          aria-live="polite"
          className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
        >
          {message}
        </p>
      )}

      {formOpen && (
        <WeeklyQuestForm
          quest={editingQuest}
          disabled={isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={(input) =>
            runAction(
              () =>
                editingQuest
                  ? updateWeeklyQuest({ questId: editingQuest.id, ...input })
                  : createWeeklyQuest(input),
              editingQuest ? "Weekly quest updated." : "Weekly quest created.",
              () => setFormOpen(false),
            )
          }
        />
      )}

      <div className="grid gap-4">
        {quests.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
            No active weekly quests yet.
          </p>
        ) : (
          quests.map((quest) => (
            <WeeklyQuestCard
              key={quest.id}
              quest={quest}
              disabled={isPending}
              onEdit={() => beginEdit(quest)}
              onComplete={() =>
                runAction(
                  () => completeWeeklyQuest(quest.id),
                  "Weekly quest completed.",
                )
              }
              onArchive={() => {
                if (window.confirm(`Archive "${quest.title}"?`)) {
                  runAction(
                    () => archiveWeeklyQuest(quest.id),
                    "Weekly quest archived.",
                  );
                }
              }}
            />
          ))
        )}
      </div>
    </section>
  );
}

function WeeklyQuestCard({
  quest,
  disabled,
  onEdit,
  onComplete,
  onArchive,
}: {
  quest: WeeklyQuestView;
  disabled: boolean;
  onEdit: () => void;
  onComplete: () => void;
  onArchive: () => void;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={quest.status === "completed" ? "success" : "info"}>
              {quest.status === "completed" ? "Completed" : quest.stat}
            </StatusPill>
            <StatusPill tone="success">{quest.rewardLabel}</StatusPill>
            <StatusPill tone="neutral">{quest.characterRewardLabel}</StatusPill>
          </div>
          <h3 className="mt-3 text-base font-semibold">{quest.title}</h3>
          {quest.description && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {quest.description}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={disabled}>
            <Pencil aria-hidden="true" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onArchive}
            disabled={disabled}
          >
            <Archive aria-hidden="true" />
            Archive
          </Button>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
          <span>{quest.progressLabel}</span>
          <span>{quest.progressPercent}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          aria-label={`${quest.progressPercent}% quest progress`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={quest.progressPercent}
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${quest.progressPercent}%` }}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {quest.completedByName
            ? `Completed by ${quest.completedByName}`
            : quest.dueAt
              ? `Due ${formatDate(quest.dueAt)}`
              : "No due date"}
        </p>
        {quest.status !== "completed" && (
          <Button size="sm" onClick={onComplete} disabled={disabled}>
            <Check aria-hidden="true" />
            Complete quest
          </Button>
        )}
      </div>
    </Card>
  );
}

function WeeklyQuestForm({
  quest,
  disabled,
  onClose,
  onSubmit,
}: {
  quest: WeeklyQuestView | null;
  disabled: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description: string | null;
    studioStatKey: StudioStatKey | null;
    xpValue: number;
    characterXpValue: number;
    progressCurrent: number;
    progressTarget: number;
    dueAt: string | null;
  }) => void;
}) {
  const [title, setTitle] = useState(quest?.title ?? "");
  const [description, setDescription] = useState(quest?.description ?? "");
  const [studioStatKey, setStudioStatKey] = useState<StudioStatKey | "">(
    quest?.statKey ?? "",
  );
  const [xpValue, setXpValue] = useState(String(extractNumber(quest?.rewardLabel) ?? 250));
  const [characterXpValue, setCharacterXpValue] = useState(
    String(extractNumber(quest?.characterRewardLabel) ?? 25),
  );
  const [progressCurrent, setProgressCurrent] = useState(
    String(quest?.progressCurrent ?? 0),
  );
  const [progressTarget, setProgressTarget] = useState(
    String(quest?.progressTarget ?? 1),
  );
  const [dueDate, setDueDate] = useState(quest?.dueAt?.slice(0, 10) ?? "");

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            {quest ? "Edit weekly quest" : "Add weekly quest"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Quests create shared direction and reward Studio XP.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X aria-hidden="true" />
          Close
        </Button>
      </div>
      <form
        className="mt-5 grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            title,
            description: description.trim() || null,
            studioStatKey: studioStatKey || null,
            xpValue: Number(xpValue),
            characterXpValue: Number(characterXpValue),
            progressCurrent: Number(progressCurrent),
            progressTarget: Number(progressTarget),
            dueAt: dueDate ? `${dueDate}T12:00:00.000Z` : null,
          });
        }}
      >
        <label className="grid gap-2 text-sm font-medium">
          Title
          <input
            className={fieldClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Studio stat
          <select
            className={fieldClass}
            value={studioStatKey}
            onChange={(event) =>
              setStudioStatKey(event.target.value as StudioStatKey | "")
            }
          >
            <option value="">General studio</option>
            {studioStats.map((stat) => (
              <option key={stat.value} value={stat.value}>
                {stat.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium lg:col-span-2">
          Description
          <textarea
            className={`${fieldClass} min-h-24 py-3`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Studio XP reward
          <input
            className={fieldClass}
            type="number"
            min={0}
            max={5000}
            value={xpValue}
            onChange={(event) => setXpValue(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Character XP reward
          <input
            className={fieldClass}
            type="number"
            min={0}
            max={500}
            value={characterXpValue}
            onChange={(event) => setCharacterXpValue(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Current progress
          <input
            className={fieldClass}
            type="number"
            min={0}
            max={999}
            value={progressCurrent}
            onChange={(event) => setProgressCurrent(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Target steps
          <input
            className={fieldClass}
            type="number"
            min={1}
            max={999}
            value={progressTarget}
            onChange={(event) => setProgressTarget(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Due date
          <input
            className={fieldClass}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={
              disabled ||
              !title.trim() ||
              Number(progressCurrent) > Number(progressTarget)
            }
          >
            {quest ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {quest ? "Save quest" : "Create quest"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function formatSuccessMessage(
  result: WeeklyQuestActionResult,
  successMessage: string,
) {
  if (
    result.newLevel &&
    result.previousLevel &&
    result.newLevel > result.previousLevel
  ) {
    return `${successMessage} CCAD reached level ${result.newLevel}.`;
  }
  if (result.studioXpAwarded && result.characterXpAwarded) {
    return `${successMessage} Studio XP and Character XP awarded.`;
  }
  if (result.studioXpAwarded) return `${successMessage} Studio XP awarded.`;
  if (result.characterXpAwarded) {
    return `${successMessage} Character XP awarded.`;
  }
  return successMessage;
}

function extractNumber(label: string | undefined) {
  if (!label) return null;
  const match = label.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
