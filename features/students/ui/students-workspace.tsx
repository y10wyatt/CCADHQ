"use client";

import Link from "next/link";
import { ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

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
  const [message, setMessage] = useState<{
    text: string;
    tone: "success" | "error";
  } | null>(null);

  function runAction(
    action: () => Promise<StudentActionResult>,
    successMessage: string,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage({
          text: result.error ?? "Unable to update Students.",
          tone: "error",
        });
        return;
      }
      setMessage({ text: successMessage, tone: "success" });
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
          <p
            aria-live="polite"
            className={
              message.tone === "error"
                ? "mt-5 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                : "mt-5 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
            }
          >
            {message.text}
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
          <button type="button" disabled={disabled} onClick={onEdit} className="grid size-11 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted">
            <Pencil className="size-4" aria-hidden="true" />
            <span className="sr-only">Edit {student.name}</span>
          </button>
          <button type="button" disabled={disabled} onClick={onArchive} className="grid size-11 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-danger active:bg-muted">
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
        <StatusPill tone={student.remainingClassCredits > 0 ? "info" : "warning"}>
          {student.remainingClassCredits} classes left
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
  const initialInput = student
    ? toFormInput(student)
    : createEmptyStudentInput();
  const [input, setInput] = useState<StudentFormInput>(initialInput);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const errors = getStudentFormErrors(input);
  const isDirty = JSON.stringify(input) !== JSON.stringify(initialInput);

  function requestClose() {
    if (
      isDirty &&
      !window.confirm("Discard the unsaved changes to this student record?")
    ) {
      return;
    }

    onClose();
  }

  return (
    <form
      className="mt-5 rounded-xl border border-border bg-background/70 p-4 sm:p-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitAttempted(true);
        if (Object.keys(errors).length > 0) {
          return;
        }
        onSubmit(input);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            {student ? "Edit student record" : "Create student record"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Start with basic information. Open other sections when those details
            are available.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span aria-hidden="true">*</span> Required field
          </p>
        </div>
        <button type="button" disabled={disabled} onClick={requestClose} className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close student form</span>
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        <FormSection
          title="Basic information"
          description="Identity and current enrollment state."
          defaultOpen
        >
          <TextField
            label="Student name"
            required
            value={input.name}
            error={
              touched.name || submitAttempted ? errors.name : undefined
            }
            onBlur={() =>
              setTouched((current) => ({ ...current, name: true }))
            }
            onChange={(name) =>
              setInput((current) => ({ ...current, name }))
            }
          />
          <TextField
            label="Grade/year"
            value={input.grade}
            onChange={(grade) =>
              setInput((current) => ({ ...current, grade }))
            }
          />
          <SelectField
            label="Program"
            value={input.program}
            options={studentPrograms}
            onChange={(program) =>
              setInput((current) => ({
                ...current,
                program: program as StudentFormInput["program"],
              }))
            }
          />
          <SelectField
            label="Status"
            value={input.status}
            options={studentStatuses}
            onChange={(status) =>
              setInput((current) => ({
                ...current,
                status: status as StudentFormInput["status"],
              }))
            }
          />
        </FormSection>

        <FormSection
          title="Learning plan"
          description="Direction for coaching, applications, and next actions."
        >
          <TextField
            label="Main goal"
            value={input.mainGoal}
            onChange={(mainGoal) =>
              setInput((current) => ({ ...current, mainGoal }))
            }
          />
          <TextField
            label="Current focus"
            value={input.currentFocus}
            onChange={(currentFocus) =>
              setInput((current) => ({ ...current, currentFocus }))
            }
          />
          <TextField
            label="Next action"
            value={input.nextAction}
            onChange={(nextAction) =>
              setInput((current) => ({ ...current, nextAction }))
            }
          />
          <TextArea
            label="Strengths"
            helperText="Add one strength per line."
            value={input.strengths}
            onChange={(strengths) =>
              setInput((current) => ({ ...current, strengths }))
            }
          />
          <TextArea
            label="Needs support"
            helperText="Add one support area per line."
            value={input.needsSupport}
            onChange={(needsSupport) =>
              setInput((current) => ({ ...current, needsSupport }))
            }
          />
          <TextArea
            label="Application targets"
            helperText="Add one school, program, or deadline per line."
            value={input.applicationTargets}
            onChange={(applicationTargets) =>
              setInput((current) => ({ ...current, applicationTargets }))
            }
          />
        </FormSection>

        <FormSection
          title="Class package"
          description="Prepaid class balance and internal package context."
        >
          <TextField
            label="Remaining prepaid classes"
            type="number"
            min={0}
            max={500}
            helperText="Attended and unexcused sessions reduce this balance automatically."
            value={String(input.remainingClassCredits)}
            error={
              touched.remainingClassCredits || submitAttempted
                ? errors.remainingClassCredits
                : undefined
            }
            onBlur={() =>
              setTouched((current) => ({
                ...current,
                remainingClassCredits: true,
              }))
            }
            onChange={(remainingClassCredits) =>
              setInput((current) => ({
                ...current,
                remainingClassCredits: Number(remainingClassCredits),
              }))
            }
          />
          <TextArea
            label="Payment/package notes"
            helperText="Internal staff context. Do not include payment card or banking details."
            value={input.paymentNotes}
            onChange={(paymentNotes) =>
              setInput((current) => ({ ...current, paymentNotes }))
            }
          />
        </FormSection>

        <FormSection
          title="Communication and consent"
          description="Follow-up state, posting permission, and family context."
        >
          <SelectField
            label="Permission to post"
            helperText="Record whether CCAD may publicly share this student's work."
            value={input.permissionToPost}
            options={permissionOptions}
            onChange={(permissionToPost) =>
              setInput((current) => ({
                ...current,
                permissionToPost:
                  permissionToPost as StudentFormInput["permissionToPost"],
              }))
            }
          />
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={input.followUpNeeded}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  followUpNeeded: event.target.checked,
                }))
              }
              className="size-5 rounded border-border accent-[var(--accent)]"
            />
            Follow-up needed
          </label>
          <TextArea
            label="Parent/contact notes"
            helperText="Internal context visible to authorized CCAD staff."
            value={input.parentNotes}
            onChange={(parentNotes) =>
              setInput((current) => ({ ...current, parentNotes }))
            }
          />
        </FormSection>

        <FormSection
          title="Additional notes"
          description="Optional internal context that does not fit elsewhere."
        >
          <TextArea
            label="General notes"
            value={input.notes}
            onChange={(notes) =>
              setInput((current) => ({ ...current, notes }))
            }
          />
        </FormSection>
      </div>

      {submitAttempted && Object.keys(errors).length > 0 && (
        <p role="alert" className="mt-4 text-sm font-medium text-danger">
          Review the highlighted fields before saving.
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" className="min-h-11" disabled={disabled} onClick={requestClose}>Cancel</Button>
        <Button type="submit" className="min-h-11" disabled={disabled}>
          {disabled
            ? "Saving..."
            : student
              ? "Save student"
              : "Create student"}
        </Button>
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
  remainingClassCredits: number;
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

function createEmptyStudentInput(): StudentFormInput {
  return {
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
    remainingClassCredits: 0,
  };
}

function getStudentFormErrors(input: StudentFormInput) {
  const errors: Partial<Record<keyof StudentFormInput, string>> = {};

  if (!input.name.trim()) {
    errors.name = "Enter the student's name.";
  }

  if (
    !Number.isInteger(input.remainingClassCredits) ||
    input.remainingClassCredits < 0 ||
    input.remainingClassCredits > 500
  ) {
    errors.remainingClassCredits =
      "Enter a whole number between 0 and 500.";
  }

  return errors;
}

function FormSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <fieldset className="rounded-lg border border-border bg-card">
      <legend className="sr-only">{title}</legend>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/60 active:bg-muted"
      >
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
            {description}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id={contentId}
          className="grid gap-4 border-t border-border p-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {children}
        </div>
      )}
    </fieldset>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 leading-6">{value || "Not set"}</dd>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  required = false,
  min,
  max,
  helperText,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  helperText?: string;
  error?: string;
}) {
  const inputId = useId();
  const descriptionId = `${inputId}-description`;

  return (
    <div className="grid content-start gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
        {required && (
          <span aria-label="required" className="ml-1 text-danger">
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        type={type}
        min={min}
        max={max}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={helperText || error ? descriptionId : undefined}
        className={`${fieldClass} ${error ? "border-danger" : ""}`}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
      {(error || helperText) && (
        <p
          id={descriptionId}
          className={`text-xs leading-5 ${error ? "text-danger" : "text-muted-foreground"}`}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}) {
  const inputId = useId();

  return (
    <div className="grid content-start gap-2 md:col-span-2 xl:col-span-3">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={inputId}
        className={`${fieldClass} min-h-24 py-3`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helperText && (
        <p className="text-xs leading-5 text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  helperText,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  helperText?: string;
}) {
  const inputId = useId();

  return (
    <div className="grid content-start gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <select id={inputId} className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {helperText && (
        <p className="text-xs leading-5 text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
