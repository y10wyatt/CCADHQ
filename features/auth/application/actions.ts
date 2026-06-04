"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { normalizeAuthNextPath } from "@/features/auth/domain/auth";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(8).max(72);
const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

function loginRedirect(
  params: Record<string, string>,
  nextPath = "/",
): never {
  const search = new URLSearchParams(params);
  if (nextPath !== "/") {
    search.set("next", nextPath);
  }
  redirect(`/login?${search.toString()}`);
}

export async function signInWithPassword(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const nextPath = normalizeAuthNextPath(
    typeof formData.get("next") === "string"
      ? (formData.get("next") as string)
      : null,
  );

  if (!parsed.success) {
    loginRedirect({ error: "invalid-credentials" }, nextPath);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    loginRedirect({ error: "invalid-credentials" }, nextPath);
  }

  redirect(nextPath);
}

export async function createInvitedAccount(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    loginRedirect({ mode: "create", error: "invalid-account" });
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    loginRedirect({ mode: "create", error: "account-not-created" });
  }

  if (data.session) {
    redirect("/");
  }

  loginRedirect({ created: "1" });
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));

  if (!parsed.success) {
    loginRedirect({ mode: "reset", error: "invalid-email" });
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  loginRedirect({ resetSent: "1" });
}

export async function updatePassword(formData: FormData) {
  const parsed = z
    .object({
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((value) => value.password === value.confirmPassword)
    .safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

  if (!parsed.success) {
    redirect("/reset-password?error=invalid-password");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    redirect("/reset-password?error=unable-to-update");
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
