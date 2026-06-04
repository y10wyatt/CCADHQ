import type { Instrumentation } from "next";

import { logServerIncident } from "@/shared/observability/server-logger";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  logServerIncident(error, {
    incidentKey: crypto.randomUUID(),
    route: context.routePath || request.path,
    method: request.method,
    routeType: context.routeType,
  });
};
