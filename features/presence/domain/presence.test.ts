import { describe, expect, it } from "vitest";

import {
  derivePresenceStatus,
  getPresenceLocation,
  normalizePresenceState,
  type PresencePayload,
} from "@/features/presence/domain/presence";

const basePresence: PresencePayload = {
  memberId: "william",
  displayName: "William",
  avatarUrl: null,
  status: "online",
  location: "home",
  focusSessionId: null,
  updatedAt: "2026-06-04T12:00:00.000Z",
  clientId: "client-1",
  version: 1,
};

describe("presence status", () => {
  it("lets running focus and break sessions override away state", () => {
    expect(
      derivePresenceStatus(
        { id: "focus", kind: "focus", state: "running" },
        true,
      ),
    ).toBe("focusing");
    expect(
      derivePresenceStatus(
        { id: "break", kind: "short_break", state: "running" },
        true,
      ),
    ).toBe("break");
  });

  it("treats paused sessions as online or away based on activity", () => {
    expect(
      derivePresenceStatus(
        { id: "focus", kind: "focus", state: "paused" },
        false,
      ),
    ).toBe("online");
    expect(
      derivePresenceStatus(
        { id: "focus", kind: "focus", state: "paused" },
        true,
      ),
    ).toBe("away");
  });
});

describe("presence normalization", () => {
  it("merges multiple clients into one member using status precedence", () => {
    const members = normalizePresenceState({
      first: [basePresence],
      second: [
        {
          ...basePresence,
          status: "focusing",
          location: "focus_room",
          clientId: "client-2",
          updatedAt: "2026-06-04T12:01:00.000Z",
        },
      ],
    });

    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      memberId: "william",
      status: "focusing",
      location: "focus_room",
    });
  });

  it("uses the most recent non-away client for location", () => {
    const members = normalizePresenceState({
      first: [
        {
          ...basePresence,
          status: "away",
          location: "finance",
          updatedAt: "2026-06-04T12:02:00.000Z",
        },
      ],
      second: [
        {
          ...basePresence,
          location: "tasks",
          clientId: "client-2",
          updatedAt: "2026-06-04T12:01:00.000Z",
        },
      ],
    });

    expect(members[0].location).toBe("tasks");
  });

  it("ignores malformed payloads at the realtime boundary", () => {
    expect(
      normalizePresenceState({
        invalid: [{ displayName: "Unknown" }],
        valid: [basePresence],
      }),
    ).toHaveLength(1);
  });
});

describe("presence location", () => {
  it("maps workspace routes into the shared location contract", () => {
    expect(getPresenceLocation("/")).toBe("home");
    expect(getPresenceLocation("/focus-room")).toBe("focus_room");
    expect(getPresenceLocation("/tasks")).toBe("tasks");
    expect(getPresenceLocation("/finance")).toBe("finance");
  });
});
