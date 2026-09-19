// Campora — Pure Attendance Calculation Utilities
// Independent of frontend context/aliases so it can be shared with the AI backend

export function calcCanMiss(present: number, total: number, target: number): number {
  if (total === 0 || target === 0) return total;
  const canMiss = Math.floor((present * 100 - target * total) / target);
  return Math.max(0, canMiss);
}
