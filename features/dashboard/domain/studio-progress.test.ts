import { describe, expect, it } from "vitest";

import {
  getLevelThreshold,
  getStudioProgress,
} from "@/features/dashboard/domain/studio-progress";

describe("studio progress", () => {
  it("uses the approved quadratic level thresholds", () => {
    expect([1, 2, 3, 4, 5].map(getLevelThreshold)).toEqual([
      0, 100, 400, 900, 1600,
    ]);
  });

  it("reports progress within the current studio level", () => {
    expect(getStudioProgress(640)).toEqual({
      level: 3,
      totalXp: 640,
      xpToNextLevel: 260,
      progressPercent: 48,
    });
  });

  it("clamps negative corrections at zero for display", () => {
    expect(getStudioProgress(-10)).toEqual({
      level: 1,
      totalXp: 0,
      xpToNextLevel: 100,
      progressPercent: 0,
    });
  });
});
