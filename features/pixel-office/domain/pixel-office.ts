import type {
  PresenceMember,
  PresenceStatus,
} from "@/features/presence/domain/presence";

export type PixelOfficeZone =
  | "workstation"
  | "break_area"
  | "open_studio"
  | "quiet_corner";

export interface PixelOfficeOccupant extends PresenceMember {
  zone: PixelOfficeZone;
  leftPercent: number;
  topPercent: number;
}

interface PixelOfficeSlot {
  leftPercent: number;
  topPercent: number;
}

const zoneByStatus: Record<PresenceStatus, PixelOfficeZone> = {
  focusing: "workstation",
  break: "break_area",
  online: "open_studio",
  away: "quiet_corner",
};

const slotsByZone: Record<PixelOfficeZone, PixelOfficeSlot[]> = {
  workstation: [
    { leftPercent: 25, topPercent: 55 },
    { leftPercent: 70, topPercent: 55 },
    { leftPercent: 35, topPercent: 61 },
    { leftPercent: 60, topPercent: 61 },
  ],
  break_area: [
    { leftPercent: 48, topPercent: 67 },
    { leftPercent: 56, topPercent: 70 },
    { leftPercent: 42, topPercent: 73 },
    { leftPercent: 64, topPercent: 76 },
  ],
  open_studio: [
    { leftPercent: 20, topPercent: 78 },
    { leftPercent: 32, topPercent: 83 },
    { leftPercent: 68, topPercent: 83 },
    { leftPercent: 80, topPercent: 78 },
  ],
  quiet_corner: [
    { leftPercent: 12, topPercent: 40 },
    { leftPercent: 88, topPercent: 40 },
    { leftPercent: 12, topPercent: 68 },
    { leftPercent: 88, topPercent: 68 },
  ],
};

export function buildPixelOfficeScene(
  members: PresenceMember[],
): PixelOfficeOccupant[] {
  const zoneCounts = new Map<PixelOfficeZone, number>();

  return [...members]
    .sort((left, right) => left.memberId.localeCompare(right.memberId))
    .map((member) => {
      const zone = zoneByStatus[member.status];
      const zoneCount = zoneCounts.get(zone) ?? 0;
      const slots = slotsByZone[zone];
      const slot = slots[zoneCount % slots.length];
      const overflowRow = Math.floor(zoneCount / slots.length);
      zoneCounts.set(zone, zoneCount + 1);

      return {
        ...member,
        zone,
        leftPercent: slot.leftPercent,
        topPercent: Math.min(slot.topPercent + overflowRow * 5, 90),
      };
    });
}

export function pixelOfficeZoneLabel(zone: PixelOfficeZone) {
  const labels: Record<PixelOfficeZone, string> = {
    workstation: "At a workstation",
    break_area: "In the break area",
    open_studio: "In the open studio",
    quiet_corner: "In a quiet corner",
  };

  return labels[zone];
}
