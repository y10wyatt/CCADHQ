import { describe, expect, it } from "vitest";

import type { PresenceMember } from "@/features/presence/domain/presence";
import {
  buildPixelOfficeScene,
  pixelOfficeZoneLabel,
} from "@/features/pixel-office/domain/pixel-office";

const baseMember: PresenceMember = {
  memberId: "william",
  displayName: "William",
  avatarUrl: null,
  status: "online",
  location: "home",
  updatedAt: "2026-06-04T12:00:00.000Z",
};

describe("pixel office scene", () => {
  it("maps normalized presence status into visual zones", () => {
    const occupants = buildPixelOfficeScene([
      baseMember,
      {
        ...baseMember,
        memberId: "alice",
        displayName: "Alice",
        status: "focusing",
      },
    ]);

    expect(occupants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memberId: "alice", zone: "workstation" }),
        expect.objectContaining({ memberId: "william", zone: "open_studio" }),
      ]),
    );
  });

  it("assigns stable separate slots to members in the same zone", () => {
    const occupants = buildPixelOfficeScene([
      baseMember,
      { ...baseMember, memberId: "alice", displayName: "Alice" },
    ]);

    expect(occupants[0].memberId).toBe("alice");
    expect(occupants[0].leftPercent).not.toBe(occupants[1].leftPercent);
  });

  it("provides text equivalents for every visual zone", () => {
    expect(pixelOfficeZoneLabel("workstation")).toBe("At a workstation");
    expect(pixelOfficeZoneLabel("break_area")).toBe("In the break area");
    expect(pixelOfficeZoneLabel("open_studio")).toBe("In the open studio");
    expect(pixelOfficeZoneLabel("quiet_corner")).toBe("In a quiet corner");
  });
});
