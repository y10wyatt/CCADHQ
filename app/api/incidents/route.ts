import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/shared/database/supabase/server";

const incidentSchema = z.object({
  incidentKey: z.string().uuid(),
  source: z.enum([
    "workspace_boundary",
    "global_boundary",
    "client_unhandled_error",
    "client_unhandled_rejection",
  ]),
  route: z.string().trim().min(1).max(300),
  digest: z.string().trim().max(200).nullable(),
  deploymentId: z.string().trim().max(200).nullable(),
});

export async function POST(request: Request) {
  const parsed = incidentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("record_application_incident", {
    target_incident_key: parsed.data.incidentKey,
    incident_source: parsed.data.source,
    incident_route: parsed.data.route,
    incident_digest: parsed.data.digest,
    incident_deployment_id: parsed.data.deploymentId,
  });

  return NextResponse.json(
    { ok: !error },
    { status: error ? 401 : 202 },
  );
}
