import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { Card } from "@/shared/ui/card";

export default function AuthErrorPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <CircleAlert className="mx-auto size-8 text-danger" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold">
          Authentication link unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The confirmation or recovery link may have expired or already been
          used. Return to sign in and request a new one.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground"
        >
          Return to sign in
        </Link>
      </Card>
    </main>
  );
}
