"use client";

import { useEffect } from "react";

import {
  createIncidentKey,
  getErrorDigest,
  reportClientIncident,
} from "@/shared/observability/incident";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportClientIncident({
      incidentKey: createIncidentKey(),
      source: "workspace_boundary",
      route: window.location.pathname,
      digest: getErrorDigest(error),
      deploymentId: process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID ?? null,
    });
  }, [error]);

  return (
    <Card className="max-w-xl">
      <h1 className="text-2xl font-semibold">The workspace could not load</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        The saved data is still intact and the incident was recorded. Try
        loading the workspace again.
      </p>
      {error.digest && (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
