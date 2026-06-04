import {
  createIncidentKey,
  reportClientIncident,
} from "@/shared/observability/incident";

window.addEventListener("error", () => {
  void reportClientIncident({
    incidentKey: createIncidentKey(),
    source: "client_unhandled_error",
    route: window.location.pathname,
    digest: null,
    deploymentId: process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID ?? null,
  });
});

window.addEventListener("unhandledrejection", () => {
  void reportClientIncident({
    incidentKey: createIncidentKey(),
    source: "client_unhandled_rejection",
    route: window.location.pathname,
    digest: null,
    deploymentId: process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID ?? null,
  });
});
