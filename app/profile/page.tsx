// app/profile/page.tsx — Private user profile
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Avatar from '@/components/Avatar'
import StreakBanner from '@/components/StreakBanner'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { CATEGORY_META } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Profile — Unlinked',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('alias, avatar_seed, trust_score, streak_count, streak_last_at, is_admin, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, category, created_at, status, report_count, reactions(type)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const totalReactions = posts?.reduce((acc, p) => acc + (p.reactions?.length ?? 0), 0) ?? 0
  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div style={{ minHeight: '100dvh' }}>
      <Navbar alias={profile.alias} avatarSeed={profile.avatar_seed ?? profile.alias} isAdmin={profile.is_admin} />

      <main className="page-shell">
        {/* Profile header */}
        <div className="glass-card animate-fade-in-up" style={{ padding: '1.5rem', marginBottom: '1rem', opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <Avatar seed={profile.avatar_seed ?? profile.alias} size={72} showRing />
            <div>
              <h1 style={{ fontFamily: 'var(--font-sora)', fontSize: '1.5rem', margin: '0 0 0.25rem' }}>
                {profile.alias}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                Joined {joinedDate}
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>
                🔒 Anonymous to everyone else
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Posts', value: posts?.length ?? 0, emoji: '📝' },
              { label: 'Reactions', value: totalReactions, emoji: '✨' },
              { label: 'Streak', value: `${profile.streak_count}d`, emoji: '🔥' },
            ].map((stat) => (
              <div key={stat.label} style={{
                padding: '0.875rem',
                background: 'var(--color-bg-elevated)',
                borderRadius: '12px',
                border: '1px solid var(--color-border-subtle)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{stat.emoji}</div>
                <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak */}
        <div style={{ marginBottom: '1rem', animationDelay: '60ms' }} className="animate-fade-in-up">
          <StreakBanner streakCount={profile.streak_count} streakLastAt={profile.streak_last_at} />
        </div>

        {/* Post history */}
        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-sora)', fontSize: '1rem', marginBottom: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Your posts
          </h2>

          {(!posts || posts.length === 0) && (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌱</div>
              <p>Nothing posted yet. Share your first thought.</p>
              <Link href="/post/new" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                ✍️ Post now
              </Link>
            </div>
          )}

          {posts?.map((post) => {
            const meta = CATEGORY_META[post.category as keyof typeof CATEGORY_META]
            const reactionCount = post.reactions?.length ?? 0
            return (
              <Link key={post.id} href={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
                <div className="glass-card" style={{
                  padding: '1rem',
                  marginBottom: '0.625rem',
                  cursor: 'pointer',
                  opacity: post.status !== 'live' ? 0.5 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className={`badge ${meta.badgeClass}`}>{meta.emoji} {meta.label}</span>
                    {post.status !== 'live' && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-brand-coral)', fontWeight: 600 }}>
                        {post.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: '0 0 0.625rem',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    color: 'var(--color-text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {post.content}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    <span>✨ {reactionCount}</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Sign out */}
        <form action="/api/auth/signout" method="post" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link
            href="/api/auth/signout"
            className="btn-ghost"
            style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}
          >
            Sign out
          </Link>
        </form>
      </main>
    </div>
  )
}
