import Image from "next/image";
import { Mail } from "lucide-react";

import { requestMagicLink } from "@/features/auth/application/actions";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const error = typeof params.error === "string" ? params.error : null;

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
            Sign in to CCAD HQ
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Enter an invited staff email address. We will send a one-time magic
            link; public account creation is disabled.
          </p>

          {sent && (
            <p className="mt-5 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
              Check your email for a sign-in link.
            </p>
          )}
          {error && (
            <p className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              We could not send a sign-in link. Confirm the address is invited
              and try again.
            </p>
          )}

          <form action={requestMagicLink} className="mt-6 grid gap-4">
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
            <Button type="submit">
              <Mail aria-hidden="true" />
              Send magic link
            </Button>
          </form>
        </div>
      </Card>
    </main>
  );
}
