"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const emailSchema = z.string().trim().email().max(254);

export async function requestMagicLink(formData: FormData) {
  const result = emailSchema.safeParse(formData.get("email"));

  if (!result.success) {
    redirect("/login?error=invalid-email");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: result.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    redirect("/login?error=unable-to-send");
  }

  redirect("/login?sent=1");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
