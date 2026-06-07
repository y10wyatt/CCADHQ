"use client";

import {
  Archive,
  Check,
  Columns3,
  List,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  archiveTask,
  createTask,
  transitionTask,
  updateTask,
  type TaskActionResult,
} from "@/features/tasks/application/actions";
import {
  formatTaskDueDate,
  getTaskDueState,
  taskStatuses,
  type TasksViewModel,
  type TaskView,
} from "@/features/tasks/domain/tasks";
import type {
  TaskPriority,
  TaskStatus,
} from "@/shared/database/database.types";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";
const priorities: TaskPriority[] = ["low", "normal", "high", "urgent"];

export function TasksWorkspace({
  room,
  timezone,
  nowMs,
}: {
  room: TasksViewModel;
  timezone: string;
  nowMs: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskView | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState<
    "all" | "overdue" | "due_soon" | "upcoming" | "none"
  >("all");

  const filteredTasks = useMemo(
    () =>
      room.tasks.filter((task) => {
        const dueState = getTaskDueState(task.dueAt, task.status, nowMs);
        return (
          (statusFilter === "all" || task.status === statusFilter) &&
          (priorityFilter === "all" || task.priority === priorityFilter) &&
          (assigneeFilter === "all" ||
            (assigneeFilter === "unassigned"
              ? !task.assigneeMemberId
              : task.assigneeMemberId === assigneeFilter)) &&
          (dueFilter === "all" ||
            (dueFilter === "none" ? !task.dueAt : dueState === dueFilter))
        );
      }),
    [
      assigneeFilter,
      dueFilter,
      nowMs,
      priorityFilter,
      room.tasks,
      statusFilter,
    ],
  );

  function runAction(
    action: () => Promise<TaskActionResult>,
    successMessage: string,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update the task.");
        return;
      }
      setMessage(
        result.newLevel &&
          result.previousLevel &&
          result.newLevel > result.previousLevel
          ? `${successMessage} CCAD reached level ${result.newLevel}.`
          : result.xpAwarded && result.characterXpAwarded
            ? `${successMessage} CCAD earned 20 Studio XP and you earned 15 Character XP.`
          : result.xpAwarded
            ? `${successMessage} CCAD earned 20 Studio XP.`
            : result.characterXpAwarded
              ? `${successMessage} Character XP awarded.`
            : successMessage,
      );
      onSuccess?.();
      router.refresh();
    });
  }

  function beginCreate() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function beginEdit(task: TaskView) {
    setEditingTask(task);
    setFormOpen(true);
  }

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

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <ViewButton
              active={view === "kanban"}
              icon={<Columns3 aria-hidden="true" />}
              label="Kanban"
              onClick={() => setView("kanban")}
            />
            <ViewButton
              active={view === "list"}
              icon={<List aria-hidden="true" />}
              label="List"
              onClick={() => setView("list")}
            />
          </div>
          <Button onClick={beginCreate}>
            <Plus aria-hidden="true" />
            Add task
          </Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as TaskStatus | "all")}
            options={[
              { value: "all", label: "All statuses" },
              ...taskStatuses.map((status) => ({
                value: status.value,
                label: status.label,
              })),
            ]}
          />
          <FilterSelect
            label="Priority"
            value={priorityFilter}
            onChange={(value) =>
              setPriorityFilter(value as TaskPriority | "all")
            }
            options={[
              { value: "all", label: "All priorities" },
              ...priorities.map((priority) => ({
                value: priority,
                label: capitalize(priority),
              })),
            ]}
          />
          <FilterSelect
            label="Assignee"
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            options={[
              { value: "all", label: "All assignees" },
              { value: "unassigned", label: "Unassigned" },
              ...room.members.map((member) => ({
                value: member.id,
                label: member.name,
              })),
            ]}
          />
          <FilterSelect
            label="Due"
            value={dueFilter}
            onChange={(value) =>
              setDueFilter(value as typeof dueFilter)
            }
            options={[
              { value: "all", label: "All due states" },
              { value: "overdue", label: "Overdue" },
              { value: "due_soon", label: "Due within 48 hours" },
              { value: "upcoming", label: "Upcoming" },
              { value: "none", label: "No due date" },
            ]}
          />
        </div>
      </Card>

      {formOpen && (
        <TaskForm
          task={editingTask}
          categories={room.categories}
          members={room.members}
          disabled={isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={(input) =>
            runAction(
              () =>
                editingTask
                  ? updateTask({ taskId: editingTask.id, ...input })
                  : createTask(input),
              editingTask ? "Task updated." : "Task created.",
              () => setFormOpen(false),
            )
          }
        />
      )}

      {view === "kanban" ? (
        <KanbanBoard
          tasks={filteredTasks}
          timezone={timezone}
          nowMs={nowMs}
          disabled={isPending}
          onEdit={beginEdit}
          onMove={(task, status) =>
            runAction(
              () => transitionTask(task.id, status),
              transitionMessage(task, status),
            )
          }
          onArchive={(task) => {
            if (window.confirm(`Archive "${task.title}"?`)) {
              runAction(() => archiveTask(task.id), "Task archived.");
            }
          }}
        />
      ) : (
        <TaskList
          tasks={filteredTasks}
          timezone={timezone}
          nowMs={nowMs}
          disabled={isPending}
          onEdit={beginEdit}
          onMove={(task, status) =>
            runAction(
              () => transitionTask(task.id, status),
              transitionMessage(task, status),
            )
          }
          onArchive={(task) => {
            if (window.confirm(`Archive "${task.title}"?`)) {
              runAction(() => archiveTask(task.id), "Task archived.");
            }
          }}
        />
      )}
    </div>
  );
}

function KanbanBoard({
  tasks,
  timezone,
  nowMs,
  disabled,
  onEdit,
  onMove,
  onArchive,
}: TaskCollectionProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {taskStatuses.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status.value);
        return (
          <Card key={status.value} className="min-w-0 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{status.label}</h2>
              <StatusPill tone={status.tone}>{columnTasks.length}</StatusPill>
            </div>
            <div className="mt-4 grid gap-3">
              {columnTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs leading-5 text-muted-foreground">
                  No matching tasks
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    timezone={timezone}
                    nowMs={nowMs}
                    disabled={disabled}
                    onEdit={() => onEdit(task)}
                    onMove={(status) => onMove(task, status)}
                    onArchive={() => onArchive(task)}
                  />
                ))
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function TaskList({
  tasks,
  timezone,
  nowMs,
  disabled,
  onEdit,
  onMove,
  onArchive,
}: TaskCollectionProps) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
          <tr>
            <th className="px-5 py-4 font-medium">Task</th>
            <th className="px-5 py-4 font-medium">Category</th>
            <th className="px-5 py-4 font-medium">Priority</th>
            <th className="px-5 py-4 font-medium">Assignee</th>
            <th className="px-5 py-4 font-medium">Due</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="max-w-xs px-5 py-4">
                <p className="font-medium">{task.title}</p>
                {task.description && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {task.description}
                  </p>
                )}
              </td>
              <td className="px-5 py-4">{task.workCategoryName}</td>
              <td className="px-5 py-4 capitalize">{task.priority}</td>
              <td className="px-5 py-4">{task.assigneeName ?? "Unassigned"}</td>
              <td className="px-5 py-4">
                <DueLabel task={task} timezone={timezone} nowMs={nowMs} />
              </td>
              <td className="px-5 py-4">
                <TaskStatusSelect
                  task={task}
                  disabled={disabled}
                  onMove={(status) => onMove(task, status)}
                />
              </td>
              <td className="px-5 py-4">
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(task)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onArchive(task)}
                  >
                    Archive
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <p className="p-6 text-sm text-muted-foreground">
          No tasks match these filters.
        </p>
      )}
    </Card>
  );
}

function TaskCard({
  task,
  timezone,
  nowMs,
  disabled,
  onEdit,
  onMove,
  onArchive,
}: {
  task: TaskView;
  timezone: string;
  nowMs: number;
  disabled: boolean;
  onEdit: () => void;
  onMove: (status: TaskStatus) => void;
  onArchive: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <StatusPill
          tone={
            task.priority === "urgent" || task.priority === "high"
              ? "warning"
              : "neutral"
          }
        >
          {capitalize(task.priority)}
        </StatusPill>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Edit {task.title}</span>
          </button>
          <button
            type="button"
            onClick={onArchive}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Archive aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Archive {task.title}</span>
          </button>
        </div>
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-5">{task.title}</h3>
      {task.description && (
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
          {task.description}
        </p>
      )}
      <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
        <span>{task.workCategoryName}</span>
        <span>{task.assigneeName ?? "Unassigned"}</span>
        <DueLabel task={task} timezone={timezone} nowMs={nowMs} />
      </div>
      <div className="mt-3">
        <TaskStatusSelect task={task} disabled={disabled} onMove={onMove} />
      </div>
    </div>
  );
}

function DueLabel({
  task,
  timezone,
  nowMs,
}: {
  task: TaskView;
  timezone: string;
  nowMs: number;
}) {
  const dueState = getTaskDueState(task.dueAt, task.status, nowMs);
  const label = formatTaskDueDate(task.dueAt, timezone);
  if (!label) return <span>No due date</span>;
  return (
    <span
      className={
        dueState === "overdue"
          ? "font-medium text-danger"
          : dueState === "due_soon"
            ? "font-medium text-warning"
            : undefined
      }
    >
      {dueState === "overdue" ? "Overdue" : "Due"} {label}
    </span>
  );
}

function TaskStatusSelect({
  task,
  disabled,
  onMove,
}: {
  task: TaskView;
  disabled: boolean;
  onMove: (status: TaskStatus) => void;
}) {
  return (
    <select
      aria-label={`Status for ${task.title}`}
      className={`${fieldClass} min-h-9 w-full py-1 text-xs`}
      value={task.status}
      disabled={disabled}
      onChange={(event) => onMove(event.target.value as TaskStatus)}
    >
      {taskStatuses.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  );
}

function TaskForm({
  task,
  categories,
  members,
  disabled,
  onClose,
  onSubmit,
}: {
  task: TaskView | null;
  categories: TasksViewModel["categories"];
  members: TasksViewModel["members"];
  disabled: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description: string | null;
    workCategoryId: string;
    priority: TaskPriority;
    assigneeMemberId: string | null;
    dueAt: string | null;
  }) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [workCategoryId, setWorkCategoryId] = useState(
    task?.workCategoryId ?? categories[0]?.id ?? "",
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "normal",
  );
  const [assigneeMemberId, setAssigneeMemberId] = useState(
    task?.assigneeMemberId ?? "",
  );
  const [dueDate, setDueDate] = useState(task?.dueAt?.slice(0, 10) ?? "");

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {task ? "Edit task" : "Add task"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared task details can be revised by any active staff member.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X aria-hidden="true" />
          Close
        </Button>
      </div>
      {categories.length === 0 && (
        <p className="mt-5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Add a shared work category in the Focus Room before creating a task.
        </p>
      )}
      <form
        className="mt-5 grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            title,
            description: description.trim() || null,
            workCategoryId,
            priority,
            assigneeMemberId: assigneeMemberId || null,
            dueAt: dueDate ? `${dueDate}T12:00:00.000Z` : null,
          });
        }}
      >
        <label className="grid gap-2 text-sm font-medium">
          Title
          <input
            className={fieldClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Shared category
          <select
            className={fieldClass}
            value={workCategoryId}
            onChange={(event) => setWorkCategoryId(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium lg:col-span-2">
          Description (optional)
          <textarea
            className={`${fieldClass} min-h-24 py-3`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Priority
          <select
            className={fieldClass}
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as TaskPriority)
            }
          >
            {priorities.map((value) => (
              <option key={value} value={value}>
                {capitalize(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Assignee (optional)
          <select
            className={fieldClass}
            value={assigneeMemberId}
            onChange={(event) => setAssigneeMemberId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Due date (optional)
          <input
            className={fieldClass}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
        <div className="flex items-end">
          <Button
            disabled={disabled || !title.trim() || !workCategoryId}
            type="submit"
          >
            {task ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {task ? "Save task" : "Create task"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ViewButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button variant={active ? "secondary" : "ghost"} onClick={onClick}>
      {icon}
      {label}
    </Button>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium text-muted-foreground">
      {label}
      <select
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface TaskCollectionProps {
  tasks: TaskView[];
  timezone: string;
  nowMs: number;
  disabled: boolean;
  onEdit: (task: TaskView) => void;
  onMove: (task: TaskView, status: TaskStatus) => void;
  onArchive: (task: TaskView) => void;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

function transitionMessage(task: TaskView, status: TaskStatus) {
  if (status === "done") {
    return task.firstCompletedAt
      ? "Task completed. Studio XP was already awarded on its first completion."
      : "Task completed.";
  }
  return task.status === "done"
    ? "Task reopened. Previously earned Studio XP remains."
    : "Task moved.";
}
