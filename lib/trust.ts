// lib/trust.ts — Trust Score computation logic

export const TRUST_EVENTS = {
  POST_LIVE: 0.5,
  POST_10_REACTIONS: 1.0,
  REPORT_CONFIRMED_ON_POST: -5.0,
  REPORT_CONFIRMED_BY_USER: 1.0,
  REPORT_DISMISSED: -0.5,
  STREAK_7_DAYS: 2.0,
  POST_AI_FLAGGED: -1.0,
  ACCOUNT_ANOMALY: -10.0,
} as const

export const TRUST_DEFAULTS = {
  INITIAL: 50,
  MIN: 0,
  MAX: 100,
}

/** Convert trust score → visibility weight (0.1 – 1.5) */
export function trustToVisibilityWeight(trustScore: number): number {
  // Low trust = near-zero visibility, high trust = amplified
  const normalized = Math.max(0, Math.min(100, trustScore)) / 100
  // Non-linear: below 20 gets heavily suppressed
  if (normalized < 0.2) return normalized * 0.5
  if (normalized > 0.8) return 0.8 + (normalized - 0.8) * 3.5
  return normalized
}

/** Trust gates */
export function canComment(trustScore: number): boolean {
  return trustScore >= 20
}

export function getCharacterLimit(trustScore: number): number {
  return trustScore >= 70 ? 1000 : 500
}

export function getTrustLevel(score: number): {
  label: string
  color: string
  description: string
} {
  if (score >= 80) return { label: 'Trusted', color: '#30C9FF', description: 'High visibility, expanded features' }
  if (score >= 50) return { label: 'Member', color: '#7C6DFA', description: 'Standard visibility' }
  if (score >= 20) return { label: 'New', color: '#FFB830', description: 'Building credibility' }
  return { label: 'Restricted', color: '#FF6B6B', description: 'Limited reach' }
}
