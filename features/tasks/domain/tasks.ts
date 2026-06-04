import type {
  TaskPriority,
  TaskStatus,
} from "@/shared/database/database.types";

export interface TaskView {
  id: string;
  title: string;
  description: string | null;
  workCategoryId: string;
  workCategoryName: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeMemberId: string | null;
  assigneeName: string | null;
  dueAt: string | null;
  completedAt: string | null;
  firstCompletedAt: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskOption {
  id: string;
  name: string;
}

export interface TasksViewModel {
  tasks: TaskView[];
  categories: TaskOption[];
  members: TaskOption[];
  loadedAtMs: number;
}

export type TaskDueState = "none" | "upcoming" | "due_soon" | "overdue";

export const taskStatuses: Array<{
  value: TaskStatus;
  label: string;
  tone: "neutral" | "info" | "warning" | "success";
}> = [
  { value: "backlog", label: "Backlog", tone: "neutral" },
  { value: "planned", label: "Planned", tone: "info" },
  { value: "in_progress", label: "In progress", tone: "warning" },
  { value: "blocked", label: "Blocked", tone: "warning" },
  { value: "done", label: "Done", tone: "success" },
];

export function getTaskDueState(
  dueAt: string | null,
  status: TaskStatus,
  nowMs: number,
): TaskDueState {
  if (!dueAt || status === "done") return "none";
  const difference = new Date(dueAt).getTime() - nowMs;
  if (difference < 0) return "overdue";
  if (difference <= 48 * 60 * 60 * 1000) return "due_soon";
  return "upcoming";
}

export function formatTaskDueDate(
  dueAt: string | null,
  timezone: string,
): string | null {
  if (!dueAt) return null;
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(dueAt));
}
