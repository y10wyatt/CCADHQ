import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { signOut } from "@/features/auth/application/actions";
import { createServerSupabaseClient } from "@/shared/database/supabase/server";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export default async function AccessPendingPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-lg text-center">
        <ShieldAlert
          className="mx-auto size-8 text-warning"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-2xl font-semibold">Membership not active</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your account is authenticated, but it does not have an active CCAD
          membership. An administrator can add or restore your invitation.
        </p>
        <form action={signOut} className="mt-6">
          <Button variant="secondary" type="submit">
            Sign out
          </Button>
        </form>
      </Card>
    </main>
  );
}
