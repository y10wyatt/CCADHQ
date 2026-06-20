"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import {
  leadAssignedStaffOptions,
  leadSources,
  leadStatuses,
} from "@/features/leads/domain/leads";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const uuid = z.string().uuid();
const optionalDate = z.string().nullable().optional();
const textArray = z.string().transform((value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean),
);

const leadSchema = z.object({
  studentName: z.string().trim().min(1).max(120),
  grade: z.string().trim().max(80),
  school: z.string().trim().max(160),
  parentName: z.string().trim().max(120),
  parentEmail: z.string().trim().email().or(z.literal("")),
  parentPhone: z.string().trim().max(80),
  programInterest: z.string().trim().max(160),
  targetSchools: textArray,
  goals: z.string().trim().max(2000),
  timeline: z.string().trim().max(500),
  source: z.enum(leadSources),
  status: z.enum(leadStatuses),
  potentialRevenueMinor: z.number().int().min(0).max(100000000),
  assignedStaff: z.enum(leadAssignedStaffOptions),
  lastContactedDate: optionalDate,
  nextFollowUpDate: optionalDate,
  notes: z.string().trim().max(3000),
});

const leadActivitySchema = z.object({
  leadId: uuid,
  activityDate: z.string(),
  title: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(2000),
});

export interface LeadActionResult {
  ok: boolean;
  error?: string;
  studentId?: string;
}

export async function createLead(
  input: z.input<typeof leadSchema>,
): Promise<LeadActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      organization_id: member.organization.id,
      student_name: parsed.data.studentName,
      grade: parsed.data.grade,
      school: parsed.data.school,
      parent_name: parsed.data.parentName,
      parent_email: parsed.data.parentEmail,
      parent_phone: parsed.data.parentPhone,
      program_interest: parsed.data.programInterest,
      target_schools: parsed.data.targetSchools,
      goals: parsed.data.goals,
      timeline: parsed.data.timeline,
      source: parsed.data.source,
      status: parsed.data.status,
      potential_revenue_minor: parsed.data.potentialRevenueMinor,
      assigned_staff: parsed.data.assignedStaff,
      last_contacted_date: parsed.data.lastContactedDate || null,
      next_follow_up_date: parsed.data.nextFollowUpDate || null,
      notes: parsed.data.notes,
      created_by_member_id: member.id,
    })
    .select("id")
    .single();

  if (error) return finish(error, "Unable to create the lead.");

  await supabase.from("lead_activity_entries").insert({
    organization_id: member.organization.id,
    lead_id: data.id,
    activity_date: new Date().toISOString().slice(0, 10),
    title: "Initial Inquiry",
    notes: parsed.data.source ? `Source: ${parsed.data.source}` : "",
    created_by_member_id: member.id,
  });

  revalidateLeads();
  return { ok: true };
}

export async function updateLead(
  input: z.input<typeof leadSchema> & { leadId: string },
): Promise<LeadActionResult> {
  const parsed = leadSchema.extend({ leadId: uuid }).safeParse(input);
  if (!parsed.success) return invalidInput();
  await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("leads")
    .update({
      student_name: parsed.data.studentName,
      grade: parsed.data.grade,
      school: parsed.data.school,
      parent_name: parsed.data.parentName,
      parent_email: parsed.data.parentEmail,
      parent_phone: parsed.data.parentPhone,
      program_interest: parsed.data.programInterest,
      target_schools: parsed.data.targetSchools,
      goals: parsed.data.goals,
      timeline: parsed.data.timeline,
      source: parsed.data.source,
      status: parsed.data.status,
      potential_revenue_minor: parsed.data.potentialRevenueMinor,
      assigned_staff: parsed.data.assignedStaff,
      last_contacted_date: parsed.data.lastContactedDate || null,
      next_follow_up_date: parsed.data.nextFollowUpDate || null,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.leadId);

  return finish(error, "Unable to update the lead.");
}

export async function updateLeadStatus(
  leadId: string,
  status: z.infer<typeof leadSchema>["status"],
): Promise<LeadActionResult> {
  const parsed = z.object({ leadId: uuid, status: z.enum(leadStatuses) }).safeParse({
    leadId,
    status,
  });
  if (!parsed.success) return invalidInput();
  if (parsed.data.status === "Enrolled") {
    return { ok: false, error: "Use conversion to enroll this lead." };
  }
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.data.status })
    .eq("organization_id", member.organization.id)
    .eq("id", parsed.data.leadId);

  if (error) return finish(error, "Unable to move the lead.");

  await supabase.from("lead_activity_entries").insert({
    organization_id: member.organization.id,
    lead_id: parsed.data.leadId,
    activity_date: new Date().toISOString().slice(0, 10),
    title: `Moved to ${parsed.data.status}`,
    created_by_member_id: member.id,
  });

  revalidateLeads();
  return { ok: true };
}

export async function createLeadActivity(
  input: z.input<typeof leadActivitySchema>,
): Promise<LeadActionResult> {
  const parsed = leadActivitySchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("lead_activity_entries").insert({
    organization_id: member.organization.id,
    lead_id: parsed.data.leadId,
    activity_date: parsed.data.activityDate,
    title: parsed.data.title,
    notes: parsed.data.notes,
    created_by_member_id: member.id,
  });

  return finish(error, "Unable to add the timeline entry.");
}

export async function convertLeadToStudent(
  leadId: string,
): Promise<LeadActionResult> {
  const parsed = uuid.safeParse(leadId);
  if (!parsed.success) return invalidInput();
  const member = await requireCurrentMember();
  const supabase = await createServerSupabaseClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", member.organization.id)
    .eq("id", parsed.data)
    .maybeSingle();

  if (leadError) return finish(leadError, "Unable to load the lead.");
  if (!lead) return { ok: false, error: "Lead was not found." };
  if (lead.converted_student_id) {
    return { ok: true, studentId: lead.converted_student_id };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      organization_id: member.organization.id,
      name: lead.student_name,
      grade: lead.grade,
      program: "Portfolio",
      status: "Active",
      main_goal: lead.goals,
      current_focus: lead.program_interest,
      next_action: lead.next_follow_up_date
        ? `Admissions follow-up carried over from ${lead.next_follow_up_date}`
        : "Begin enrolled student onboarding.",
      follow_up_needed: Boolean(lead.next_follow_up_date),
      permission_to_post: "Pending",
      notes: lead.notes,
      application_targets: lead.target_schools,
      parent_notes: [
        lead.parent_name,
        lead.parent_email,
        lead.parent_phone,
        lead.school ? `School: ${lead.school}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
      payment_notes:
        lead.potential_revenue_minor > 0
          ? `Original lead value: ${lead.potential_revenue_minor / 100}`
          : "",
      original_lead_id: lead.id,
      created_by_member_id: member.id,
    })
    .select("id")
    .single();

  if (studentError) {
    return finish(studentError, "Unable to create the student record.");
  }

  const convertedAt = new Date().toISOString();
  const [leadUpdate, activityInsert] = await Promise.all([
    supabase
      .from("leads")
      .update({
        status: "Enrolled",
        converted_student_id: student.id,
        converted_at: convertedAt,
        archived_at: convertedAt,
      })
      .eq("id", lead.id),
    supabase.from("lead_activity_entries").insert({
      organization_id: member.organization.id,
      lead_id: lead.id,
      activity_date: convertedAt.slice(0, 10),
      title: "Converted to Student",
      notes: "Lead history preserved and linked to the student profile.",
      created_by_member_id: member.id,
    }),
  ]);

  const error = leadUpdate.error ?? activityInsert.error;
  if (error) return finish(error, "Student was created, but lead conversion could not be completed.");

  revalidateLeads();
  revalidatePath("/students");
  return { ok: true, studentId: student.id };
}

function finish(
  error: { message: string } | null,
  message: string,
): LeadActionResult {
  revalidateLeads();
  return error ? { ok: false, error: message } : { ok: true };
}

function revalidateLeads() {
  revalidatePath("/");
  revalidatePath("/leads");
}

function invalidInput(): LeadActionResult {
  return { ok: false, error: "Check the lead details and try again." };
}
