import { notFound } from "next/navigation";

import type { CurrentMember } from "@/features/auth/domain/current-member";
import type { ClassLogView, StudentView } from "@/features/students/domain/students";
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
): Promise<{ student: StudentView; classLogs: ClassLogView[] }> {
  const supabase = await createServerSupabaseClient();
  const [studentResult, logsResult] = await Promise.all([
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
      return {
        student: mapStudent(studentResult.data),
        classLogs: [],
      };
    }

    throw new Error(`Unable to load Class Logs: ${logsResult.error.message}`);
  }

  return {
    student: mapStudent(studentResult.data),
    classLogs: (logsResult.data ?? []).map(mapClassLog),
  };
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
