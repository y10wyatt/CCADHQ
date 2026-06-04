import { describe, expect, it } from "vitest";

import {
  formatAccessDate,
  getInvitationDisplayStatus,
} from "@/features/studio-access/domain/studio-access";

describe("studio access invitations", () => {
  it("shows elapsed pending invitations as expired", () => {
    expect(
      getInvitationDisplayStatus(
        "pending",
        "2026-06-03T12:00:00.000Z",
        Date.parse("2026-06-04T12:00:00.000Z"),
      ),
    ).toBe("expired");
  });

  it("preserves non-pending invitation states", () => {
    expect(
      getInvitationDisplayStatus(
        "revoked",
        "2026-06-03T12:00:00.000Z",
        Date.parse("2026-06-04T12:00:00.000Z"),
      ),
    ).toBe("revoked");
  });

  it("formats dates in the organization timezone", () => {
    expect(
      formatAccessDate("2026-06-04T01:00:00.000Z", "America/Vancouver"),
    ).toBe("Jun 3, 2026");
  });
});
