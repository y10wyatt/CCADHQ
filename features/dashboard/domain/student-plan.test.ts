import { describe, expect, it } from "vitest";

import { buildDashboardStudentPlan } from "@/features/dashboard/domain/student-plan";

describe("buildDashboardStudentPlan", () => {
  it("prioritizes unresolved past classes and overdue teacher actions", () => {
    const items = buildDashboardStudentPlan({
      now: new Date("2026-07-05T18:00:00.000Z"),
      timezone: "America/Vancouver",
      students: [
        {
          id: "student-1",
          name: "Avery",
          status: "Active",
          followUpNeeded: true,
          remainingClassCredits: 0,
        },
      ],
      sessions: [
        {
          id: "session-1",
          studentId: "student-1",
          scheduledStart: "2026-07-04T18:00:00.000Z",
          status: "planned",
          lessonGoal: "",
        },
      ],
      actionItems: [
        {
          id: "action-1",
          studentId: "student-1",
          title: "Send portfolio examples",
          dueDate: "2026-07-03",
          assignedTo: "teacher",
        },
      ],
    });

    expect(items.map((item) => item.label)).toEqual([
      "Send portfolio examples",
      "Resolve Avery's past class",
      "Follow up with Avery",
      "Avery has 0 class credits",
    ]);
  });

  it("limits the dashboard to five items", () => {
    const students = Array.from({ length: 6 }, (_, index) => ({
      id: `student-${index}`,
      name: `Student ${index}`,
      status: "Active" as const,
      followUpNeeded: true,
      remainingClassCredits: 3,
    }));

    expect(
      buildDashboardStudentPlan({
        now: new Date("2026-07-05T18:00:00.000Z"),
        timezone: "America/Vancouver",
        students,
        sessions: [],
        actionItems: [],
      }),
    ).toHaveLength(5);
  });

  it("labels a past in-progress class as a summary waiting", () => {
    const items = buildDashboardStudentPlan({
      now: new Date("2026-07-05T18:00:00.000Z"),
      timezone: "America/Vancouver",
      students: [
        {
          id: "student-1",
          name: "Avery",
          status: "Active",
          followUpNeeded: false,
          remainingClassCredits: 3,
        },
      ],
      sessions: [
        {
          id: "session-1",
          studentId: "student-1",
          scheduledStart: "2026-07-04T18:00:00.000Z",
          status: "in_progress",
          lessonGoal: "Portfolio review",
        },
      ],
      actionItems: [],
    });

    expect(items[0].label).toBe("Complete Avery's class summary");
  });
});
