// lib/types.ts — Shared TypeScript types for Unlinked

export type PostCategory = 'confession' | 'opinion' | 'story' | 'hottake'

export interface Post {
  id: string
  user_id: string
  content: string
  category: PostCategory
  trust_score_at_post: number
  visibility_weight: number
  report_count: number
  status: 'live' | 'hidden' | 'removed'
  created_at: string
  // joined
  alias?: string
  reaction_counts?: ReactionCounts
  user_reaction?: ReactionType | null
}

export type ReactionType = 'relatable' | 'insightful' | 'respect'

export interface ReactionCounts {
  relatable: number
  insightful: number
  respect: number
}

export interface UserProfile {
  id: string
  alias: string
  avatar_seed: string
  trust_score: number
  streak_count: number
  streak_last_at: string | null
  is_admin: boolean
  created_at: string
}

export interface TrustEvent {
  id: string
  user_id: string
  event_type: string
  delta: number
  created_at: string
}

export interface WeeklyPrompt {
  id: string
  text: string
  week_of: string
  active: boolean
}

export interface Report {
  id: string
  post_id: string
  reporter_id: string
  reason: ReportReason
  created_at: string
}

export type ReportReason =
  | 'harassment'
  | 'real_person_named'
  | 'spam'
  | 'harmful_content'
  | 'legal_violation'

export const CATEGORY_META: Record<PostCategory, {
  label: string
  emoji: string
  badgeClass: string
  color: string
}> = {
  confession: {
    label: 'Confession',
    emoji: '🤫',
    badgeClass: 'badge-confession',
    color: '#FF6B6B',
  },
  opinion: {
    label: 'Opinion',
    emoji: '💬',
    badgeClass: 'badge-opinion',
    color: '#7C6DFA',
  },
  story: {
    label: 'Story',
    emoji: '📖',
    badgeClass: 'badge-story',
    color: '#30C9FF',
  },
  hottake: {
    label: 'Hot Take',
    emoji: '🔥',
    badgeClass: 'badge-hottake',
    color: '#FFB830',
  },
}

export const REACTION_META: Record<ReactionType, { label: string; emoji: string }> = {
  relatable: { label: 'Relatable', emoji: '🫂' },
  insightful: { label: 'Insightful', emoji: '💡' },
  respect: { label: 'Respect', emoji: '🫡' },
}
