"use client";

import {
  CalendarPlus,
  Check,
  ClipboardCheck,
  FileText,
  Play,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  completeClassSummary,
  createClassSession,
  markSessionReported,
  startClassSession,
  updatePrepareClass,
  updateSessionAttendance,
  updateStudentActionItemStatus,
  type StudentActionResult,
} from "@/features/students/application/actions";
import {
  attendanceStatuses,
  type AttendanceStatus,
  type ClassLogView,
  type ClassSessionView,
  type StudentActionItemView,
  type StudentSessionContext,
  type StudentView,
} from "@/features/students/domain/students";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

type ActivePanel = "prepare" | "teaching" | "summary" | "plan" | null;
type SummaryAttendanceStatus = Exclude<AttendanceStatus, "pending">;

export function StudentDetailWorkspace({
  detail,
}: {
  detail: StudentSessionContext;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [message, setMessage] = useState<string | null>(null);
  const {
    student,
    upcomingSession,
    previousCompletedSession,
    openStudentActionItems,
    openTeacherActionItems,
    sessions,
    classLogs,
  } = detail;

  function runAction(
    action: () => Promise<StudentActionResult>,
    successMessage: string,
    closePanel = true,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update this student.");
        return;
      }
      setMessage(successMessage);
      if (closePanel) setActivePanel(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      <UpcomingClassCard
        student={student}
        session={upcomingSession}
        onPrepare={() => setActivePanel("prepare")}
        onStart={() => {
          if (!upcomingSession) return;
          runAction(
            () => startClassSession(upcomingSession.id),
            "Class started.",
            false,
          );
          setActivePanel("teaching");
        }}
        onAbsence={() => setActivePanel("teaching")}
        onSummary={() => setActivePanel("summary")}
        onPlan={() => setActivePanel("plan")}
        disabled={isPending}
      />

      {message && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {message}
        </p>
      )}

      {activePanel === "plan" && (
        <PlanNextClassPanel
          student={student}
          previousSession={previousCompletedSession}
          disabled={isPending}
          onCancel={() => setActivePanel(null)}
          onSubmit={(input) =>
            runAction(
              () => createClassSession(input),
              "Next class planned.",
            )
          }
        />
      )}

      {activePanel === "prepare" && upcomingSession && (
        <PrepareClassPanel
          session={upcomingSession}
          previousSession={previousCompletedSession}
          studentItems={openStudentActionItems}
          teacherItems={openTeacherActionItems}
          disabled={isPending}
          onCancel={() => setActivePanel(null)}
          onSubmit={(input) =>
            runAction(
              () => updatePrepareClass({ sessionId: upcomingSession.id, ...input }),
              "Class preparation saved.",
            )
          }
        />
      )}

      {activePanel === "teaching" && upcomingSession && (
        <TeachingPanel
          session={upcomingSession}
          previousSession={previousCompletedSession}
          studentItems={openStudentActionItems}
          teacherItems={openTeacherActionItems}
          disabled={isPending}
          onCancel={() => setActivePanel(null)}
          onAttendance={(attendanceStatus) =>
            runAction(
              () =>
                updateSessionAttendance({
                  sessionId: upcomingSession.id,
                  attendanceStatus,
                }),
              "Attendance updated.",
              false,
            )
          }
        />
      )}

      {activePanel === "summary" && upcomingSession && (
        <CompleteSummaryPanel
          session={upcomingSession}
          disabled={isPending}
          onCancel={() => setActivePanel(null)}
          onSubmit={(input) =>
            runAction(
              () => completeClassSummary({ sessionId: upcomingSession.id, ...input }),
              "Class summary completed.",
            )
          }
        />
      )}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <ClassTimeline
          sessions={sessions}
          disabled={isPending}
          onReport={(sessionId) =>
            runAction(
              () => markSessionReported(sessionId),
              "Session marked reported.",
            )
          }
        />
        <div className="grid gap-5">
          <ActionItemsList
            title="Student action items"
            items={openStudentActionItems}
            disabled={isPending}
            onStatus={(actionItemId, status) =>
              runAction(
                () => updateStudentActionItemStatus({ actionItemId, status }),
                "Action item updated.",
                false,
              )
            }
          />
          <ActionItemsList
            title="Teacher action items"
            items={openTeacherActionItems}
            disabled={isPending}
            onStatus={(actionItemId, status) =>
              runAction(
                () => updateStudentActionItemStatus({ actionItemId, status }),
                "Action item updated.",
                false,
              )
            }
          />
          <StudentProfileCard student={student} />
        </div>
      </div>

      <LegacyClassLogs logs={classLogs} />
    </div>
  );
}

function UpcomingClassCard({
  student,
  session,
  onPrepare,
  onStart,
  onAbsence,
  onSummary,
  onPlan,
  disabled,
}: {
  student: StudentView;
  session: ClassSessionView | null;
  onPrepare: () => void;
  onStart: () => void;
  onAbsence: () => void;
  onSummary: () => void;
  onPlan: () => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Upcoming class
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{student.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {student.program} | {student.remainingClassCredits} classes remaining
          </p>
        </div>
        <StatusPill tone={session ? statusTone(session.status) : "warning"}>
          {session ? formatStatus(session.status) : "Needs scheduling"}
        </StatusPill>
      </div>

      {session ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Next class" value={formatDateTime(session.scheduledStart)} />
            <Info label="Lesson goal" value={session.lessonGoal} />
            <Info label="Attendance" value={formatStatus(session.attendanceStatus)} />
            <Info label="Materials" value={session.materialsNeeded || "None listed"} />
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-72 lg:justify-end">
            <Button onClick={onPrepare} disabled={disabled} variant="secondary">
              <FileText aria-hidden="true" />
              Prepare Class
            </Button>
            <Button onClick={onStart} disabled={disabled || session.status !== "planned"}>
              <Play aria-hidden="true" />
              Start Class
            </Button>
            <Button onClick={onAbsence} disabled={disabled} variant="secondary">
              <X aria-hidden="true" />
              Mark Absence
            </Button>
            <Button onClick={onSummary} disabled={disabled} variant="secondary">
              <ClipboardCheck aria-hidden="true" />
              Complete Summary
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dashed border-border p-4">
          <p className="text-sm text-muted-foreground">
            No upcoming class session exists yet.
          </p>
          <Button onClick={onPlan} disabled={disabled}>
            <CalendarPlus aria-hidden="true" />
            Plan Next Class
          </Button>
        </div>
      )}
    </Card>
  );
}

function PlanNextClassPanel({
  student,
  previousSession,
  disabled,
  onCancel,
  onSubmit,
}: {
  student: StudentView;
  previousSession: ClassSessionView | null;
  disabled: boolean;
  onCancel: () => void;
  onSubmit: (input: PlanNextClassInput) => void;
}) {
  const defaultStart = toDatetimeLocal(student.nextClassDate);
  const [input, setInput] = useState<PlanNextClassInput>({
    studentId: student.id,
    scheduledStart: defaultStart,
    scheduledEnd: defaultStart ? addMinutesForDatetimeLocal(defaultStart, 90) : "",
    lessonGoal: previousSession?.nextClassRecommendation ?? "",
    planNotes: "",
    materialsNeeded: "",
    teacherPrivateNotes: "",
  });

  return (
    <Card>
      <PanelHeader title="Plan next class" onCancel={onCancel} disabled={disabled} />
      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(input);
        }}
      >
        <TextField
          label="Start"
          type="datetime-local"
          value={input.scheduledStart}
          onChange={(scheduledStart) =>
            setInput((current) => ({ ...current, scheduledStart }))
          }
        />
        <TextField
          label="End"
          type="datetime-local"
          value={input.scheduledEnd}
          onChange={(scheduledEnd) =>
            setInput((current) => ({ ...current, scheduledEnd }))
          }
        />
        <TextField
          label="Lesson goal"
          value={input.lessonGoal}
          onChange={(lessonGoal) =>
            setInput((current) => ({ ...current, lessonGoal }))
          }
        />
        <TextField
          label="Materials needed"
          value={input.materialsNeeded}
          onChange={(materialsNeeded) =>
            setInput((current) => ({ ...current, materialsNeeded }))
          }
        />
        <TextArea
          label="Planned activities"
          value={input.planNotes}
          onChange={(planNotes) =>
            setInput((current) => ({ ...current, planNotes }))
          }
        />
        <TextArea
          label="Private teacher notes"
          value={input.teacherPrivateNotes}
          onChange={(teacherPrivateNotes) =>
            setInput((current) => ({ ...current, teacherPrivateNotes }))
          }
        />
        <FormActions disabled={disabled || !input.scheduledStart || !input.scheduledEnd} />
      </form>
    </Card>
  );
}

function PrepareClassPanel({
  session,
  previousSession,
  studentItems,
  teacherItems,
  disabled,
  onCancel,
  onSubmit,
}: {
  session: ClassSessionView;
  previousSession: ClassSessionView | null;
  studentItems: StudentActionItemView[];
  teacherItems: StudentActionItemView[];
  disabled: boolean;
  onCancel: () => void;
  onSubmit: (input: PrepareClassInput) => void;
}) {
  const [input, setInput] = useState<PrepareClassInput>({
    lessonGoal: session.lessonGoal,
    planNotes: session.planNotes,
    materialsNeeded: session.materialsNeeded,
    teacherPrivateNotes: session.teacherPrivateNotes,
  });

  return (
    <Card>
      <PanelHeader title="Prepare class" onCancel={onCancel} disabled={disabled} />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ContextPanel
          previousSession={previousSession}
          studentItems={studentItems}
          teacherItems={teacherItems}
        />
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(input);
          }}
        >
          <TextField
            label="Today's lesson goal"
            value={input.lessonGoal}
            onChange={(lessonGoal) =>
              setInput((current) => ({ ...current, lessonGoal }))
            }
          />
          <TextArea
            label="Planned activities"
            value={input.planNotes}
            onChange={(planNotes) =>
              setInput((current) => ({ ...current, planNotes }))
            }
          />
          <TextField
            label="Materials needed"
            value={input.materialsNeeded}
            onChange={(materialsNeeded) =>
              setInput((current) => ({ ...current, materialsNeeded }))
            }
          />
          <TextArea
            label="Private teacher notes"
            value={input.teacherPrivateNotes}
            onChange={(teacherPrivateNotes) =>
              setInput((current) => ({ ...current, teacherPrivateNotes }))
            }
          />
          <FormActions disabled={disabled} />
        </form>
      </div>
    </Card>
  );
}

function TeachingPanel({
  session,
  previousSession,
  studentItems,
  teacherItems,
  disabled,
  onCancel,
  onAttendance,
}: {
  session: ClassSessionView;
  previousSession: ClassSessionView | null;
  studentItems: StudentActionItemView[];
  teacherItems: StudentActionItemView[];
  disabled: boolean;
  onCancel: () => void;
  onAttendance: (attendanceStatus: SummaryAttendanceStatus) => void;
}) {
  return (
    <Card>
      <PanelHeader title="Teaching mode" onCancel={onCancel} disabled={disabled} />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-3">
          <Info label="Today" value={formatDateTime(session.scheduledStart)} />
          <Info label="Lesson goal" value={session.lessonGoal} />
          <Info label="Planned activities" value={session.planNotes} />
          <Info
            label="Homework to review"
            value={previousSession?.homeworkAssigned || "No homework recorded"}
          />
          <Info
            label="Key reminders"
            value={[
              session.teacherPrivateNotes,
              ...studentItems.map((item) => item.title),
              ...teacherItems.map((item) => item.title),
            ]
              .filter(Boolean)
              .join(" | ")}
          />
        </div>
        <AttendanceSelector
          value={session.attendanceStatus}
          disabled={disabled}
          onChange={onAttendance}
        />
      </div>
    </Card>
  );
}

function CompleteSummaryPanel({
  session,
  disabled,
  onCancel,
  onSubmit,
}: {
  session: ClassSessionView;
  disabled: boolean;
  onCancel: () => void;
  onSubmit: (input: CompleteSummaryInput) => void;
}) {
  const [input, setInput] = useState<CompleteSummaryInput>({
    attendanceStatus:
      getSummaryAttendanceStatus(session.attendanceStatus),
    actualSummary: session.actualSummary,
    studentProgress: session.studentProgress,
    homeworkAssigned: session.homeworkAssigned,
    noHomework: session.noHomework,
    parentFacingSummary: session.parentFacingSummary,
    internalTeacherNotes: session.internalTeacherNotes,
    nextClassRecommendation: session.nextClassRecommendation,
    progressTags: session.progressTags.join(", "),
    studentActionItems: "",
    teacherActionItems: "",
  });
  const canSubmit =
    input.actualSummary.trim().length > 0 &&
    (input.noHomework || input.homeworkAssigned.trim().length > 0) &&
    input.nextClassRecommendation.trim().length > 0;

  return (
    <Card>
      <PanelHeader title="Complete summary" onCancel={onCancel} disabled={disabled} />
      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(input);
        }}
      >
        <label className="grid gap-2 text-sm font-medium">
          Attendance
          <select
            className={fieldClass}
            value={input.attendanceStatus}
            onChange={(event) =>
              setInput((current) => ({
                ...current,
                attendanceStatus: event.target.value as SummaryAttendanceStatus,
              }))
            }
          >
            {attendanceStatuses
              .filter((status) => status !== "pending")
              .map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
          </select>
        </label>
        <TextField
          label="Progress tags"
          value={input.progressTags}
          onChange={(progressTags) =>
            setInput((current) => ({ ...current, progressTags }))
          }
        />
        <TextArea
          label="Actual summary"
          value={input.actualSummary}
          onChange={(actualSummary) =>
            setInput((current) => ({ ...current, actualSummary }))
          }
        />
        <TextArea
          label="Student progress"
          value={input.studentProgress}
          onChange={(studentProgress) =>
            setInput((current) => ({ ...current, studentProgress }))
          }
        />
        <TextArea
          label="Homework assigned"
          value={input.homeworkAssigned}
          onChange={(homeworkAssigned) =>
            setInput((current) => ({ ...current, homeworkAssigned }))
          }
        />
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground md:col-span-2">
          <input
            type="checkbox"
            checked={input.noHomework}
            onChange={(event) =>
              setInput((current) => ({
                ...current,
                noHomework: event.target.checked,
              }))
            }
            className="size-4 rounded border-border accent-[var(--accent)]"
          />
          No homework assigned
        </label>
        <TextArea
          label="Student action items"
          value={input.studentActionItems}
          onChange={(studentActionItems) =>
            setInput((current) => ({ ...current, studentActionItems }))
          }
        />
        <TextArea
          label="Teacher action items"
          value={input.teacherActionItems}
          onChange={(teacherActionItems) =>
            setInput((current) => ({ ...current, teacherActionItems }))
          }
        />
        <TextArea
          label="Parent-facing summary"
          value={input.parentFacingSummary}
          onChange={(parentFacingSummary) =>
            setInput((current) => ({ ...current, parentFacingSummary }))
          }
        />
        <TextArea
          label="Internal teacher notes"
          value={input.internalTeacherNotes}
          onChange={(internalTeacherNotes) =>
            setInput((current) => ({ ...current, internalTeacherNotes }))
          }
        />
        <TextArea
          label="Next class recommendation"
          value={input.nextClassRecommendation}
          onChange={(nextClassRecommendation) =>
            setInput((current) => ({ ...current, nextClassRecommendation }))
          }
        />
        <FormActions disabled={disabled || !canSubmit} label="Complete summary" />
      </form>
    </Card>
  );
}

function ContextPanel({
  previousSession,
  studentItems,
  teacherItems,
}: {
  previousSession: ClassSessionView | null;
  studentItems: StudentActionItemView[];
  teacherItems: StudentActionItemView[];
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background/70 p-4">
      <Info
        label="Previous summary"
        value={previousSession?.actualSummary || "No completed class yet"}
      />
      <Info
        label="Previous homework"
        value={previousSession?.homeworkAssigned || "No homework recorded"}
      />
      <Info
        label="Next recommendation"
        value={previousSession?.nextClassRecommendation || "No recommendation yet"}
      />
      <Info
        label="Open student items"
        value={studentItems.map((item) => item.title).join(" | ")}
      />
      <Info
        label="Open teacher items"
        value={teacherItems.map((item) => item.title).join(" | ")}
      />
    </div>
  );
}

function AttendanceSelector({
  value,
  disabled,
  onChange,
}: {
  value: AttendanceStatus;
  disabled: boolean;
  onChange: (attendanceStatus: SummaryAttendanceStatus) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/70 p-4">
      <h3 className="text-sm font-semibold">Attendance confirmation</h3>
      <div className="mt-3 grid gap-2">
        {attendanceStatuses
          .filter((status) => status !== "pending")
          .map((status) => (
            <Button
              key={status}
              type="button"
              variant={value === status ? "primary" : "secondary"}
              disabled={disabled}
              onClick={() => onChange(status as SummaryAttendanceStatus)}
              className="justify-start"
            >
              {value === status && <Check aria-hidden="true" />}
              {formatStatus(status)}
            </Button>
          ))}
      </div>
    </div>
  );
}

function ClassTimeline({
  sessions,
  disabled,
  onReport,
}: {
  sessions: ClassSessionView[];
  disabled: boolean;
  onReport: (sessionId: string) => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Classes / Reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Chronological session history.
          </p>
        </div>
        <StatusPill tone="info">{sessions.length} sessions</StatusPill>
      </div>
      <div className="mt-5 grid gap-3">
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No class sessions yet. Plan the next class to start the workflow.
          </p>
        ) : (
          sessions.map((session) => (
            <article
              key={session.id}
              className="rounded-lg border border-border bg-background/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {formatDateTime(session.scheduledStart)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {session.lessonGoal || "No lesson goal set"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={statusTone(session.status)}>
                    {formatStatus(session.status)}
                  </StatusPill>
                  <StatusPill tone="neutral">
                    {formatStatus(session.attendanceStatus)}
                  </StatusPill>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Info label="Summary" value={session.actualSummary} />
                <Info
                  label="Homework"
                  value={session.noHomework ? "No homework" : session.homeworkAssigned}
                />
                <Info
                  label="Action items"
                  value={session.nextClassRecommendation}
                />
                <Info
                  label="Parent summary"
                  value={
                    session.parentReportSentAt
                      ? `Sent ${formatDateTime(session.parentReportSentAt)}`
                      : session.parentFacingSummary
                        ? "Ready"
                        : "Not ready"
                  }
                />
              </div>
              {session.status === "completed" && (
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => onReport(session.id)}
                  >
                    Mark Reported
                  </Button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </Card>
  );
}

function ActionItemsList({
  title,
  items,
  disabled,
  onStatus,
}: {
  title: string;
  items: StudentActionItemView[];
  disabled: boolean;
  onStatus: (actionItemId: string, status: "completed" | "dismissed") => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <StatusPill tone={items.length > 0 ? "warning" : "neutral"}>
          {items.length} open
        </StatusPill>
      </div>
      <div className="mt-4 grid gap-3">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No open items.
          </p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-border bg-background/70 p-3"
            >
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => onStatus(item.id, "completed")}
                >
                  Done
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => onStatus(item.id, "dismissed")}
                >
                  Dismiss
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </Card>
  );
}

function StudentProfileCard({ student }: { student: StudentView }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Student profile</h2>
      <div className="mt-4 grid gap-3">
        <Info label="Main goal" value={student.mainGoal} />
        <Info label="Current focus" value={student.currentFocus} />
        <Info label="Next action" value={student.nextAction} />
        <Info label="Parent/contact notes" value={student.parentNotes} />
        <Info label="Payment/package notes" value={student.paymentNotes} />
        <Info
          label="Application targets"
          value={student.applicationTargets.join(", ")}
        />
      </div>
    </Card>
  );
}

function LegacyClassLogs({ logs }: { logs: ClassLogView[] }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Legacy class logs</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Older notes remain visible while new classes use sessions.
      </p>
      <div className="mt-5 grid gap-3">
        {logs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No legacy class logs.
          </p>
        ) : (
          logs.map((log) => (
            <article
              key={log.id}
              className="rounded-lg border border-border bg-background/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{log.date}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {log.teacher} | {log.duration || "Duration not set"}
                  </p>
                </div>
                <StatusPill tone={log.parentUpdateSent ? "success" : "neutral"}>
                  {log.parentUpdateSent ? "Parent sent" : "Parent not sent"}
                </StatusPill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Info label="Worked on" value={log.workedOn} />
                <Info label="Feedback" value={log.feedbackGiven} />
                <Info label="Homework" value={log.homeworkAssigned} />
                <Info label="Next class focus" value={log.nextClassFocus} />
              </div>
            </article>
          ))
        )}
      </div>
    </Card>
  );
}

function PanelHeader({
  title,
  onCancel,
  disabled,
}: {
  title: string;
  onCancel: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button
        type="button"
        disabled={disabled}
        onClick={onCancel}
        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
        <span className="sr-only">Close panel</span>
      </button>
    </div>
  );
}

function FormActions({
  disabled,
  label = "Save",
}: {
  disabled: boolean;
  label?: string;
}) {
  return (
    <div className="flex justify-end md:col-span-2">
      <Button type="submit" disabled={disabled}>
        <Save aria-hidden="true" />
        {label}
      </Button>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6">{value || "Not set"}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium md:col-span-2">
      {label}
      <textarea
        className={`${fieldClass} min-h-24 py-3`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

interface PlanNextClassInput {
  studentId: string;
  scheduledStart: string;
  scheduledEnd: string;
  lessonGoal: string;
  planNotes: string;
  materialsNeeded: string;
  teacherPrivateNotes: string;
}

interface PrepareClassInput {
  lessonGoal: string;
  planNotes: string;
  materialsNeeded: string;
  teacherPrivateNotes: string;
}

interface CompleteSummaryInput {
  attendanceStatus: SummaryAttendanceStatus;
  actualSummary: string;
  studentProgress: string;
  homeworkAssigned: string;
  noHomework: boolean;
  parentFacingSummary: string;
  internalTeacherNotes: string;
  nextClassRecommendation: string;
  progressTags: string;
  studentActionItems: string;
  teacherActionItems: string;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(
  status: ClassSessionView["status"],
): "neutral" | "info" | "success" | "warning" {
  if (status === "completed" || status === "reported") return "success";
  if (status === "in_progress") return "info";
  if (
    status === "excused_absence" ||
    status === "unexcused_absence" ||
    status === "cancelled" ||
    status === "rescheduled"
  ) {
    return "warning";
  }
  return "neutral";
}

function getSummaryAttendanceStatus(
  attendanceStatus: AttendanceStatus,
): SummaryAttendanceStatus {
  return attendanceStatus === "pending" ? "attended" : attendanceStatus;
}

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(`${value}T16:00:00`);
  return toDatetimeLocalValue(date);
}

function addMinutesForDatetimeLocal(value: string, minutes: number): string {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return toDatetimeLocalValue(date);
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
