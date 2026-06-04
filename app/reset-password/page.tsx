import { KeyRound } from "lucide-react";

import { updatePassword } from "@/features/auth/application/actions";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

interface ResetPasswordPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string";

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <StatusPill tone="info">Secure account recovery</StatusPill>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Use at least 8 characters. Your recovery link must still be active.
        </p>

        {error && (
          <p className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            The password could not be updated. Confirm both entries match and
            request a new recovery link if needed.
          </p>
        )}

        <form action={updatePassword} className="mt-6 grid gap-4">
          <PasswordField id="password" label="New password" />
          <PasswordField id="confirmPassword" label="Confirm new password" />
          <Button type="submit">
            <KeyRound aria-hidden="true" />
            Update password
          </Button>
        </form>
      </Card>
    </main>
  );
}

function PasswordField({ id, label }: { id: string; label: string }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={72}
        required
        className="min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
      />
    </div>
  );
}
