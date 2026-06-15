"use client";

import {
  Bell,
  BellOff,
  CalendarPlus,
  Check,
  CircleStop,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Save,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  archiveWorkCategory,
  cancelFocusSession,
  completeFocusSession,
  createWorkCategory,
  pauseFocusSession,
  recordPastFocusSession,
  renameWorkCategory,
  resumeFocusSession,
  startFocusSession,
  updateFocusSessionDetails,
  type FocusActionResult,
} from "@/features/focus/application/actions";
import {
  formatTimer,
  getDisplayedSeconds,
  type FocusRoomViewModel,
  type FocusSessionView,
} from "@/features/focus/domain/focus-room";
import { PresenceWorkspace } from "@/features/presence/ui/presence-workspace";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function FocusRoomClient({ room }: { room: FocusRoomViewModel }) {
  const initialFocus =
    room.activeSession?.kind === "focus" ? room.activeSession : null;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(0);
  const [mode, setMode] = useState<"pomodoro" | "freeform">(
    initialFocus?.mode ?? "pomodoro",
  );
  const [workName, setWorkName] = useState(initialFocus?.workName ?? "");
  const [workDescription, setWorkDescription] = useState(
    initialFocus?.workDescription ?? "",
  );
  const [workCategoryId, setWorkCategoryId] = useState(
    initialFocus?.workCategoryId ?? "",
  );
  const [linkedTaskId, setLinkedTaskId] = useState(
    initialFocus?.linkedTaskId ?? "",
  );
  const [continuedFromSessionId, setContinuedFromSessionId] = useState(
    initialFocus?.continuedFromSessionId ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryToEditId, setCategoryToEditId] = useState("");
  const [categoryEditName, setCategoryEditName] = useState("");
  const completionStarted = useRef(false);
  const active = room.activeSession;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const initialTick = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    completionStarted.current = false;
  }, [active?.id]);

  const displayedSeconds = active
    ? now > 0
      ? getDisplayedSeconds(active, now)
      : active.mode === "pomodoro"
        ? (active.remainingSecondsAtPause ?? active.plannedDurationSeconds ?? 0)
        : active.elapsedSecondsAtPause
    : 1500;

  const notifyCompletion = useCallback(() => {
    if (soundEnabled) playCompletionSound();
    if (
      notificationsEnabled &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("CCAD Focus Room", {
        body: "Your session is complete.",
      });
    }
  }, [notificationsEnabled, soundEnabled]);

  const finishSession = useCallback(
    (session: FocusSessionView) => {
      if (completionStarted.current) return;
      completionStarted.current = true;
      startTransition(async () => {
        const result = await completeFocusSession(session.id);
        if (result.ok) {
          notifyCompletion();
          setMessage(
            result.newLevel &&
              result.previousLevel &&
              result.newLevel > result.previousLevel
              ? `Pomodoro complete. CCAD reached level ${result.newLevel}.`
              : result.xpAwarded && result.characterXpAwarded
                ? "Pomodoro complete. CCAD earned 10 Studio XP and you earned 10 Character XP."
              : result.xpAwarded
                ? "Pomodoro complete. CCAD earned 10 Studio XP."
                : result.characterXpAwarded
                  ? "Pomodoro complete. Character XP awarded."
                  : "Session recorded.",
          );
          router.refresh();
        } else {
          setMessage(result.error ?? "Unable to complete the session.");
          completionStarted.current = false;
        }
      });
    },
    [notifyCompletion, router],
  );

  useEffect(() => {
    if (
      active?.mode === "pomodoro" &&
      active.state === "running" &&
      displayedSeconds === 0
    ) {
      finishSession(active);
    }
  }, [active, displayedSeconds, finishSession]);

  function runAction(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      setMessage(result.ok ? successMessage : (result.error ?? "Try again."));
      router.refresh();
    });
  }

  function startFocus() {
    runAction(
      () =>
        startFocusSession({
          mode,
          kind: "focus",
          workName,
          workDescription,
          workCategoryId,
          linkedTaskId: linkedTaskId || null,
          continuedFromSessionId: continuedFromSessionId || null,
        }),
      mode === "pomodoro" ? "Pomodoro started." : "Freeform timer started.",
    );
  }

  function startBreak(kind: "short_break" | "long_break") {
    runAction(
      () => startFocusSession({ mode: "pomodoro", kind }),
      kind === "short_break" ? "Short break started." : "Long break started.",
    );
  }

  function chooseTask(taskId: string) {
    setLinkedTaskId(taskId);
    const task = room.tasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    setWorkName(task.title);
    setWorkDescription(task.description ?? "");
    setWorkCategoryId(task.workCategoryId);
  }

  function continueWork(session: FocusSessionView) {
    setWorkName(session.workName ?? "");
    setWorkDescription(session.workDescription ?? "");
    setWorkCategoryId(session.workCategoryId ?? "");
    setLinkedTaskId(session.linkedTaskId ?? "");
    setContinuedFromSessionId(session.id);
    setMessage("Previous work loaded. Choose a mode and start when ready.");
  }

  async function toggleNotifications(enabled: boolean) {
    if (enabled && "Notification" in window) {
      const permission = await Notification.requestPermission();
      enabled = permission === "granted";
    }
    setNotificationsEnabled(enabled);
    window.localStorage.setItem(
      "ccad-focus-notifications",
      enabled ? "on" : "off",
    );
  }

  const isFocusActive = active?.kind === "focus";
  const canStartFocus =
    Boolean(workName.trim()) &&
    Boolean(workDescription.trim()) &&
    Boolean(workCategoryId);

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

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.75fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusPill tone={active ? "info" : "neutral"}>
                {active ? sessionLabel(active) : "Ready"}
              </StatusPill>
              {active && (
                <span className="text-xs font-medium text-muted-foreground">
                  Server-synced {active.state}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-7 p-6 sm:p-8">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {active ? timerDescription(active) : "Choose your focus mode"}
              </p>
              <p className="mt-3 font-mono text-6xl font-semibold tracking-tight sm:text-8xl">
                {formatTimer(displayedSeconds)}
              </p>
            </div>

            {active ? (
              <>
                <div className="flex flex-wrap justify-center gap-3">
                  {active.state === "running" ? (
                    <Button
                      disabled={isPending}
                      onClick={() =>
                        runAction(
                          () => pauseFocusSession(active.id),
                          "Session paused.",
                        )
                      }
                    >
                      <Pause aria-hidden="true" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      disabled={isPending}
                      onClick={() =>
                        runAction(
                          () => resumeFocusSession(active.id),
                          "Session resumed.",
                        )
                      }
                    >
                      <Play aria-hidden="true" />
                      Resume
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => finishSession(active)}
                  >
                    <Check aria-hidden="true" />
                    {active.mode === "freeform"
                      ? "Finish & record"
                      : "Finish early"}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={isPending}
                    onClick={() =>
                      runAction(
                        () => cancelFocusSession(active.id),
                        "Session cancelled.",
                      )
                    }
                  >
                    <CircleStop aria-hidden="true" />
                    Cancel
                  </Button>
                </div>
                {isFocusActive && (
                  <WorkDetails
                    active={active}
                    workName={workName}
                    setWorkName={setWorkName}
                    workDescription={workDescription}
                    setWorkDescription={setWorkDescription}
                    workCategoryId={workCategoryId}
                    setWorkCategoryId={setWorkCategoryId}
                    linkedTaskId={linkedTaskId}
                    chooseTask={chooseTask}
                    categories={room.categories}
                    tasks={room.tasks}
                    disabled={isPending}
                    embedded
                    onSave={() => {
                      runAction(
                        () =>
                          updateFocusSessionDetails({
                            sessionId: active.id,
                            workName,
                            workDescription,
                            workCategoryId,
                            linkedTaskId: linkedTaskId || null,
                          }),
                        "Active-session details saved.",
                      );
                    }}
                  />
                )}
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ModeButton
                    active={mode === "pomodoro"}
                    label="Pomodoro"
                    detail="25-minute focus interval"
                    onClick={() => setMode("pomodoro")}
                  />
                  <ModeButton
                    active={mode === "freeform"}
                    label="Freeform"
                    detail="Record however long you work"
                    onClick={() => setMode("freeform")}
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    disabled={isPending || !canStartFocus}
                    onClick={startFocus}
                  >
                    <Play aria-hidden="true" />
                    Start {mode === "pomodoro" ? "focus" : "freeform"}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => startBreak("short_break")}
                  >
                    <Coffee aria-hidden="true" />
                    Start 5-minute break
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={isPending || !room.longBreakAvailable}
                    onClick={() => startBreak("long_break")}
                  >
                    <Coffee aria-hidden="true" />
                    Start 15-minute break
                  </Button>
                </div>
                {!canStartFocus && (
                  <p className="text-center text-xs text-muted-foreground">
                    Add a work name, description, and shared category before
                    starting focus time.
                  </p>
                )}
                {!room.longBreakAvailable && (
                  <p className="text-center text-xs text-muted-foreground">
                    A long break becomes available after four full Pomodoros.
                  </p>
                )}
                <WorkDetails
                  active={null}
                  workName={workName}
                  setWorkName={setWorkName}
                  workDescription={workDescription}
                  setWorkDescription={setWorkDescription}
                  workCategoryId={workCategoryId}
                  setWorkCategoryId={setWorkCategoryId}
                  linkedTaskId={linkedTaskId}
                  chooseTask={chooseTask}
                  categories={room.categories}
                  tasks={room.tasks}
                  disabled={isPending}
                  embedded
                  onSave={() => {}}
                />
              </>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Completion preferences</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Both options stay off until you enable them.
          </p>
          <div className="mt-5 grid gap-3">
            <PreferenceButton
              enabled={soundEnabled}
              enabledIcon={<Volume2 aria-hidden="true" />}
              disabledIcon={<VolumeX aria-hidden="true" />}
              label="Completion sound"
              onClick={() => {
                const enabled = !soundEnabled;
                setSoundEnabled(enabled);
                window.localStorage.setItem(
                  "ccad-focus-sound",
                  enabled ? "on" : "off",
                );
              }}
            />
            <PreferenceButton
              enabled={notificationsEnabled}
              enabledIcon={<Bell aria-hidden="true" />}
              disabledIcon={<BellOff aria-hidden="true" />}
              label="Browser notification"
              onClick={() => toggleNotifications(!notificationsEnabled)}
            />
          </div>
          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Room presence</p>
            <div className="mt-3">
              <PresenceWorkspace />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <PastFocusSessionForm
          categories={room.categories}
          tasks={room.tasks}
          disabled={isPending}
          onSubmit={(input) => {
            startTransition(async () => {
              setMessage(null);
              const result = await recordPastFocusSession(input);
              if (!result.ok) {
                setMessage(result.error ?? "Unable to log the past session.");
                return;
              }
              setMessage(formatFocusResult(result, "Past session logged."));
              router.refresh();
            });
          }}
        />

        <Card>
          <h2 className="text-lg font-semibold">Continue previous work</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Starts a new session without changing the earlier record.
          </p>
          <div className="mt-5 grid gap-3">
            {room.recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Completed and cancelled focus sessions will appear here.
              </p>
            ) : (
              room.recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {session.workName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.recordedDurationSeconds
                        ? formatTimer(session.recordedDurationSeconds)
                        : session.state}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={Boolean(active)}
                    onClick={() => continueWork(session)}
                  >
                    <RotateCcw aria-hidden="true" />
                    Continue
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Shared work categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, rename, or archive categories used by focus sessions and tasks.
          </p>
          <div className="mt-5 grid gap-3">
            <input
              className={fieldClass}
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="New category name"
              aria-label="New category name"
            />
            <Button
              variant="secondary"
              disabled={isPending || !newCategoryName.trim()}
              onClick={() =>
                runAction(
                  async () => {
                    const result = await createWorkCategory(newCategoryName);
                    if (result.ok) setNewCategoryName("");
                    return result;
                  },
                  "Category added.",
                )
              }
            >
              Add category
            </Button>
            <select
              className={fieldClass}
              value={categoryToEditId}
              onChange={(event) => {
                setCategoryToEditId(event.target.value);
                setCategoryEditName(
                  room.categories.find(
                    (category) => category.id === event.target.value,
                  )?.name ?? "",
                );
              }}
              aria-label="Category to edit"
            >
              <option value="">Choose a category to edit</option>
              {room.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoryToEditId && (
              <>
                <input
                  className={fieldClass}
                  value={categoryEditName}
                  onChange={(event) => setCategoryEditName(event.target.value)}
                  aria-label="Edited category name"
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isPending || !categoryEditName.trim()}
                    onClick={() =>
                      runAction(
                        () =>
                          renameWorkCategory(categoryToEditId, categoryEditName),
                        "Category renamed.",
                      )
                    }
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending || Boolean(active)}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Archive this category? Existing records keep it.",
                        )
                      ) {
                        runAction(
                          async () => {
                            const result =
                              await archiveWorkCategory(categoryToEditId);
                            if (result.ok) {
                              setCategoryToEditId("");
                              setCategoryEditName("");
                            }
                            return result;
                          },
                          "Category archived.",
                        );
                      }
                    }}
                  >
                    Archive
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function PastFocusSessionForm({
  categories,
  tasks,
  disabled,
  onSubmit,
}: {
  categories: FocusRoomViewModel["categories"];
  tasks: FocusRoomViewModel["tasks"];
  disabled: boolean;
  onSubmit: (input: {
    mode: "pomodoro" | "freeform";
    workName: string;
    workDescription: string;
    workCategoryId: string;
    linkedTaskId: string | null;
    startedAt: string;
    durationMinutes: number;
  }) => void;
}) {
  const [mode, setMode] = useState<"pomodoro" | "freeform">("pomodoro");
  const [workName, setWorkName] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [workCategoryId, setWorkCategoryId] = useState("");
  const [linkedTaskId, setLinkedTaskId] = useState("");
  const [startedAt, setStartedAt] = useState(() =>
    toDatetimeLocal(new Date(Date.now() - 25 * 60 * 1000)),
  );
  const [durationMinutes, setDurationMinutes] = useState(25);

  function chooseTask(taskId: string) {
    setLinkedTaskId(taskId);
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    setWorkName(task.title);
    setWorkDescription(task.description ?? "");
    setWorkCategoryId(task.workCategoryId);
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Log past session</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add focus time that was completed without the timer running.
          </p>
        </div>
        <CalendarPlus aria-hidden="true" className="mt-1 size-5 text-accent" />
      </div>
      <form
        className="mt-5 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            mode,
            workName,
            workDescription,
            workCategoryId,
            linkedTaskId: linkedTaskId || null,
            startedAt: new Date(startedAt).toISOString(),
            durationMinutes,
          });
          setWorkName("");
          setWorkDescription("");
          setLinkedTaskId("");
          setDurationMinutes(mode === "pomodoro" ? 25 : 30);
          setStartedAt(toDatetimeLocal(new Date(Date.now() - 25 * 60 * 1000)));
        }}
      >
        <label className="grid gap-2 text-sm font-medium">
          Session type
          <select
            className={fieldClass}
            value={mode}
            onChange={(event) => {
              const nextMode = event.target.value as "pomodoro" | "freeform";
              setMode(nextMode);
              setDurationMinutes(nextMode === "pomodoro" ? 25 : 30);
            }}
          >
            <option value="pomodoro">Pomodoro</option>
            <option value="freeform">Freeform</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Linked task <span className="text-muted-foreground">(Optional)</span>
          <select
            className={fieldClass}
            value={linkedTaskId}
            onChange={(event) => chooseTask(event.target.value)}
          >
            <option value="">No linked task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Work name <span className="text-muted-foreground">(Required)</span>
          <input
            className={fieldClass}
            value={workName}
            onChange={(event) => setWorkName(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Shared category{" "}
          <span className="text-muted-foreground">(Required)</span>
          <select
            className={fieldClass}
            value={workCategoryId}
            onChange={(event) => setWorkCategoryId(event.target.value)}
            required
          >
            <option value="">Choose category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Started at
          <input
            className={fieldClass}
            type="datetime-local"
            value={startedAt}
            max={toDatetimeLocal(new Date())}
            onChange={(event) => setStartedAt(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Minutes
          <input
            className={fieldClass}
            type="number"
            min={1}
            max={720}
            value={durationMinutes}
            onChange={(event) =>
              setDurationMinutes(Number(event.target.value))
            }
            required
          />
          <span className="text-xs font-normal text-muted-foreground">
            Full Pomodoro sessions award Studio XP and Character XP.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Work description{" "}
          <span className="text-muted-foreground">(Required)</span>
          <textarea
            className={`${fieldClass} min-h-24 py-3`}
            value={workDescription}
            onChange={(event) => setWorkDescription(event.target.value)}
            required
          />
        </label>
        <Button
          type="submit"
          disabled={
            disabled ||
            !workName.trim() ||
            !workDescription.trim() ||
            !workCategoryId ||
            !startedAt ||
            durationMinutes < 1
          }
        >
          <CalendarPlus aria-hidden="true" />
          Log session
        </Button>
      </form>
    </Card>
  );
}

function WorkDetails({
  active,
  workName,
  setWorkName,
  workDescription,
  setWorkDescription,
  workCategoryId,
  setWorkCategoryId,
  linkedTaskId,
  chooseTask,
  categories,
  tasks,
  disabled,
  embedded = false,
  onSave,
}: {
  active: FocusSessionView | null;
  workName: string;
  setWorkName: (value: string) => void;
  workDescription: string;
  setWorkDescription: (value: string) => void;
  workCategoryId: string;
  setWorkCategoryId: (value: string) => void;
  linkedTaskId: string;
  chooseTask: (value: string) => void;
  categories: FocusRoomViewModel["categories"];
  tasks: FocusRoomViewModel["tasks"];
  disabled: boolean;
  embedded?: boolean;
  onSave: () => void;
}) {
  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Work details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {active
              ? "You can revise these details while the session is active."
              : "Required before starting focus or freeform time."}
          </p>
        </div>
        {active && (
          <Button disabled={disabled} onClick={onSave}>
            <Save aria-hidden="true" />
            Save details
          </Button>
        )}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Work name <span className="text-muted-foreground">(Required)</span>
          <input
            className={fieldClass}
            value={workName}
            onChange={(event) => setWorkName(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Shared category{" "}
          <span className="text-muted-foreground">(Required)</span>
          <select
            className={fieldClass}
            value={workCategoryId}
            onChange={(event) => setWorkCategoryId(event.target.value)}
            required
          >
            <option value="">Choose category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              Add a shared category below before starting focus time.
            </span>
          )}
        </label>
        <label className="grid gap-2 text-sm font-medium lg:col-span-2">
          Work description{" "}
          <span className="text-muted-foreground">(Required)</span>
          <textarea
            className={`${fieldClass} min-h-24 py-3`}
            value={workDescription}
            onChange={(event) => setWorkDescription(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium lg:col-span-2">
          Linked task <span className="text-muted-foreground">(Optional)</span>
          <select
            className={fieldClass}
            value={linkedTaskId}
            onChange={(event) => chooseTask(event.target.value)}
          >
            <option value="">No linked task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-4 text-left sm:p-5">
        {content}
      </div>
    );
  }

  return (
    <Card>
      {content}
    </Card>
  );
}

function ModeButton({
  active,
  label,
  detail,
  onClick,
}: {
  active: boolean;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-colors ${
        active
          ? "border-accent bg-accent/10"
          : "border-border bg-muted/30 hover:border-accent/50"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="mt-1 block text-sm text-muted-foreground">{detail}</span>
    </button>
  );
}

function PreferenceButton({
  enabled,
  enabledIcon,
  disabledIcon,
  label,
  onClick,
}: {
  enabled: boolean;
  enabledIcon: React.ReactNode;
  disabledIcon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-left text-sm font-medium transition-colors hover:border-accent/50"
    >
      <span className="flex items-center gap-3">
        {enabled ? enabledIcon : disabledIcon}
        {label}
      </span>
      <StatusPill tone={enabled ? "success" : "neutral"}>
        {enabled ? "On" : "Off"}
      </StatusPill>
    </button>
  );
}

function formatFocusResult(result: FocusActionResult, successMessage: string) {
  if (
    result.newLevel &&
    result.previousLevel &&
    result.newLevel > result.previousLevel
  ) {
    return `${successMessage} CCAD reached level ${result.newLevel}.`;
  }
  if (result.xpAwarded && result.characterXpAwarded) {
    return `${successMessage} CCAD earned 10 Studio XP and you earned 10 Character XP.`;
  }
  if (result.xpAwarded) {
    return `${successMessage} CCAD earned 10 Studio XP.`;
  }
  if (result.characterXpAwarded) {
    return `${successMessage} Character XP awarded.`;
  }
  return successMessage;
}

function toDatetimeLocal(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function sessionLabel(session: FocusSessionView) {
  if (session.kind === "short_break") return "Short break";
  if (session.kind === "long_break") return "Long break";
  return session.mode === "freeform" ? "Freeform focus" : "Pomodoro focus";
}

function timerDescription(session: FocusSessionView) {
  if (session.kind !== "focus") return "Breaks require no work details";
  return session.workName ?? "Focus session";
}

function playCompletionSound() {
  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 660;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
}
