import { describe, expect, it } from "vitest";

import {
  formatTaskDueDate,
  getTaskDueState,
} from "@/features/tasks/domain/tasks";

describe("task due state", () => {
  const now = Date.parse("2026-06-04T00:00:00.000Z");

  it("marks active past-due tasks overdue", () => {
    expect(getTaskDueState("2026-06-03T00:00:00.000Z", "planned", now)).toBe(
      "overdue",
    );
  });

  it("marks tasks due within 48 hours as due soon", () => {
    expect(
      getTaskDueState("2026-06-05T12:00:00.000Z", "in_progress", now),
    ).toBe("due_soon");
  });

  it("marks later active tasks as upcoming", () => {
    expect(getTaskDueState("2026-06-10T00:00:00.000Z", "planned", now)).toBe(
      "upcoming",
    );
  });

  it("does not flag completed tasks as due", () => {
    expect(getTaskDueState("2026-06-03T00:00:00.000Z", "done", now)).toBe(
      "none",
    );
  });

  it("formats due dates using the organization timezone", () => {
    expect(
      formatTaskDueDate("2026-06-04T02:00:00.000Z", "America/Vancouver"),
    ).toBe("Jun 3, 2026");
  });
});
