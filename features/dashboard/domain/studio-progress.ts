export interface StudioProgress {
  level: number;
  totalXp: number;
  xpToNextLevel: number;
  progressPercent: number;
}

export function getStudioProgress(totalXp: number): StudioProgress {
  const safeTotalXp = Math.max(0, Math.trunc(totalXp));
  const level = Math.floor(Math.sqrt(safeTotalXp / 100)) + 1;
  const currentThreshold = getLevelThreshold(level);
  const nextThreshold = getLevelThreshold(level + 1);
  const levelSpan = nextThreshold - currentThreshold;
  const progressWithinLevel = safeTotalXp - currentThreshold;

  return {
    level,
    totalXp: safeTotalXp,
    xpToNextLevel: nextThreshold - safeTotalXp,
    progressPercent: Math.floor((progressWithinLevel / levelSpan) * 100),
  };
}

export function getLevelThreshold(level: number): number {
  const safeLevel = Math.max(1, Math.trunc(level));
  return 100 * (safeLevel - 1) ** 2;
}
