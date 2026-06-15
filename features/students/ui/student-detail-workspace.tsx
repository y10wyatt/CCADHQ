"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createClassLog,
  deleteClassLog,
  updateClassLog,
  type StudentActionResult,
} from "@/features/students/application/actions";
import {
  classLogTeachers,
  type ClassLogView,
  type StudentView,
} from "@/features/students/domain/students";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function StudentDetailWorkspace({
  student,
  classLogs,
}: {
  student: StudentView;
  classLogs: ClassLogView[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ClassLogView | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function runAction(
    action: () => Promise<StudentActionResult>,
    successMessage: string,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update class logs.");
        return;
      }
      setMessage(successMessage);
      setFormOpen(false);
      setEditingLog(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="info">{student.program}</StatusPill>
          <StatusPill tone={student.followUpNeeded ? "warning" : "neutral"}>
            {student.followUpNeeded ? "Follow-up needed" : "No follow-up"}
          </StatusPill>
          <StatusPill tone={student.permissionToPost === "Yes" ? "success" : "warning"}>
            Post permission: {student.permissionToPost}
          </StatusPill>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Info label="Main goal" value={student.mainGoal} />
          <Info label="Current focus" value={student.currentFocus} />
          <Info label="Next action" value={student.nextAction} />
          <Info label="Class schedule" value={`Next: ${student.nextClassDate ?? "Not set"} | Last: ${student.lastClassDate ?? "None"}`} />
          <Info label="Parent/contact notes" value={student.parentNotes} />
          <Info label="Payment/package notes" value={student.paymentNotes} />
          <Info label="Application targets" value={student.applicationTargets.join(", ") || "Not set"} />
          <Info label="Portfolio status" value={student.notes || "Not set"} />
          <Info label="Strengths" value={student.strengths.join(", ") || "Not set"} />
          <Info label="Needs support" value={student.needsSupport.join(", ") || "Not set"} />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Class logs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Newest entries appear first.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingLog(null);
              setFormOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            Add class log
          </Button>
        </div>
        {message && (
          <p className="mt-5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            {message}
          </p>
        )}
        {formOpen && (
          <ClassLogForm
            studentId={student.id}
            log={editingLog}
            disabled={isPending}
            onClose={() => {
              setFormOpen(false);
              setEditingLog(null);
            }}
            onSubmit={(input) =>
              runAction(
                () =>
                  editingLog
                    ? updateClassLog({ logId: editingLog.id, ...input })
                    : createClassLog(input),
                editingLog ? "Class log updated." : "Class log added.",
              )
            }
          />
        )}
        <div className="mt-5 grid gap-3">
          {classLogs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No class logs yet. Add the first class note after a session.
            </p>
          ) : (
            classLogs.map((log) => (
              <ClassLogEntryCard
                key={log.id}
                log={log}
                disabled={isPending}
                onEdit={() => {
                  setEditingLog(log);
                  setFormOpen(true);
                }}
                onDelete={() =>
                  runAction(() => deleteClassLog(log.id), "Class log deleted.")
                }
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function ClassLogEntryCard({
  log,
  disabled,
  onEdit,
  onDelete,
}: {
  log: ClassLogView;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-lg border border-border bg-background/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{log.date}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {log.teacher} | {log.duration || "Duration not set"}
          </p>
        </div>
        <div className="flex gap-1">
          <button type="button" disabled={disabled} onClick={onEdit} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <Pencil className="size-4" aria-hidden="true" />
            <span className="sr-only">Edit class log</span>
          </button>
          <button type="button" disabled={disabled} onClick={onDelete} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-danger">
            <Trash2 className="size-4" aria-hidden="true" />
            <span className="sr-only">Delete class log</span>
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Info label="Worked on" value={log.workedOn} />
        <Info label="Feedback" value={log.feedbackGiven} />
        <Info label="Homework" value={log.homeworkAssigned} />
        <Info label="Materials/photos" value={log.materialsNeeded || "None"} />
        <Info label="Next class focus" value={log.nextClassFocus} />
        <Info label="Parent update" value={log.parentUpdateSent ? "Sent" : "Not sent"} />
      </div>
    </article>
  );
}

function ClassLogForm({
  studentId,
  log,
  disabled,
  onClose,
  onSubmit,
}: {
  studentId: string;
  log: ClassLogView | null;
  disabled: boolean;
  onClose: () => void;
  onSubmit: (input: ClassLogInput) => void;
}) {
  const [input, setInput] = useState<ClassLogInput>(
    log
      ? {
          studentId,
          date: log.date,
          teacher: log.teacher,
          duration: log.duration,
          workedOn: log.workedOn,
          feedbackGiven: log.feedbackGiven,
          homeworkAssigned: log.homeworkAssigned,
          materialsNeeded: log.materialsNeeded,
          parentUpdateSent: log.parentUpdateSent,
          nextClassFocus: log.nextClassFocus,
          imageUrl: log.imageUrl ?? "",
        }
      : {
          studentId,
          date: new Date().toISOString().slice(0, 10),
          teacher: "William",
          duration: "",
          workedOn: "",
          feedbackGiven: "",
          homeworkAssigned: "",
          materialsNeeded: "",
          parentUpdateSent: false,
          nextClassFocus: "",
          imageUrl: "",
        },
  );

  return (
    <form
      className="mt-5 rounded-lg border border-border bg-card/80 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(input);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold">
          {log ? "Edit class log" : "New class log"}
        </h3>
        <button type="button" disabled={disabled} onClick={onClose} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close class log form</span>
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextField label="Date" type="date" value={input.date} onChange={(date) => setInput((current) => ({ ...current, date }))} />
        <label className="grid gap-2 text-sm font-medium">
          Teacher
          <select className={fieldClass} value={input.teacher} onChange={(event) => setInput((current) => ({ ...current, teacher: event.target.value as ClassLogView["teacher"] }))}>
            {classLogTeachers.map((teacher) => <option key={teacher} value={teacher}>{teacher}</option>)}
          </select>
        </label>
        <TextField label="Duration" value={input.duration} onChange={(duration) => setInput((current) => ({ ...current, duration }))} />
        <TextField label="Image/photo URL placeholder" value={input.imageUrl ?? ""} onChange={(imageUrl) => setInput((current) => ({ ...current, imageUrl }))} />
        <TextArea label="What we worked on" value={input.workedOn} onChange={(workedOn) => setInput((current) => ({ ...current, workedOn }))} />
        <TextArea label="Feedback given" value={input.feedbackGiven} onChange={(feedbackGiven) => setInput((current) => ({ ...current, feedbackGiven }))} />
        <TextArea label="Homework assigned" value={input.homeworkAssigned} onChange={(homeworkAssigned) => setInput((current) => ({ ...current, homeworkAssigned }))} />
        <TextArea label="Materials/photos needed" value={input.materialsNeeded} onChange={(materialsNeeded) => setInput((current) => ({ ...current, materialsNeeded }))} />
        <TextArea label="Next class focus" value={input.nextClassFocus} onChange={(nextClassFocus) => setInput((current) => ({ ...current, nextClassFocus }))} />
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <input type="checkbox" checked={input.parentUpdateSent} onChange={(event) => setInput((current) => ({ ...current, parentUpdateSent: event.target.checked }))} className="size-4 rounded border-border accent-[var(--accent)]" />
          Parent update sent
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={disabled} onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={disabled || !input.workedOn.trim()}>{log ? "Save log" : "Create log"}</Button>
      </div>
    </form>
  );
}

interface ClassLogInput {
  studentId: string;
  date: string;
  teacher: ClassLogView["teacher"];
  duration: string;
  workedOn: string;
  feedbackGiven: string;
  homeworkAssigned: string;
  materialsNeeded: string;
  parentUpdateSent: boolean;
  nextClassFocus: string;
  imageUrl?: string | null;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm leading-6">{value || "Not set"}</dd>
    </div>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input type={type} className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium md:col-span-2">
      {label}
      <textarea className={`${fieldClass} min-h-24 py-3`} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
