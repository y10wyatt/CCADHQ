"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  archiveStudent,
  createStudent,
  updateStudent,
  type StudentActionResult,
} from "@/features/students/application/actions";
import {
  permissionOptions,
  studentPrograms,
  studentStatuses,
  type StudentView,
} from "@/features/students/domain/students";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function StudentsWorkspace({ students }: { students: StudentView[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentView | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function runAction(
    action: () => Promise<StudentActionResult>,
    successMessage: string,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update Students.");
        return;
      }
      setMessage(successMessage);
      setFormOpen(false);
      setEditingStudent(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Current students</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a record once a student needs ongoing follow-up.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingStudent(null);
              setFormOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            Add student
          </Button>
        </div>
        {message && (
          <p className="mt-5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            {message}
          </p>
        )}
        {formOpen && (
          <StudentForm
            student={editingStudent}
            disabled={isPending}
            onClose={() => {
              setFormOpen(false);
              setEditingStudent(null);
            }}
            onSubmit={(input) =>
              runAction(
                () =>
                  editingStudent
                    ? updateStudent({ studentId: editingStudent.id, ...input })
                    : createStudent(input),
                editingStudent ? "Student updated." : "Student added.",
              )
            }
          />
        )}
      </Card>

      {students.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            No students yet. Add the first student record to start tracking class
            progress and follow-ups.
          </p>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              disabled={isPending}
              onEdit={() => {
                setEditingStudent(student);
                setFormOpen(true);
              }}
              onArchive={() =>
                runAction(() => archiveStudent(student.id), "Student archived.")
              }
            />
          ))}
        </section>
      )}
    </div>
  );
}

function StudentCard({
  student,
  disabled,
  onEdit,
  onArchive,
}: {
  student: StudentView;
  disabled: boolean;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/students/${student.id}`} className="text-lg font-semibold hover:text-accent">
            {student.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{student.grade}</p>
        </div>
        <div className="flex gap-1">
          <button type="button" disabled={disabled} onClick={onEdit} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <Pencil className="size-4" aria-hidden="true" />
            <span className="sr-only">Edit {student.name}</span>
          </button>
          <button type="button" disabled={disabled} onClick={onArchive} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-danger">
            <Trash2 className="size-4" aria-hidden="true" />
            <span className="sr-only">Archive {student.name}</span>
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill tone="info">{student.program}</StatusPill>
        <StatusPill tone={student.status === "Active" ? "success" : "neutral"}>{student.status}</StatusPill>
        <StatusPill tone={student.followUpNeeded ? "warning" : "neutral"}>
          {student.followUpNeeded ? "Follow-up" : "No follow-up"}
        </StatusPill>
        <StatusPill tone={student.permissionToPost === "Yes" ? "success" : student.permissionToPost === "Pending" ? "warning" : "neutral"}>
          Post: {student.permissionToPost}
        </StatusPill>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <Info label="Goal" value={student.mainGoal} />
        <Info label="Focus" value={student.currentFocus} />
        <Info label="Next action" value={student.nextAction} />
        <Info label="Next class" value={student.nextClassDate ?? "Not scheduled"} />
        <Info label="Last class" value={student.lastClassDate ?? "No class yet"} />
      </dl>
      {student.notes && (
        <p className="mt-4 border-t border-border pt-3 text-sm leading-6 text-muted-foreground">
          {student.notes}
        </p>
      )}
    </Card>
  );
}

export function StudentForm({
  student,
  disabled,
  onClose,
  onSubmit,
}: {
  student: StudentView | null;
  disabled: boolean;
  onClose: () => void;
  onSubmit: (input: StudentFormInput) => void;
}) {
  const [input, setInput] = useState<StudentFormInput>(
    student
      ? toFormInput(student)
      : {
          name: "",
          grade: "",
          program: "Portfolio",
          status: "Active",
          mainGoal: "",
          currentFocus: "",
          nextAction: "",
          nextClassDate: "",
          lastClassDate: "",
          followUpNeeded: false,
          permissionToPost: "Pending",
          notes: "",
          strengths: "",
          needsSupport: "",
          applicationTargets: "",
          parentNotes: "",
          paymentNotes: "",
        },
  );

  return (
    <form
      className="mt-5 rounded-lg border border-border bg-background/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(input);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold">
          {student ? "Edit student" : "New student"}
        </h3>
        <button type="button" disabled={disabled} onClick={onClose} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close student form</span>
        </button>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <TextField label="Name" value={input.name} onChange={(name) => setInput((current) => ({ ...current, name }))} />
        <TextField label="Grade/year" value={input.grade} onChange={(grade) => setInput((current) => ({ ...current, grade }))} />
        <SelectField label="Program" value={input.program} options={studentPrograms} onChange={(program) => setInput((current) => ({ ...current, program: program as StudentFormInput["program"] }))} />
        <SelectField label="Status" value={input.status} options={studentStatuses} onChange={(status) => setInput((current) => ({ ...current, status: status as StudentFormInput["status"] }))} />
        <SelectField label="Permission to post" value={input.permissionToPost} options={permissionOptions} onChange={(permissionToPost) => setInput((current) => ({ ...current, permissionToPost: permissionToPost as StudentFormInput["permissionToPost"] }))} />
        <TextField label="Next class" type="date" value={input.nextClassDate ?? ""} onChange={(nextClassDate) => setInput((current) => ({ ...current, nextClassDate }))} />
        <TextField label="Last class" type="date" value={input.lastClassDate ?? ""} onChange={(lastClassDate) => setInput((current) => ({ ...current, lastClassDate }))} />
        <TextField label="Main goal" value={input.mainGoal} onChange={(mainGoal) => setInput((current) => ({ ...current, mainGoal }))} />
        <TextField label="Current focus" value={input.currentFocus} onChange={(currentFocus) => setInput((current) => ({ ...current, currentFocus }))} />
        <TextField label="Next action" value={input.nextAction} onChange={(nextAction) => setInput((current) => ({ ...current, nextAction }))} />
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <input type="checkbox" checked={input.followUpNeeded} onChange={(event) => setInput((current) => ({ ...current, followUpNeeded: event.target.checked }))} className="size-4 rounded border-border accent-[var(--accent)]" />
          Follow-up needed
        </label>
        <TextArea label="Notes" value={input.notes} onChange={(notes) => setInput((current) => ({ ...current, notes }))} />
        <TextArea label="Strengths (one per line)" value={input.strengths} onChange={(strengths) => setInput((current) => ({ ...current, strengths }))} />
        <TextArea label="Needs support (one per line)" value={input.needsSupport} onChange={(needsSupport) => setInput((current) => ({ ...current, needsSupport }))} />
        <TextArea label="Application targets (one per line)" value={input.applicationTargets} onChange={(applicationTargets) => setInput((current) => ({ ...current, applicationTargets }))} />
        <TextArea label="Parent/contact notes" value={input.parentNotes} onChange={(parentNotes) => setInput((current) => ({ ...current, parentNotes }))} />
        <TextArea label="Payment/package notes" value={input.paymentNotes} onChange={(paymentNotes) => setInput((current) => ({ ...current, paymentNotes }))} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={disabled} onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={disabled || !input.name.trim()}>{student ? "Save student" : "Create student"}</Button>
      </div>
    </form>
  );
}

export interface StudentFormInput {
  name: string;
  grade: string;
  program: StudentView["program"];
  status: StudentView["status"];
  mainGoal: string;
  currentFocus: string;
  nextAction: string;
  nextClassDate?: string | null;
  lastClassDate?: string | null;
  followUpNeeded: boolean;
  permissionToPost: StudentView["permissionToPost"];
  notes: string;
  strengths: string;
  needsSupport: string;
  applicationTargets: string;
  parentNotes: string;
  paymentNotes: string;
}

function toFormInput(student: StudentView): StudentFormInput {
  return {
    ...student,
    nextClassDate: student.nextClassDate ?? "",
    lastClassDate: student.lastClassDate ?? "",
    strengths: student.strengths.join("\n"),
    needsSupport: student.needsSupport.join("\n"),
    applicationTargets: student.applicationTargets.join("\n"),
  };
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 leading-6">{value || "Not set"}</dd>
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
    <label className="grid gap-2 text-sm font-medium lg:col-span-3">
      {label}
      <textarea className={`${fieldClass} min-h-24 py-3`} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
