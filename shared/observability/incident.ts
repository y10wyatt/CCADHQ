export type ClientIncidentSource =
  | "workspace_boundary"
  | "global_boundary"
  | "client_unhandled_error"
  | "client_unhandled_rejection";

export interface ClientIncident {
  incidentKey: string;
  source: ClientIncidentSource;
  route: string;
  digest: string | null;
  deploymentId: string | null;
}

export function createIncidentKey() {
  return crypto.randomUUID();
}

export function getErrorDigest(error: Error & { digest?: string }) {
  return error.digest?.slice(0, 200) ?? null;
}

export async function reportClientIncident(incident: ClientIncident) {
  console.error(
    JSON.stringify({
      level: "error",
      event: "client_incident",
      ...incident,
    }),
  );

  try {
    await fetch("/api/incidents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(incident),
      keepalive: true,
    });
  } catch {
    // Crash reporting must never make the original failure worse.
  }
}
