import type {
  ActionItemAssignedTo,
  ClassSessionStatus,
  StudentStatus,
} from "@/shared/database/database.types";

import type { DashboardTone } from "@/features/dashboard/domain/dashboard-view-model";

export interface DashboardStudentPlanItem {
  id: string;
  label: string;
  detail: string;
  href: string;
  tone: DashboardTone;
}

interface StudentPlanStudent {
  id: string;
  name: string;
  status: StudentStatus;
  followUpNeeded: boolean;
  remainingClassCredits: number;
}

interface StudentPlanSession {
  id: string;
  studentId: string;
  scheduledStart: string;
  status: ClassSessionStatus;
  lessonGoal: string;
}

interface StudentPlanActionItem {
  id: string;
  studentId: string;
  title: string;
  dueDate: string | null;
  assignedTo: ActionItemAssignedTo;
}

interface RankedStudentPlanItem extends DashboardStudentPlanItem {
  priority: number;
  sortAt: number;
}

export function buildDashboardStudentPlan({
  students,
  sessions,
  actionItems,
  now,
  timezone,
  limit = 5,
}: {
  students: StudentPlanStudent[];
  sessions: StudentPlanSession[];
  actionItems: StudentPlanActionItem[];
  now: Date;
  timezone: string;
  limit?: number;
}): DashboardStudentPlanItem[] {
  const nowMs = now.getTime();
  const today = getDateKey(now, timezone);
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const items: RankedStudentPlanItem[] = [];

  for (const session of sessions) {
    const student = studentsById.get(session.studentId);
    if (!student) continue;

    const scheduledAt = Date.parse(session.scheduledStart);
    if (!Number.isFinite(scheduledAt)) continue;

    if (scheduledAt < nowMs) {
      const summaryWaiting = session.status === "in_progress";
      items.push({
        id: `stale-session-${session.id}`,
        label: summaryWaiting
          ? `Complete ${student.name}'s class summary`
          : `Resolve ${student.name}'s past class`,
        detail: summaryWaiting
          ? `${formatDateTime(session.scheduledStart, timezone)} needs its attendance and summary completed.`
          : `${formatDateTime(session.scheduledStart, timezone)} is still ${formatStatus(session.status)}.`,
        href: `/students/${student.id}`,
        tone: "warning",
        priority: 0,
        sortAt: scheduledAt,
      });
      continue;
    }

    items.push({
      id: `upcoming-session-${session.id}`,
      label: session.lessonGoal.trim()
        ? `${student.name}'s next class`
        : `Prepare ${student.name}'s class`,
      detail: session.lessonGoal.trim()
        ? `${formatDateTime(session.scheduledStart, timezone)} · ${session.lessonGoal}`
        : `${formatDateTime(session.scheduledStart, timezone)} · Lesson goal needed`,
      href: `/students/${student.id}`,
      tone: session.lessonGoal.trim() ? "info" : "warning",
      priority: session.lessonGoal.trim() ? 3 : 1,
      sortAt: scheduledAt,
    });
  }

  for (const actionItem of actionItems) {
    if (actionItem.assignedTo !== "teacher") continue;
    const student = studentsById.get(actionItem.studentId);
    if (!student) continue;

    const overdue = actionItem.dueDate !== null && actionItem.dueDate < today;
    items.push({
      id: `action-${actionItem.id}`,
      label: actionItem.title,
      detail: `${student.name} · ${
        actionItem.dueDate
          ? overdue
            ? `Overdue since ${formatDate(actionItem.dueDate, timezone)}`
            : `Due ${formatDate(actionItem.dueDate, timezone)}`
          : "No due date"
      }`,
      href: `/students/${student.id}`,
      tone: overdue ? "warning" : "info",
      priority: overdue ? 0 : 2,
      sortAt: actionItem.dueDate
        ? Date.parse(`${actionItem.dueDate}T00:00:00.000Z`)
        : Number.MAX_SAFE_INTEGER,
    });
  }

  for (const student of students) {
    if (student.followUpNeeded) {
      items.push({
        id: `follow-up-${student.id}`,
        label: `Follow up with ${student.name}`,
        detail: "Student record is marked for follow-up.",
        href: `/students/${student.id}`,
        tone: "warning",
        priority: 2,
        sortAt: nowMs,
      });
    }

    if (
      student.status !== "Completed" &&
      student.remainingClassCredits <= 1
    ) {
      items.push({
        id: `credits-${student.id}`,
        label: `${student.name} has ${student.remainingClassCredits} class ${
          student.remainingClassCredits === 1 ? "credit" : "credits"
        }`,
        detail: "Review the class package before the next booking.",
        href: `/students/${student.id}`,
        tone: "warning",
        priority: 4,
        sortAt: nowMs,
      });
    }
  }

  return items
    .sort((left, right) => left.priority - right.priority || left.sortAt - right.sortAt)
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      label: item.label,
      detail: item.detail,
      href: item.href,
      tone: item.tone,
    }));
}

function getDateKey(date: Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatDate(value: string, timezone: string) {
  return formatDateTime(`${value}T12:00:00.000Z`, timezone, {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(
  value: string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  try {
    return new Intl.DateTimeFormat("en-CA", {
      ...options,
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      ...options,
      timeZone: "America/Vancouver",
    }).format(date);
  }
}

function formatStatus(status: ClassSessionStatus) {
  return status.replaceAll("_", " ");
}
