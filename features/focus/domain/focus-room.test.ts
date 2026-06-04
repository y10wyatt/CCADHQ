import { describe, expect, it } from "vitest";

import {
  formatTimer,
  getDisplayedSeconds,
  isLongBreakAvailable,
  type FocusSessionView,
} from "@/features/focus/domain/focus-room";

const baseSession: FocusSessionView = {
  id: "session-id",
  mode: "pomodoro",
  kind: "focus",
  state: "running",
  workName: "Prepare lesson",
  workDescription: "Prepare the next lesson plan.",
  workCategoryId: "category-id",
  workCategoryName: "Teaching & Curriculum",
  linkedTaskId: null,
  continuedFromSessionId: null,
  plannedDurationSeconds: 1500,
  startedAt: "2026-06-04T00:00:00.000Z",
  resumedAt: null,
  endsAt: "2026-06-04T00:25:00.000Z",
  remainingSecondsAtPause: null,
  elapsedSecondsAtPause: 0,
  recordedDurationSeconds: null,
  completedAt: null,
};

describe("focus-room timer display", () => {
  it("derives a running Pomodoro countdown from its server end time", () => {
    expect(
      getDisplayedSeconds(baseSession, Date.parse("2026-06-04T00:10:00.000Z")),
    ).toBe(900);
  });

  it("uses the stored remaining time for a paused Pomodoro", () => {
    expect(
      getDisplayedSeconds(
        {
          ...baseSession,
          state: "paused",
          endsAt: null,
          remainingSecondsAtPause: 725,
        },
        Date.parse("2026-06-04T01:00:00.000Z"),
      ),
    ).toBe(725);
  });

  it("adds the current running interval to persisted freeform time", () => {
    expect(
      getDisplayedSeconds(
        {
          ...baseSession,
          mode: "freeform",
          plannedDurationSeconds: null,
          endsAt: null,
          resumedAt: "2026-06-04T00:10:00.000Z",
          elapsedSecondsAtPause: 300,
        },
        Date.parse("2026-06-04T00:20:00.000Z"),
      ),
    ).toBe(900);
  });

  it("uses persisted elapsed time for a paused freeform session", () => {
    expect(
      getDisplayedSeconds(
        {
          ...baseSession,
          mode: "freeform",
          state: "paused",
          plannedDurationSeconds: null,
          endsAt: null,
          elapsedSecondsAtPause: 4510,
        },
        Date.parse("2026-06-04T02:00:00.000Z"),
      ),
    ).toBe(4510);
  });
});

describe("focus-room timer formatting", () => {
  it("formats durations below one hour as minutes and seconds", () => {
    expect(formatTimer(1500)).toBe("25:00");
  });

  it("formats longer freeform durations with hours", () => {
    expect(formatTimer(4510)).toBe("01:15:10");
  });
});

describe("long-break availability", () => {
  const latestPomodoro = "2026-06-04T01:00:00.000Z";

  it("offers a long break at each four-Pomodoro milestone", () => {
    expect(isLongBreakAvailable(4, latestPomodoro, null)).toBe(true);
    expect(
      isLongBreakAvailable(8, latestPomodoro, "2026-06-04T00:30:00.000Z"),
    ).toBe(true);
  });

  it("does not offer a completed milestone's long break again", () => {
    expect(
      isLongBreakAvailable(4, latestPomodoro, "2026-06-04T01:15:00.000Z"),
    ).toBe(false);
  });

  it("does not offer a long break before a four-Pomodoro milestone", () => {
    expect(isLongBreakAvailable(3, latestPomodoro, null)).toBe(false);
  });
});
