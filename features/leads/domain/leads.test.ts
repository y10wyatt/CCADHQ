import { describe, expect, it } from "vitest";

import {
  buildLeadOverviewMetrics,
  buildLeadSourceReports,
  getFollowUpState,
  type LeadView,
} from "@/features/leads/domain/leads";

describe("lead domain", () => {
  it("summarizes admissions pipeline and follow-up health", () => {
    const now = new Date("2026-06-20T12:00:00.000Z");
    const metrics = buildLeadOverviewMetrics({
      now,
      leads: [
        lead({
          id: "lead-1",
          source: "Referral",
          status: "New Inquiry",
          createdAt: "2026-06-01T10:00:00.000Z",
          nextFollowUpDate: "2026-06-20",
          potentialRevenueMinor: 1888800,
        }),
        lead({
          id: "lead-2",
          source: "Instagram",
          status: "Contacted",
          createdAt: "2026-05-15T10:00:00.000Z",
          nextFollowUpDate: "2026-06-18",
          potentialRevenueMinor: 1200000,
        }),
        lead({
          id: "lead-3",
          source: "Referral",
          status: "Enrolled",
          createdAt: "2026-06-04T10:00:00.000Z",
          convertedStudentId: "student-1",
          convertedAt: "2026-06-19T10:00:00.000Z",
          potentialRevenueMinor: 1888800,
        }),
      ],
    });

    expect(metrics.activeLeads).toBe(2);
    expect(metrics.newLeadsThisMonth).toBe(2);
    expect(metrics.enrolledThisMonth).toBe(1);
    expect(metrics.conversionRate).toBe(33);
    expect(metrics.pipelineRevenueMinor).toBe(3088800);
    expect(metrics.followUpsDueToday).toBe(1);
    expect(metrics.overdueFollowUps).toBe(1);
  });

  it("reports marketing source attribution", () => {
    const reports = buildLeadSourceReports([
      lead({ id: "lead-1", source: "Referral", status: "Enrolled", convertedStudentId: "student-1", potentialRevenueMinor: 1888800 }),
      lead({ id: "lead-2", source: "Referral", status: "Contacted", potentialRevenueMinor: 1888800 }),
      lead({ id: "lead-3", source: "Instagram", status: "Lost", potentialRevenueMinor: 1200000 }),
    ]);

    const referral = reports.find((report) => report.source === "Referral");
    const instagram = reports.find((report) => report.source === "Instagram");

    expect(referral).toMatchObject({
      leads: 2,
      enrollments: 1,
      conversionRate: 50,
      revenueMinor: 1888800,
    });
    expect(instagram).toMatchObject({
      leads: 1,
      enrollments: 0,
      conversionRate: 0,
      revenueMinor: 0,
    });
  });

  it("calculates conversion from one all-time lead cohort", () => {
    const metrics = buildLeadOverviewMetrics({
      now: new Date("2026-06-20T12:00:00.000Z"),
      leads: [
        lead({
          id: "old-enrollment",
          status: "Enrolled",
          convertedStudentId: "student-1",
          convertedAt: "2026-05-15T12:00:00.000Z",
        }),
        lead({
          id: "june-enrollment",
          status: "Enrolled",
          convertedStudentId: "student-2",
          convertedAt: "2026-06-15T12:00:00.000Z",
        }),
        lead({ id: "active-lead", status: "New Inquiry" }),
        lead({ id: "lost-lead", status: "Lost" }),
      ],
    });

    expect(metrics.enrolledThisMonth).toBe(1);
    expect(metrics.conversionRate).toBe(50);
  });

  it("classifies follow-up dates", () => {
    expect(getFollowUpState("2026-06-19", "2026-06-20")).toBe("overdue");
    expect(getFollowUpState("2026-06-20", "2026-06-20")).toBe("due-today");
    expect(getFollowUpState("2026-06-22", "2026-06-20")).toBe("due-soon");
    expect(getFollowUpState("2026-07-01", "2026-06-20")).toBe("scheduled");
  });
});

function lead(overrides: Partial<LeadView>): LeadView {
  return {
    id: "lead",
    studentName: "Student",
    grade: "11",
    school: "High School",
    parentName: "Parent",
    parentEmail: "parent@example.com",
    parentPhone: "",
    programInterest: "Portfolio",
    targetSchools: [],
    goals: "",
    timeline: "",
    source: "Website",
    status: "New Inquiry",
    potentialRevenueMinor: 0,
    assignedStaff: "Team",
    createdAt: "2026-06-01T10:00:00.000Z",
    lastContactedDate: null,
    nextFollowUpDate: null,
    notes: "",
    convertedStudentId: null,
    convertedAt: null,
    ...overrides,
  };
}
