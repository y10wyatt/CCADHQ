interface ServerIncidentContext {
  incidentKey: string;
  route: string;
  method: string;
  routeType: string;
}

export function logServerIncident(
  error: unknown,
  context: ServerIncidentContext,
) {
  const normalized = normalizeError(error);

  console.error(
    JSON.stringify({
      level: "error",
      event: "server_incident",
      ...context,
      errorName: normalized.name,
      errorMessage: normalized.message,
      stack: normalized.stack,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    }),
  );
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    name: "UnknownError",
    message: "A non-Error value was thrown.",
    stack: null,
  };
}
