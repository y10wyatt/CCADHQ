import { describe, expect, it } from "vitest";

import {
  attendanceDeductsCredit,
  getAttendanceCreditDelta,
  getSessionStatusForAttendance,
  hasCompletedSummaryRequirements,
} from "@/features/students/domain/students";

describe("student class session rules", () => {
  it("deducts credit only for attended and unexcused absences", () => {
    expect(attendanceDeductsCredit("attended")).toBe(true);
    expect(attendanceDeductsCredit("unexcused_absence")).toBe(true);
    expect(attendanceDeductsCredit("excused_absence")).toBe(false);
    expect(attendanceDeductsCredit("cancelled")).toBe(false);
    expect(attendanceDeductsCredit("rescheduled")).toBe(false);
    expect(attendanceDeductsCredit("pending")).toBe(false);
  });

  it("deducts once when attendance becomes credit-bearing", () => {
    expect(
      getAttendanceCreditDelta({
        previousDeductsCredit: false,
        nextAttendanceStatus: "attended",
      }),
    ).toBe(-1);
  });

  it("does not deduct again when a credit-bearing attendance is edited", () => {
    expect(
      getAttendanceCreditDelta({
        previousDeductsCredit: true,
        nextAttendanceStatus: "unexcused_absence",
      }),
    ).toBe(0);
  });

  it("restores credit when attendance changes to a non-deducting status", () => {
    expect(
      getAttendanceCreditDelta({
        previousDeductsCredit: true,
        nextAttendanceStatus: "excused_absence",
      }),
    ).toBe(1);
  });

  it("maps absence-style attendance to session lifecycle status", () => {
    expect(getSessionStatusForAttendance("cancelled", "in_progress")).toBe(
      "cancelled",
    );
    expect(getSessionStatusForAttendance("attended", "in_progress")).toBe(
      "in_progress",
    );
  });

  it("keeps after-class required fields minimal", () => {
    expect(
      hasCompletedSummaryRequirements({
        attendanceStatus: "attended",
        actualSummary: "Reviewed portfolio thumbnails.",
        homeworkAssigned: "",
        noHomework: true,
        nextClassRecommendation: "Start final composition.",
      }),
    ).toBe(true);
  });
});
