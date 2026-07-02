import type {
  ActionItemAssignedTo,
  ActionItemStatus,
  AttendanceStatus,
  ClassLogTeacher,
  ClassSessionStatus,
  PermissionToPost,
  StudentProgram,
  StudentStatus,
} from "@/shared/database/database.types";

export type {
  ActionItemAssignedTo,
  ActionItemStatus,
  AttendanceStatus,
  ClassLogTeacher,
  ClassSessionStatus,
  PermissionToPost,
  StudentProgram,
  StudentStatus,
};

export const studentPrograms: StudentProgram[] = [
  "Portfolio",
  "AP Drawing",
  "Animation",
  "Trial",
  "Other",
];
export const studentStatuses: StudentStatus[] = [
  "Active",
  "Trial",
  "Paused",
  "Completed",
];
export const permissionOptions: PermissionToPost[] = ["Yes", "No", "Pending"];
export const classLogTeachers: ClassLogTeacher[] = [
  "William",
  "Alice",
  "Gerald",
  "Other",
];
export const classSessionStatuses: ClassSessionStatus[] = [
  "planned",
  "in_progress",
  "completed",
  "reported",
  "excused_absence",
  "unexcused_absence",
  "cancelled",
  "rescheduled",
];
export const attendanceStatuses: AttendanceStatus[] = [
  "pending",
  "attended",
  "excused_absence",
  "unexcused_absence",
  "cancelled",
  "rescheduled",
];
export const actionItemStatuses: ActionItemStatus[] = [
  "open",
  "completed",
  "dismissed",
];

export interface StudentView {
  id: string;
  name: string;
  grade: string;
  program: StudentProgram;
  status: StudentStatus;
  mainGoal: string;
  currentFocus: string;
  nextAction: string;
  nextClassDate: string | null;
  lastClassDate: string | null;
  followUpNeeded: boolean;
  permissionToPost: PermissionToPost;
  notes: string;
  strengths: string[];
  needsSupport: string[];
  applicationTargets: string[];
  parentNotes: string;
  paymentNotes: string;
  remainingClassCredits: number;
  originalLeadId: string | null;
}

export interface ClassLogView {
  id: string;
  studentId: string;
  date: string;
  teacher: ClassLogTeacher;
  duration: string;
  workedOn: string;
  feedbackGiven: string;
  homeworkAssigned: string;
  materialsNeeded: string;
  parentUpdateSent: boolean;
  nextClassFocus: string;
  imageUrl: string | null;
}

export interface ClassSessionView {
  id: string;
  studentId: string;
  enrollmentId: string | null;
  seriesId: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: ClassSessionStatus;
  attendanceStatus: AttendanceStatus;
  deductsCredit: boolean;
  lessonGoal: string;
  planNotes: string;
  materialsNeeded: string;
  teacherPrivateNotes: string;
  actualSummary: string;
  studentProgress: string;
  homeworkAssigned: string;
  noHomework: boolean;
  parentFacingSummary: string;
  internalTeacherNotes: string;
  nextClassRecommendation: string;
  progressTags: string[];
  parentReportSentAt: string | null;
}

export interface StudentActionItemView {
  id: string;
  studentId: string;
  classSessionId: string | null;
  assignedTo: ActionItemAssignedTo;
  title: string;
  description: string;
  dueDate: string | null;
  status: ActionItemStatus;
}

export interface StudentSessionContext {
  student: StudentView;
  classLogs: ClassLogView[];
  sessions: ClassSessionView[];
  upcomingSession: ClassSessionView | null;
  previousCompletedSession: ClassSessionView | null;
  openStudentActionItems: StudentActionItemView[];
  openTeacherActionItems: StudentActionItemView[];
}

export function attendanceDeductsCredit(status: AttendanceStatus): boolean {
  return status === "attended" || status === "unexcused_absence";
}

export function getAttendanceCreditDelta({
  previousDeductsCredit,
  nextAttendanceStatus,
}: {
  previousDeductsCredit: boolean;
  nextAttendanceStatus: AttendanceStatus;
}): number {
  const nextDeductsCredit = attendanceDeductsCredit(nextAttendanceStatus);

  if (previousDeductsCredit === nextDeductsCredit) {
    return 0;
  }

  return nextDeductsCredit ? -1 : 1;
}

export function getSessionStatusForAttendance(
  attendanceStatus: AttendanceStatus,
  fallbackStatus: ClassSessionStatus,
): ClassSessionStatus {
  if (
    attendanceStatus === "excused_absence" ||
    attendanceStatus === "unexcused_absence" ||
    attendanceStatus === "cancelled" ||
    attendanceStatus === "rescheduled"
  ) {
    return attendanceStatus;
  }

  return fallbackStatus;
}

export function hasCompletedSummaryRequirements(
  session: Pick<
    ClassSessionView,
    | "attendanceStatus"
    | "actualSummary"
    | "homeworkAssigned"
    | "noHomework"
    | "nextClassRecommendation"
  >,
): boolean {
  return (
    session.attendanceStatus !== "pending" &&
    session.actualSummary.trim().length > 0 &&
    (session.noHomework || session.homeworkAssigned.trim().length > 0) &&
    session.nextClassRecommendation.trim().length > 0
  );
}
