// app/feed/page.tsx — Main feed (Server Component)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedClient from './FeedClient'
import Navbar from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feed — Unlinked',
  description: 'Anonymous thoughts, confessions, opinions, and micro-stories from people being real.',
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('alias, avatar_seed, trust_score, streak_count, streak_last_at, is_admin, onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_complete) redirect('/onboarding')

  // Get active weekly prompt
  const { data: prompt } = await supabase
    .from('prompts')
    .select('id, text')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div style={{ minHeight: '100dvh' }}>
      <Navbar
        alias={profile.alias}
        avatarSeed={profile.avatar_seed ?? profile.alias}
        isAdmin={profile.is_admin}
      />
      <FeedClient
        currentUserId={user.id}
        currentAlias={profile.alias}
        weeklyPrompt={prompt ?? null}
      />
    </div>
  )
}
