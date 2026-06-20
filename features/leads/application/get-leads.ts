import { notFound } from "next/navigation";

import type { CurrentMember } from "@/features/auth/domain/current-member";
import {
  buildLeadOverviewMetrics,
  buildLeadSourceReports,
  type LeadActivityView,
  type LeadBoardView,
  type LeadView,
} from "@/features/leads/domain/leads";
import type { Database } from "@/shared/database/database.types";
import { isMissingSchemaError } from "@/shared/database/is-missing-schema-error";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

export async function getLeadBoard(member: CurrentMember): Promise<LeadBoardView> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", member.organization.id)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingSchemaError(error)) {
      return {
        leads: [],
        metrics: buildLeadOverviewMetrics({ leads: [], now: new Date() }),
        sourceReports: buildLeadSourceReports([]),
        todayIso: new Date().toISOString().slice(0, 10),
        currencyCode: member.organization.currencyCode,
      };
    }

    throw new Error(`Unable to load Leads: ${error.message}`);
  }

  const leads = (data ?? []).map(mapLead);

  return {
    leads,
    metrics: buildLeadOverviewMetrics({ leads, now: new Date() }),
    sourceReports: buildLeadSourceReports(leads),
    todayIso: new Date().toISOString().slice(0, 10),
    currencyCode: member.organization.currencyCode,
  };
}

export async function getLeadDetail(
  member: CurrentMember,
  leadId: string,
): Promise<{ lead: LeadView; activities: LeadActivityView[] }> {
  const supabase = await createServerSupabaseClient();
  const [leadResult, activityResult] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("organization_id", member.organization.id)
      .eq("id", leadId)
      .maybeSingle(),
    supabase
      .from("lead_activity_entries")
      .select("*")
      .eq("organization_id", member.organization.id)
      .eq("lead_id", leadId)
      .order("activity_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (leadResult.error) {
    if (isMissingSchemaError(leadResult.error)) {
      notFound();
    }

    throw new Error(`Unable to load Lead: ${leadResult.error.message}`);
  }
  if (!leadResult.data) {
    notFound();
  }
  if (activityResult.error) {
    if (isMissingSchemaError(activityResult.error)) {
      return { lead: mapLead(leadResult.data), activities: [] };
    }

    throw new Error(`Unable to load Lead activity: ${activityResult.error.message}`);
  }

  return {
    lead: mapLead(leadResult.data),
    activities: (activityResult.data ?? []).map(mapLeadActivity),
  };
}

function mapLead(lead: Database["public"]["Tables"]["leads"]["Row"]): LeadView {
  return {
    id: lead.id,
    studentName: lead.student_name,
    grade: lead.grade,
    school: lead.school,
    parentName: lead.parent_name,
    parentEmail: lead.parent_email,
    parentPhone: lead.parent_phone,
    programInterest: lead.program_interest,
    targetSchools: lead.target_schools,
    goals: lead.goals,
    timeline: lead.timeline,
    source: lead.source,
    status: lead.status,
    potentialRevenueMinor: lead.potential_revenue_minor,
    assignedStaff: lead.assigned_staff,
    createdAt: lead.created_at,
    lastContactedDate: lead.last_contacted_date,
    nextFollowUpDate: lead.next_follow_up_date,
    notes: lead.notes,
    convertedStudentId: lead.converted_student_id,
    convertedAt: lead.converted_at,
  };
}

function mapLeadActivity(
  entry: Database["public"]["Tables"]["lead_activity_entries"]["Row"],
): LeadActivityView {
  return {
    id: entry.id,
    leadId: entry.lead_id,
    activityDate: entry.activity_date,
    title: entry.title,
    notes: entry.notes,
    createdAt: entry.created_at,
  };
}
