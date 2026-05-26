export interface ModerationPrediction {
  score: number
  triggeredAttributes: string[]
}

const MODEL_VERSION = 'local-linear-v1'

const HARD_BLOCK_PATTERNS: Array<{ pattern: RegExp; attribute: string }> = [
  { pattern: /\b(kill yourself|kys)\b/i, attribute: 'SELF_HARM_ENCOURAGEMENT' },
  { pattern: /\b(rape|molest)\b/i, attribute: 'SEXUAL_VIOLENCE' },
  { pattern: /child.?(porn|sex|abuse)/i, attribute: 'CHILD_SAFETY' },
  { pattern: /\b(doxx|address is|phone number is)\b/i, attribute: 'PRIVATE_INFO' },
]

const TOKEN_WEIGHTS: Record<string, number> = {
  idiot: 0.9,
  stupid: 0.7,
  moron: 0.85,
  loser: 0.75,
  worthless: 1.15,
  pathetic: 0.8,
  disgusting: 0.75,
  ugly: 0.7,
  dumb: 0.55,
  retard: 1.35,
  die: 1.0,
  hate: 0.55,
  threat: 0.7,
  scam: 0.5,
  fraud: 0.55,
}

const PHRASE_WEIGHTS: Array<{ phrase: string; weight: number; attribute: string }> = [
  { phrase: 'hate you', weight: 1.15, attribute: 'TOXICITY' },
  { phrase: 'go die', weight: 1.35, attribute: 'HARASSMENT' },
  { phrase: 'real name', weight: 0.75, attribute: 'PRIVACY_RISK' },
  { phrase: 'phone number', weight: 0.85, attribute: 'PRIVACY_RISK' },
  { phrase: 'home address', weight: 1.0, attribute: 'PRIVACY_RISK' },
]

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value))
}

function tokenize(content: string): string[] {
  return content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function classifyModerationRisk(content: string): ModerationPrediction {
  const normalized = content.trim().toLowerCase()
  const triggered = new Set<string>()

  for (const { pattern, attribute } of HARD_BLOCK_PATTERNS) {
    if (pattern.test(content)) {
      return {
        score: 0.96,
        triggeredAttributes: [attribute, 'SEVERE_TOXICITY', MODEL_VERSION],
      }
    }
  }

  const tokens = tokenize(content)
  let weightedSum = -2.2

  for (const token of tokens) {
    const weight = TOKEN_WEIGHTS[token]
    if (weight) {
      weightedSum += weight
      triggered.add(token === 'retard' ? 'IDENTITY_ATTACK' : 'TOXICITY')
    }
  }

  for (const { phrase, weight, attribute } of PHRASE_WEIGHTS) {
    if (normalized.includes(phrase)) {
      weightedSum += weight
      triggered.add(attribute)
    }
  }

  const uppercaseRatio = content.length > 8
    ? (content.match(/[A-Z]/g)?.length ?? 0) / content.length
    : 0

  if (uppercaseRatio > 0.45) {
    weightedSum += 0.45
    triggered.add('AGGRESSIVE_TONE')
  }

  if (/[!?]{3,}/.test(content)) {
    weightedSum += 0.25
    triggered.add('AGGRESSIVE_TONE')
  }

  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(content) || /\b\d{10,}\b/.test(content)) {
    weightedSum += 1.1
    triggered.add('PRIVATE_INFO')
  }

  const score = Number(sigmoid(weightedSum).toFixed(3))
  return {
    score,
    triggeredAttributes: [...triggered, MODEL_VERSION],
  }
}
