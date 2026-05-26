// lib/aliases.ts — Anonymous alias generation

const ADJECTIVES = [
  'Silent', 'Hollow', 'Neon', 'Quiet', 'Fading', 'Drifting', 'Lost',
  'Broken', 'Hidden', 'Distant', 'Wandering', 'Restless', 'Tired',
  'Burning', 'Frozen', 'Clouded', 'Bright', 'Dark', 'Shifting', 'Still',
  'Wired', 'Bare', 'Raw', 'Vivid', 'Pale', 'Amber', 'Crimson', 'Violet',
  'Velvet', 'Steel', 'Ashen', 'Cosmic', 'Lunar', 'Solar', 'Phantom',
]

const NOUNS = [
  'Signal', 'Echo', 'Wave', 'Voice', 'Shadow', 'Spark', 'Pulse', 'Void',
  'Drift', 'Current', 'Thread', 'Flame', 'Storm', 'Dust', 'Orbit',
  'Cipher', 'Mind', 'Ghost', 'Trace', 'Ember', 'Shard', 'Veil', 'Tide',
  'Haze', 'Realm', 'Gate', 'Path', 'Prism', 'Vortex', 'Siren', 'Rogue',
  'Nomad', 'Specter', 'Wraith', 'Phantom', 'Pilgrim', 'Wanderer',
]

export function generateAliasSuggestions(count = 6): string[] {
  const suggestions: string[] = []
  const used = new Set<string>()

  while (suggestions.length < count) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    const alias = `${adj}${noun}`
    if (!used.has(alias)) {
      used.add(alias)
      suggestions.push(alias)
    }
  }
  return suggestions
}

export function validateAlias(alias: string): string | null {
  const trimmed = alias.trim()
  if (trimmed.length < 3) return 'Alias must be at least 3 characters'
  if (trimmed.length > 24) return 'Alias must be 24 characters or fewer'
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Only letters, numbers, and underscores allowed'
  return null
}
