"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import {
  attendanceDeductsCredit,
  getAttendanceCreditDelta,
  getSessionStatusForAttendance,
  hasCompletedSummaryRequirements,
} from "@/features/students/domain/students";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const optionalDate = z.string().nullable().optional();
const optionalTextArray = z.string().transform((value) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean),
);
const textArray = z.string().transform((value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean),
);

const studentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  grade: z.string().trim().max(80),
  program: z.enum(["Portfolio", "AP Drawing", "Animation", "Trial", "Other"]),
  status: z.enum(["Active", "Trial", "Paused", "Completed"]),
  mainGoal: z.string().trim().max(500),
  currentFocus: z.string().trim().max(500),
  nextAction: z.string().trim().max(500),
  nextClassDate: optionalDate,
  lastClassDate: optionalDate,
  followUpNeeded: z.boolean(),
  permissionToPost: z.enum(["Yes", "No", "Pending"]),
  notes: z.string().trim().max(2000),
  strengths: textArray,
  needsSupport: textArray,
  applicationTargets: textArray,
  parentNotes: z.string().trim().max(2000),
  paymentNotes: z.string().trim().max(2000),
  remainingClassCredits: z.coerce.number().int().min(0).max(500),
});

const classLogSchema = z.object({
  studentId: uuid,
  date: z.string(),
  teacher: z.enum(["William", "Alice", "Gerald", "Other"]),
  duration: z.string().trim().max(80),
  workedOn: z.string().trim().max(2000),
  feedbackGiven: z.string().trim().max(2000),
  homeworkAssigned: z.string().trim().max(2000),
  materialsNeeded: z.string().trim().max(1000),
  parentUpdateSent: z.boolean(),
  nextClassFocus: z.string().trim().max(1000),
  imageUrl: z.string().trim().max(1000).nullable().optional(),
});

const classSessionSchema = z.object({
  studentId: uuid,
  scheduledStart: z.string().trim().min(1),
  scheduledEnd: z.string().trim().min(1),
  lessonGoal: z.string().trim().max(500),
  planNotes: z.string().trim().max(2000),
  materialsNeeded: z.string().trim().max(1000),
  teacherPrivateNotes: z.string().trim().max(2000),
});

const prepareClassSchema = z.object({
  sessionId: uuid,
  lessonGoal: z.string().trim().max(500),
  planNotes: z.string().trim().max(2000),
  materialsNeeded: z.string().trim().max(1000),
  teacherPrivateNotes: z.string().trim().max(2000),
});

const attendanceSchema = z.object({
  sessionId: uuid,
  attendanceStatus: z.enum([
    "attended",
    "excused_absence",
    "unexcused_absence",
    "cancelled",
    "rescheduled",
  ]),
});

const summarySchema = z.object({
  sessionId: uuid,
  attendanceStatus: z.enum([
    "attended",
    "excused_absence",
    "unexcused_absence",
    "cancelled",
    "rescheduled",
  ]),
  actualSummary: z.string().trim().max(3000),
  studentProgress: z.string().trim().max(2000),
  homeworkAssigned: z.string().trim().max(2000),
  noHomework: z.boolean(),
  parentFacingSummary: z.string().trim().max(3000),
  internalTeacherNotes: z.string().trim().max(2000),
  nextClassRecommendation: z.string().trim().max(2000),
  progressTags: optionalTextArray,
  studentActionItems: textArray,
  teacherActionItems: textArray,
});

const actionItemStatusSchema = z.object({
  actionItemId: uuid,
  status: z.enum(["open", "completed", "dismissed"]),
});

export interface StudentActionResult {
  ok: boolean;
  error?: string;
}

export async function createStudent(
  input: z.input<typeof studentSchema>,
): Promise<StudentActionResult> {
  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("students").insert({
    organization_id: member.organization.id,
    name: parsed.data.name,
    grade: parsed.data.grade,
    program: parsed.data.program,
    status: parsed.data.status,
    main_goal: parsed.data.mainGoal,
    current_focus: parsed.data.currentFocus,
    next_action: parsed.data.nextAction,
    next_class_date: parsed.data.nextClassDate || null,
    last_class_date: parsed.data.lastClassDate || null,
    follow_up_needed: parsed.data.followUpNeeded,
    permission_to_post: parsed.data.permissionToPost,
    notes: parsed.data.notes,
    strengths: parsed.data.strengths,
    needs_support: parsed.data.needsSupport,
    application_targets: parsed.data.applicationTargets,
    parent_notes: parsed.data.parentNotes,
    payment_notes: parsed.data.paymentNotes,
    remaining_class_credits: parsed.data.remainingClassCredits,
    created_by_member_id: member.id,
  });
  return finish(error, "Unable to create the student.");
}

export async function updateStudent(
  input: z.input<typeof studentSchema> & { studentId: string },
): Promise<StudentActionResult> {
  const parsed = studentSchema.extend({ studentId: uuid }).safeParse(input);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("students")
    .update({
      name: parsed.data.name,
      grade: parsed.data.grade,
      program: parsed.data.program,
      status: parsed.data.status,
      main_goal: parsed.data.mainGoal,
      current_focus: parsed.data.currentFocus,
      next_action: parsed.data.nextAction,
      next_class_date: parsed.data.nextClassDate || null,
      last_class_date: parsed.data.lastClassDate || null,
      follow_up_needed: parsed.data.followUpNeeded,
      permission_to_post: parsed.data.permissionToPost,
      notes: parsed.data.notes,
      strengths: parsed.data.strengths,
      needs_support: parsed.data.needsSupport,
      application_targets: parsed.data.applicationTargets,
      parent_notes: parsed.data.parentNotes,
      payment_notes: parsed.data.paymentNotes,
      remaining_class_credits: parsed.data.remainingClassCredits,
    })
    .eq("id", parsed.data.studentId);
  return finish(error, "Unable to update the student.");
}

export async function archiveStudent(studentId: string): Promise<StudentActionResult> {
  const parsed = uuid.safeParse(studentId);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("students")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data);
  return finish(error, "Unable to archive the student.");
}

export async function createClassLog(
  input: z.input<typeof classLogSchema>,
): Promise<StudentActionResult> {
  const parsed = classLogSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("class_logs").insert({
    organization_id: member.organization.id,
    student_id: parsed.data.studentId,
    log_date: parsed.data.date,
    teacher: parsed.data.teacher,
    duration: parsed.data.duration,
    worked_on: parsed.data.workedOn,
    feedback_given: parsed.data.feedbackGiven,
    homework_assigned: parsed.data.homeworkAssigned,
    materials_needed: parsed.data.materialsNeeded,
    parent_update_sent: parsed.data.parentUpdateSent,
    next_class_focus: parsed.data.nextClassFocus,
    image_url: parsed.data.imageUrl || null,
    created_by_member_id: member.id,
  });
  return finish(error, "Unable to create the class log.");
}

export async function updateClassLog(
  input: z.input<typeof classLogSchema> & { logId: string },
): Promise<StudentActionResult> {
  const parsed = classLogSchema.extend({ logId: uuid }).safeParse(input);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("class_logs")
    .update({
      log_date: parsed.data.date,
      teacher: parsed.data.teacher,
      duration: parsed.data.duration,
      worked_on: parsed.data.workedOn,
      feedback_given: parsed.data.feedbackGiven,
      homework_assigned: parsed.data.homeworkAssigned,
      materials_needed: parsed.data.materialsNeeded,
      parent_update_sent: parsed.data.parentUpdateSent,
      next_class_focus: parsed.data.nextClassFocus,
      image_url: parsed.data.imageUrl || null,
    })
    .eq("id", parsed.data.logId);
  return finish(error, "Unable to update the class log.");
}

export async function deleteClassLog(logId: string): Promise<StudentActionResult> {
  const parsed = uuid.safeParse(logId);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("class_logs").delete().eq("id", parsed.data);
  return finish(error, "Unable to delete the class log.");
}

export async function createClassSession(
  input: z.input<typeof classSessionSchema>,
): Promise<StudentActionResult> {
  const parsed = classSessionSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const scheduledStart = toIsoDate(parsed.data.scheduledStart);
  const scheduledEnd = toIsoDate(parsed.data.scheduledEnd);
  if (!scheduledStart || !scheduledEnd || scheduledEnd <= scheduledStart) {
    return {
      ok: false,
      error: "Set a valid class start and end time.",
    };
  }

  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("class_sessions").insert({
    organization_id: member.organization.id,
    student_id: parsed.data.studentId,
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    lesson_goal: parsed.data.lessonGoal,
    plan_notes: parsed.data.planNotes,
    materials_needed: parsed.data.materialsNeeded,
    teacher_private_notes: parsed.data.teacherPrivateNotes,
    created_by_member_id: member.id,
  });
  if (error) return finish(error, "Unable to create the class session.");

  const { error: studentError } = await supabase
    .from("students")
    .update({ next_class_date: parsed.data.scheduledStart.slice(0, 10) })
    .eq("organization_id", member.organization.id)
    .eq("id", parsed.data.studentId);
  return finish(studentError, "Class session created, but student date failed.");
}

export async function updatePrepareClass(
  input: z.input<typeof prepareClassSchema>,
): Promise<StudentActionResult> {
  const parsed = prepareClassSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("class_sessions")
    .update({
      lesson_goal: parsed.data.lessonGoal,
      plan_notes: parsed.data.planNotes,
      materials_needed: parsed.data.materialsNeeded,
      teacher_private_notes: parsed.data.teacherPrivateNotes,
    })
    .eq("organization_id", member.organization.id)
    .eq("id", parsed.data.sessionId);
  return finish(error, "Unable to save class preparation.");
}

export async function startClassSession(
  sessionId: string,
): Promise<StudentActionResult> {
  const parsed = uuid.safeParse(sessionId);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("class_sessions")
    .update({ status: "in_progress" })
    .eq("organization_id", member.organization.id)
    .eq("id", parsed.data);
  return finish(error, "Unable to start the class.");
}

export async function updateSessionAttendance(
  input: z.input<typeof attendanceSchema>,
): Promise<StudentActionResult> {
  const parsed = attendanceSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const result = await applyAttendanceChange({
    sessionId: parsed.data.sessionId,
    attendanceStatus: parsed.data.attendanceStatus,
    fallbackStatus: "in_progress",
  });
  return result.ok ? finish(null, "") : result;
}

export async function completeClassSummary(
  input: z.input<typeof summarySchema>,
): Promise<StudentActionResult> {
  const parsed = summarySchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  if (
    !hasCompletedSummaryRequirements({
      attendanceStatus: parsed.data.attendanceStatus,
      actualSummary: parsed.data.actualSummary,
      homeworkAssigned: parsed.data.homeworkAssigned,
      noHomework: parsed.data.noHomework,
      nextClassRecommendation: parsed.data.nextClassRecommendation,
    })
  ) {
    return {
      ok: false,
      error:
        "Add attendance, summary, homework or no homework, and next class recommendation.",
    };
  }

  const attendanceResult = await applyAttendanceChange({
    sessionId: parsed.data.sessionId,
    attendanceStatus: parsed.data.attendanceStatus,
    fallbackStatus: "completed",
  });
  if (!attendanceResult.ok) return attendanceResult;

  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { data: session, error: sessionError } = await supabase
    .from("class_sessions")
    .select("student_id, scheduled_start")
    .eq("organization_id", member.organization.id)
    .eq("id", parsed.data.sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return { ok: false, error: "Unable to find the class session." };
  }

  const { error } = await supabase
    .from("class_sessions")
    .update({
      status: getSessionStatusForAttendance(
        parsed.data.attendanceStatus,
        "completed",
      ),
      actual_summary: parsed.data.actualSummary,
      student_progress: parsed.data.studentProgress,
      homework_assigned: parsed.data.noHomework
        ? ""
        : parsed.data.homeworkAssigned,
      no_homework: parsed.data.noHomework,
      parent_facing_summary: parsed.data.parentFacingSummary,
      internal_teacher_notes: parsed.data.internalTeacherNotes,
      next_class_recommendation: parsed.data.nextClassRecommendation,
      progress_tags: parsed.data.progressTags,
    })
    .eq("organization_id", member.organization.id)
    .eq("id", parsed.data.sessionId);
  if (error) return finish(error, "Unable to complete the class summary.");

  const { error: studentDateError } = await supabase
    .from("students")
    .update({ last_class_date: session.scheduled_start.slice(0, 10) })
    .eq("organization_id", member.organization.id)
    .eq("id", session.student_id);
  if (studentDateError) {
    return finish(studentDateError, "Summary saved, but student date failed.");
  }

  const actionItems = [
    ...parsed.data.studentActionItems.map((title) => ({
      organization_id: member.organization.id,
      student_id: session.student_id,
      class_session_id: parsed.data.sessionId,
      assigned_to: "student" as const,
      title,
      created_by_member_id: member.id,
    })),
    ...parsed.data.teacherActionItems.map((title) => ({
      organization_id: member.organization.id,
      student_id: session.student_id,
      class_session_id: parsed.data.sessionId,
      assigned_to: "teacher" as const,
      title,
      created_by_member_id: member.id,
    })),
  ];

  if (actionItems.length > 0) {
    const { error: actionItemsError } = await supabase
      .from("student_action_items")
      .insert(actionItems);
    if (actionItemsError) {
      return finish(actionItemsError, "Summary saved, but action items failed.");
    }
  }

  return finish(null, "");
}

export async function markSessionReported(
  sessionId: string,
): Promise<StudentActionResult> {
  const parsed = uuid.safeParse(sessionId);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("class_sessions")
    .update({
      status: "reported",
      parent_report_sent_at: new Date().toISOString(),
    })
    .eq("organization_id", member.organization.id)
    .eq("id", parsed.data);
  return finish(error, "Unable to mark the session reported.");
}

export async function updateStudentActionItemStatus(
  input: z.input<typeof actionItemStatusSchema>,
): Promise<StudentActionResult> {
  const parsed = actionItemStatusSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("student_action_items")
    .update({ status: parsed.data.status })
    .eq("organization_id", member.organization.id)
    .eq("id", parsed.data.actionItemId);
  return finish(error, "Unable to update the action item.");
}

async function applyAttendanceChange({
  sessionId,
  attendanceStatus,
  fallbackStatus,
}: {
  sessionId: string;
  attendanceStatus: z.infer<typeof attendanceSchema>["attendanceStatus"];
  fallbackStatus: "in_progress" | "completed";
}): Promise<StudentActionResult> {
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { data: session, error: sessionError } = await supabase
    .from("class_sessions")
    .select("id, student_id, deducts_credit, status")
    .eq("organization_id", member.organization.id)
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return { ok: false, error: "Unable to find the class session." };
  }

  const creditDelta = getAttendanceCreditDelta({
    previousDeductsCredit: session.deducts_credit,
    nextAttendanceStatus: attendanceStatus,
  });

  if (creditDelta !== 0) {
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("remaining_class_credits")
      .eq("organization_id", member.organization.id)
      .eq("id", session.student_id)
      .maybeSingle();

    if (studentError || !student) {
      return { ok: false, error: "Unable to update class credits." };
    }

    const nextCredits = student.remaining_class_credits + creditDelta;
    if (nextCredits < 0) {
      return {
        ok: false,
        error: "This student has no remaining class credits to deduct.",
      };
    }

    const { error: creditError } = await supabase
      .from("students")
      .update({ remaining_class_credits: nextCredits })
      .eq("organization_id", member.organization.id)
      .eq("id", session.student_id);

    if (creditError) {
      return { ok: false, error: "Unable to update class credits." };
    }
  }

  const nextStatus = getSessionStatusForAttendance(
    attendanceStatus,
    fallbackStatus,
  );
  const { error: updateError } = await supabase
    .from("class_sessions")
    .update({
      attendance_status: attendanceStatus,
      deducts_credit: attendanceDeductsCredit(attendanceStatus),
      status: nextStatus,
    })
    .eq("organization_id", member.organization.id)
    .eq("id", sessionId);

  return updateError
    ? { ok: false, error: "Unable to update attendance." }
    : { ok: true };
}

function toIsoDate(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function finish(
  error: { message: string } | null,
  message: string,
): StudentActionResult {
  revalidatePath("/");
  revalidatePath("/students");
  return error ? { ok: false, error: message } : { ok: true };
}

function invalidInput(): StudentActionResult {
  return { ok: false, error: "Check the student details and try again." };
}
