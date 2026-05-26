// lib/avatar.ts — DiceBear avatar utilities
// Avatars are deterministic from alias — same alias always gets same avatar
// Using the 'bottts-neutral' style for a geometric, non-human look that preserves anonymity

export const AVATAR_STYLE = 'bottts-neutral'

export function getAvatarUrl(seed: string, size: number = 80): string {
  const params = new URLSearchParams({
    seed,
    size: String(size),
    backgroundColor: '0a0a14',
    backgroundType: 'solid',
  })
  return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?${params}`
}

export function getAvatarFallbackColor(seed: string): string {
  // Generate a consistent color from the seed string
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    '#7C6DFA', '#FF6B6B', '#30C9FF', '#FFB830',
    '#A78BFA', '#F472B6', '#34D399', '#FB923C',
  ]
  return colors[Math.abs(hash) % colors.length]
}
