'use server'
// app/api/posts/route.ts — Post CRUD

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { trustToVisibilityWeight, TRUST_DEFAULTS } from '@/lib/trust'
import { updateStreakAfterPost } from '@/lib/streaks'
import type { PostCategory } from '@/lib/types'

// GET /api/posts — paginated, trust-weighted feed
export async function GET(req: NextRequest): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const url = new URL(req.url)
  const category = url.searchParams.get('category') || null
  const page = parseInt(url.searchParams.get('page') ?? '0', 10)
  const pageSize = 15

  let query = supabase
    .from('posts')
    .select(`
      id, content, category, visibility_weight, report_count, status, created_at,
      users!inner(alias, avatar_seed),
      reactions(type, user_id)
    `)
    .eq('status', 'live')
    .order('visibility_weight', { ascending: false })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const posts = (data ?? []).map((post) => {
    const userInfo = Array.isArray(post.users) ? post.users[0] : post.users
    const reactionCounts = {
      relatable: post.reactions?.filter((reaction) => reaction.type === 'relatable').length ?? 0,
      insightful: post.reactions?.filter((reaction) => reaction.type === 'insightful').length ?? 0,
      respect: post.reactions?.filter((reaction) => reaction.type === 'respect').length ?? 0,
    }
    const userReaction = user
      ? post.reactions?.find((reaction) => reaction.user_id === user.id)?.type ?? null
      : null

    return {
      ...post,
      alias: userInfo?.alias ?? 'Anonymous',
      reaction_counts: reactionCounts,
      user_reaction: userReaction,
      users: undefined,
      reactions: undefined,
    }
  })

  return Response.json({ posts, page, pageSize })
}

// POST /api/posts — create new post
export async function POST(req: NextRequest): Promise<Response> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { content, category, prompt_id } = body as {
    content: string
    category: PostCategory
    prompt_id?: string
  }

  if (!content || content.trim().length < 5) {
    return Response.json({ error: 'Content too short' }, { status: 400 })
  }
  if (!['confession', 'opinion', 'story', 'hottake'].includes(category)) {
    return Response.json({ error: 'Invalid category' }, { status: 400 })
  }

  // Get user's current trust score
  const { data: profile } = await supabase
    .from('users')
    .select('trust_score, streak_count, streak_last_at')
    .eq('id', user.id)
    .single()

  const trustScore = profile?.trust_score ?? TRUST_DEFAULTS.INITIAL
  const visibilityWeight = trustToVisibilityWeight(trustScore)

  // Insert post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content: content.trim(),
      category,
      trust_score_at_post: trustScore,
      visibility_weight: visibilityWeight,
      status: 'live',
      prompt_id: prompt_id ?? null,
    })
    .select()
    .single()

  if (postError) {
    return Response.json({ error: postError.message }, { status: 500 })
  }

  // Update streak
  const { newStreak, hitMilestone } = updateStreakAfterPost(
    profile?.streak_count ?? 0,
    profile?.streak_last_at ?? null
  )

  await supabase
    .from('users')
    .update({
      streak_count: newStreak,
      streak_last_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  // Log trust event — post went live
  await supabase.from('trust_events').insert({
    user_id: user.id,
    event_type: 'POST_LIVE',
    delta: 0.5,
  })

  // If streak milestone hit — trust bonus
  if (hitMilestone) {
    await supabase.from('trust_events').insert({
      user_id: user.id,
      event_type: `STREAK_${hitMilestone}_DAYS`,
      delta: 2.0,
    })
    await supabase.rpc('update_trust_score', { p_user_id: user.id, p_delta: 2.0 })
  }

  await supabase.rpc('update_trust_score', { p_user_id: user.id, p_delta: 0.5 })

  return Response.json({ post, hitMilestone, newStreak }, { status: 201 })
}
