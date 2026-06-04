import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createIncidentKey,
  getErrorDigest,
} from "@/shared/observability/incident";
import { logServerIncident } from "@/shared/observability/server-logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("incident helpers", () => {
  it("creates UUID incident keys", () => {
    expect(createIncidentKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("limits error digests before persistence", () => {
    const error = Object.assign(new Error("Hidden detail"), {
      digest: "x".repeat(250),
    });

    expect(getErrorDigest(error)).toHaveLength(200);
  });

  it("writes structured server incidents without request data", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    logServerIncident(new Error("Database unavailable"), {
      incidentKey: "incident-id",
      route: "/studio-xp",
      method: "GET",
      routeType: "render",
    });

    const logged = JSON.parse(String(consoleError.mock.calls[0]?.[0]));
    expect(logged).toMatchObject({
      level: "error",
      event: "server_incident",
      incidentKey: "incident-id",
      route: "/studio-xp",
      errorMessage: "Database unavailable",
    });
    expect(logged).not.toHaveProperty("headers");
    expect(logged).not.toHaveProperty("body");
  });
});
