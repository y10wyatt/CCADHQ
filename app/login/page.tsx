import Image from "next/image";
import Link from "next/link";
import { KeyRound, Mail, UserPlus } from "lucide-react";

import {
  createInvitedAccount,
  requestPasswordReset,
  signInWithPassword,
} from "@/features/auth/application/actions";
import { normalizeAuthNextPath } from "@/features/auth/domain/auth";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type LoginMode = "sign-in" | "create" | "reset";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const mode = getMode(params.mode);
  const error = typeof params.error === "string" ? params.error : null;
  const nextPath = normalizeAuthNextPath(
    typeof params.next === "string" ? params.next : null,
  );

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-lg overflow-hidden p-0">
        <Image
          src="/placeholders/focus-room-banner.svg"
          alt=""
          width={960}
          height={280}
          priority
          className="h-auto w-full border-b border-border"
        />
        <div className="p-6 sm:p-8">
          <StatusPill tone="info">Invite-only workspace</StatusPill>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            {modeTitle(mode)}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {modeDescription(mode)}
          </p>

          <AuthNotice
            error={error}
            accountCreated={params.created === "1"}
            resetSent={params.resetSent === "1"}
          />

          {mode === "sign-in" && (
            <CredentialsForm action={signInWithPassword} nextPath={nextPath}>
              <KeyRound aria-hidden="true" />
              Sign in
            </CredentialsForm>
          )}

          {mode === "create" && (
            <CredentialsForm action={createInvitedAccount}>
              <UserPlus aria-hidden="true" />
              Create invited account
            </CredentialsForm>
          )}

          {mode === "reset" && (
            <form action={requestPasswordReset} className="mt-6 grid gap-4">
              <EmailField />
              <Button type="submit">
                <Mail aria-hidden="true" />
                Send password reset
              </Button>
            </form>
          )}

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {mode !== "sign-in" && <AuthLink href="/login">Sign in</AuthLink>}
            {mode !== "create" && (
              <AuthLink href="/login?mode=create">
                Create invited account
              </AuthLink>
            )}
            {mode !== "reset" && (
              <AuthLink href="/login?mode=reset">Forgot password?</AuthLink>
            )}
          </div>
        </div>
      </Card>
    </main>
  );
}

function CredentialsForm({
  action,
  children,
  nextPath,
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  nextPath?: string;
}) {
  return (
    <form action={action} className="mt-6 grid gap-4">
      <EmailField />
      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={nextPath ? "current-password" : "new-password"}
          minLength={8}
          maxLength={72}
          required
          className="min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        />
        {!nextPath && (
          <p className="text-xs text-muted-foreground">
            Use at least 8 characters.
          </p>
        )}
      </div>
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <Button type="submit">{children}</Button>
    </form>
  );
}

function EmailField() {
  return (
    <div className="grid gap-2">
      <label htmlFor="email" className="text-sm font-medium">
        Staff email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        placeholder="name@example.com"
      />
    </div>
  );
}

function AuthLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-medium text-accent hover:underline">
      {children}
    </Link>
  );
}

function AuthNotice({
  error,
  accountCreated,
  resetSent,
}: {
  error: string | null;
  accountCreated: boolean;
  resetSent: boolean;
}) {
  if (accountCreated) {
    return (
      <p className="mt-5 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
        Account created. Confirm your email if requested, then sign in.
      </p>
    );
  }

  if (resetSent) {
    return (
      <p className="mt-5 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
        If the account exists, a password reset email is on its way.
      </p>
    );
  }

  if (!error) {
    return null;
  }

  const message =
    error === "invalid-credentials"
      ? "The email or password is incorrect."
      : error === "invalid-account"
        ? "Enter a valid invited email and a password of at least 8 characters."
        : error === "account-not-created"
          ? "The account could not be created. Confirm the email has an active invitation."
          : "Enter a valid staff email address.";

  return (
    <p className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
      {message}
    </p>
  );
}

function getMode(value: string | string[] | undefined): LoginMode {
  return value === "create" || value === "reset" ? value : "sign-in";
}

function modeTitle(mode: LoginMode) {
  if (mode === "create") return "Create your CCAD HQ account";
  if (mode === "reset") return "Reset your password";
  return "Sign in to CCAD HQ";
}

function modeDescription(mode: LoginMode) {
  if (mode === "create") {
    return "Use the email address invited by a CCAD administrator. Existing magic-link users should use Forgot password? once.";
  }
  if (mode === "reset") {
    return "Enter your account email and we will send a secure password reset link.";
  }
  return "Enter your CCAD HQ account email and password.";
}
