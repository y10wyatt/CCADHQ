"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const optionalDate = z.string().nullable().optional();
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
