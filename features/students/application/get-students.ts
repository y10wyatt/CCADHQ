import { notFound } from "next/navigation";

import type { CurrentMember } from "@/features/auth/domain/current-member";
import type {
  ClassLogView,
  ClassSessionView,
  StudentActionItemView,
  StudentSessionContext,
  StudentView,
} from "@/features/students/domain/students";
import type { Database } from "@/shared/database/database.types";
import { isMissingSchemaError } from "@/shared/database/is-missing-schema-error";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getStudents(member: CurrentMember): Promise<StudentView[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("organization_id", member.organization.id)
    .is("archived_at", null)
    .order("follow_up_needed", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingSchemaError(error)) {
      return [];
    }

    throw new Error(`Unable to load Students: ${error.message}`);
  }

  return (data ?? []).map(mapStudent);
}

export async function getStudentDetail(
  member: CurrentMember,
  studentId: string,
): Promise<StudentSessionContext> {
  const supabase = await createServerSupabaseClient();
  const [studentResult, logsResult, sessionsResult, actionItemsResult] =
    await Promise.all([
    supabase
      .from("students")
      .select("*")
      .eq("organization_id", member.organization.id)
      .eq("id", studentId)
      .is("archived_at", null)
      .maybeSingle(),
    supabase
      .from("class_logs")
      .select("*")
      .eq("organization_id", member.organization.id)
      .eq("student_id", studentId)
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("class_sessions")
      .select("*")
      .eq("organization_id", member.organization.id)
      .eq("student_id", studentId)
      .order("scheduled_start", { ascending: true }),
    supabase
      .from("student_action_items")
      .select("*")
      .eq("organization_id", member.organization.id)
      .eq("student_id", studentId)
      .eq("status", "open")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  ]);

  if (studentResult.error) {
    if (isMissingSchemaError(studentResult.error)) {
      notFound();
    }

    throw new Error(`Unable to load Student: ${studentResult.error.message}`);
  }
  if (!studentResult.data) {
    notFound();
  }
  if (logsResult.error) {
    if (isMissingSchemaError(logsResult.error)) {
      const sessions = mapOptionalSessions(sessionsResult);
      const actionItems = mapOptionalActionItems(actionItemsResult);

      return buildStudentSessionContext({
        student: mapStudent(studentResult.data),
        classLogs: [],
        sessions,
        actionItems,
      });
    }

    throw new Error(`Unable to load Class Logs: ${logsResult.error.message}`);
  }
  if (sessionsResult.error && !isMissingSchemaError(sessionsResult.error)) {
    throw new Error(
      `Unable to load Class Sessions: ${sessionsResult.error.message}`,
    );
  }
  if (
    actionItemsResult.error &&
    !isMissingSchemaError(actionItemsResult.error)
  ) {
    throw new Error(
      `Unable to load Student Action Items: ${actionItemsResult.error.message}`,
    );
  }

  return buildStudentSessionContext({
    student: mapStudent(studentResult.data),
    classLogs: (logsResult.data ?? []).map(mapClassLog),
    sessions: mapOptionalSessions(sessionsResult),
    actionItems: mapOptionalActionItems(actionItemsResult),
  });
}

function mapStudent(
  student: Database["public"]["Tables"]["students"]["Row"],
): StudentView {
  return {
    id: student.id,
    name: student.name,
    grade: student.grade,
    program: student.program,
    status: student.status,
    mainGoal: student.main_goal,
    currentFocus: student.current_focus,
    nextAction: student.next_action,
    nextClassDate: student.next_class_date,
    lastClassDate: student.last_class_date,
    followUpNeeded: student.follow_up_needed,
    permissionToPost: student.permission_to_post,
    notes: student.notes,
    strengths: student.strengths,
    needsSupport: student.needs_support,
    applicationTargets: student.application_targets,
    parentNotes: student.parent_notes,
    paymentNotes: student.payment_notes,
    remainingClassCredits: student.remaining_class_credits ?? 0,
    originalLeadId: student.original_lead_id,
  };
}

function mapClassLog(
  log: Database["public"]["Tables"]["class_logs"]["Row"],
): ClassLogView {
  return {
    id: log.id,
    studentId: log.student_id,
    date: log.log_date,
    teacher: log.teacher,
    duration: log.duration,
    workedOn: log.worked_on,
    feedbackGiven: log.feedback_given,
    homeworkAssigned: log.homework_assigned,
    materialsNeeded: log.materials_needed,
    parentUpdateSent: log.parent_update_sent,
    nextClassFocus: log.next_class_focus,
    imageUrl: log.image_url,
  };
}

function mapClassSession(
  session: Database["public"]["Tables"]["class_sessions"]["Row"],
): ClassSessionView {
  return {
    id: session.id,
    studentId: session.student_id,
    enrollmentId: session.enrollment_id,
    seriesId: session.series_id,
    scheduledStart: session.scheduled_start,
    scheduledEnd: session.scheduled_end,
    status: session.status,
    attendanceStatus: session.attendance_status,
    deductsCredit: session.deducts_credit,
    lessonGoal: session.lesson_goal,
    planNotes: session.plan_notes,
    materialsNeeded: session.materials_needed,
    teacherPrivateNotes: session.teacher_private_notes,
    actualSummary: session.actual_summary,
    studentProgress: session.student_progress,
    homeworkAssigned: session.homework_assigned,
    noHomework: session.no_homework,
    parentFacingSummary: session.parent_facing_summary,
    internalTeacherNotes: session.internal_teacher_notes,
    nextClassRecommendation: session.next_class_recommendation,
    progressTags: session.progress_tags,
    parentReportSentAt: session.parent_report_sent_at,
  };
}

function mapActionItem(
  item: Database["public"]["Tables"]["student_action_items"]["Row"],
): StudentActionItemView {
  return {
    id: item.id,
    studentId: item.student_id,
    classSessionId: item.class_session_id,
    assignedTo: item.assigned_to,
    title: item.title,
    description: item.description,
    dueDate: item.due_date,
    status: item.status,
  };
}

function mapOptionalSessions(
  result: {
    data: Database["public"]["Tables"]["class_sessions"]["Row"][] | null;
    error: { message: string } | null;
  },
): ClassSessionView[] {
  if (result.error) return [];
  return (result.data ?? []).map(mapClassSession);
}

function mapOptionalActionItems(
  result: {
    data: Database["public"]["Tables"]["student_action_items"]["Row"][] | null;
    error: { message: string } | null;
  },
): StudentActionItemView[] {
  if (result.error) return [];
  return (result.data ?? []).map(mapActionItem);
}

function buildStudentSessionContext({
  student,
  classLogs,
  sessions,
  actionItems,
}: {
  student: StudentView;
  classLogs: ClassLogView[];
  sessions: ClassSessionView[];
  actionItems: StudentActionItemView[];
}): StudentSessionContext {
  const now = Date.now();
  const upcomingSession =
    sessions.find(
      (session) =>
        Date.parse(session.scheduledStart) >= now &&
        (session.status === "planned" || session.status === "in_progress"),
    ) ??
    sessions.find(
      (session) =>
        session.status === "planned" || session.status === "in_progress",
    ) ??
    null;
  const previousCompletedSession =
    [...sessions]
      .reverse()
      .find(
        (session) =>
          session.status === "completed" || session.status === "reported",
      ) ?? null;

  return {
    student,
    classLogs,
    sessions,
    upcomingSession,
    previousCompletedSession,
    openStudentActionItems: actionItems.filter(
      (item) => item.assignedTo === "student",
    ),
    openTeacherActionItems: actionItems.filter(
      (item) => item.assignedTo === "teacher",
    ),
  };
}
