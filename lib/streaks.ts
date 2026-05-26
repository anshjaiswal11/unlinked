// lib/streaks.ts — Streak computation logic

export const STREAK_MILESTONES = [7, 14, 30, 60, 90] as const

export interface StreakStatus {
  count: number
  isActive: boolean
  hoursUntilExpiry: number | null
  nextMilestone: number | null
  hitMilestone: number | null
}

export function computeStreakStatus(
  currentStreak: number,
  lastPostedAt: string | null
): StreakStatus {
  if (!lastPostedAt) {
    return {
      count: 0,
      isActive: false,
      hoursUntilExpiry: null,
      nextMilestone: 7,
      hitMilestone: null,
    }
  }

  const now = Date.now()
  const last = new Date(lastPostedAt).getTime()
  const hoursSinceLast = (now - last) / (1000 * 60 * 60)

  const isActive = hoursSinceLast <= 48
  const hoursUntilExpiry = isActive ? Math.round(48 - hoursSinceLast) : null
  const nextMilestone = STREAK_MILESTONES.find((m) => m > currentStreak) ?? null

  return {
    count: currentStreak,
    isActive,
    hoursUntilExpiry,
    nextMilestone,
    hitMilestone: null,
  }
}

export function updateStreakAfterPost(
  currentStreak: number,
  lastPostedAt: string | null
): { newStreak: number; hitMilestone: number | null } {
  const now = Date.now()

  if (!lastPostedAt) {
    return { newStreak: 1, hitMilestone: null }
  }

  const last = new Date(lastPostedAt).getTime()
  const hoursSinceLast = (now - last) / (1000 * 60 * 60)

  // Already posted today (< 20h) — don't increment, just maintain
  if (hoursSinceLast < 20) {
    return { newStreak: currentStreak, hitMilestone: null }
  }

  // Within window (20–48h) — increment
  if (hoursSinceLast <= 48) {
    const newStreak = currentStreak + 1
    const hitMilestone = (STREAK_MILESTONES as readonly number[]).includes(newStreak)
      ? newStreak
      : null
    return { newStreak, hitMilestone }
  }

  // Expired — reset
  return { newStreak: 1, hitMilestone: null }
}
