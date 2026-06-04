"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember } from "@/features/auth/application/get-current-member";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const correctionSchema = z.object({
  correctionId: z.string().uuid(),
  points: z.number().int().min(-100000).max(100000).refine((value) => value !== 0),
  reason: z.string().trim().min(3).max(500),
});

export interface StudioXpCorrectionResult {
  ok: boolean;
  error?: string;
  previousLevel?: number;
  newLevel?: number;
  newTotal?: number;
}

export async function createStudioXpCorrection(input: {
  correctionId: string;
  points: number;
  reason: string;
}): Promise<StudioXpCorrectionResult> {
  const parsed = correctionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter non-zero points and a clear reason." };
  }

  const member = await requireCurrentMember();
  if (member.role !== "admin") {
    return { ok: false, error: "Admin access is required." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_studio_xp_correction", {
    target_organization_id: member.organization.id,
    correction_id: parsed.data.correctionId,
    correction_points: parsed.data.points,
    correction_reason: parsed.data.reason,
  });

  if (error) {
    return {
      ok: false,
      error:
        error.message.includes("below zero")
          ? "The correction cannot reduce Studio XP below zero."
          : "Unable to record the Studio XP correction.",
    };
  }

  revalidatePath("/");
  revalidatePath("/studio-xp");

  const result = data as {
    previous_level?: number;
    new_level?: number;
    new_total?: number;
  } | null;

  return {
    ok: true,
    previousLevel: result?.previous_level,
    newLevel: result?.new_level,
    newTotal: result?.new_total,
  };
}
