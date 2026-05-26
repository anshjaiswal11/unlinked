'use server'
// app/api/react/route.ts — Reactions (relatable / insightful / respect)

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { ReactionType } from '@/lib/types'

export async function POST(req: NextRequest): Promise<Response> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { post_id, type } = await req.json() as { post_id: string; type: ReactionType }

  if (!['relatable', 'insightful', 'respect'].includes(type)) {
    return Response.json({ error: 'Invalid reaction type' }, { status: 400 })
  }

  // Check for existing reaction on this post
  const { data: existing } = await supabase
    .from('reactions')
    .select('id, type')
    .eq('post_id', post_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    if (existing.type === type) {
      // Toggle off
      await supabase.from('reactions').delete().eq('id', existing.id)
      return Response.json({ action: 'removed', type: null })
    } else {
      // Switch reaction
      await supabase.from('reactions').update({ type }).eq('id', existing.id)
      return Response.json({ action: 'switched', type })
    }
  }

  // New reaction
  await supabase.from('reactions').insert({ post_id, user_id: user.id, type })

  // Check if post now has 10 reactions — trust bonus
  const { count } = await supabase
    .from('reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post_id)

  if (count === 10) {
    // Get post owner
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', post_id)
      .single()

    if (post?.user_id) {
      await supabase.from('trust_events').insert({
        user_id: post.user_id,
        event_type: 'POST_10_REACTIONS',
        delta: 1.0,
      })
      await supabase.rpc('update_trust_score', {
        p_user_id: post.user_id,
        p_delta: 1.0,
      })
    }
  }

  return Response.json({ action: 'added', type })
}
