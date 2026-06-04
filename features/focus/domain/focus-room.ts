import type {
  FocusKind,
  FocusMode,
  FocusState,
} from "@/shared/database/database.types";

export interface FocusSessionView {
  id: string;
  mode: FocusMode;
  kind: FocusKind;
  state: FocusState;
  workName: string | null;
  workDescription: string | null;
  workCategoryId: string | null;
  workCategoryName: string | null;
  linkedTaskId: string | null;
  continuedFromSessionId: string | null;
  plannedDurationSeconds: number | null;
  startedAt: string;
  resumedAt: string | null;
  endsAt: string | null;
  remainingSecondsAtPause: number | null;
  elapsedSecondsAtPause: number;
  recordedDurationSeconds: number | null;
  completedAt: string | null;
}

export interface WorkCategoryOption {
  id: string;
  name: string;
}

export interface FocusTaskOption {
  id: string;
  title: string;
  description: string | null;
  workCategoryId: string;
}

export interface FocusRoomViewModel {
  activeSession: FocusSessionView | null;
  categories: WorkCategoryOption[];
  tasks: FocusTaskOption[];
  recentSessions: FocusSessionView[];
  longBreakAvailable: boolean;
}

export function isLongBreakAvailable(
  completedPomodoroCount: number,
  latestPomodoroCompletedAt: string | null,
  latestLongBreakCompletedAt: string | null,
): boolean {
  if (
    completedPomodoroCount === 0 ||
    completedPomodoroCount % 4 !== 0 ||
    !latestPomodoroCompletedAt
  ) {
    return false;
  }

  return (
    !latestLongBreakCompletedAt ||
    new Date(latestLongBreakCompletedAt).getTime() <
      new Date(latestPomodoroCompletedAt).getTime()
  );
}

export function getDisplayedSeconds(
  session: FocusSessionView,
  nowMs: number,
): number {
  if (session.mode === "pomodoro") {
    if (session.state === "paused") {
      return session.remainingSecondsAtPause ?? 0;
    }

    return Math.max(
      0,
      Math.ceil((new Date(session.endsAt ?? nowMs).getTime() - nowMs) / 1000),
    );
  }

  if (session.state === "paused") {
    return session.elapsedSecondsAtPause;
  }

  return (
    session.elapsedSecondsAtPause +
    Math.max(
      0,
      Math.floor(
        (nowMs - new Date(session.resumedAt ?? session.startedAt).getTime()) /
          1000,
      ),
    )
  );
}

export function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, Math.trunc(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return hours > 0
    ? [hours, minutes, remainingSeconds]
        .map((part) => String(part).padStart(2, "0"))
        .join(":")
    : [minutes, remainingSeconds]
        .map((part) => String(part).padStart(2, "0"))
        .join(":");
}
