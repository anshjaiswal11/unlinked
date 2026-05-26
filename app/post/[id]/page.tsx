// app/post/[id]/page.tsx — Single post view
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Post } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'

interface PageParams {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('content, category')
    .eq('id', id)
    .single()

  if (!post) return { title: 'Post — Unlinked' }

  const preview = post.content.slice(0, 120) + (post.content.length > 120 ? '...' : '')
  return {
    title: `${preview} — Unlinked`,
    description: 'Read this anonymous post on Unlinked. You have one too. Say it.',
    openGraph: {
      title: preview,
      description: 'You have one too. Say it. → unlinked.app',
    },
  }
}

export default async function PostPage({ params }: PageParams) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('alias, avatar_seed, is_admin')
    .eq('id', user.id)
    .single()

  // Fetch post with reactions
  const { data: postData, error } = await supabase
    .from('posts')
    .select(`
      id, user_id, content, category, visibility_weight, report_count, status, created_at, trust_score_at_post,
      users!inner(alias, avatar_seed)
    `)
    .eq('id', id)
    .single()

  if (error || !postData) notFound()
  if (postData.status === 'removed') notFound()

  // Get reaction counts
  const { data: reactions } = await supabase
    .from('reactions')
    .select('type')
    .eq('post_id', id)

  const reactionCounts = {
    relatable: reactions?.filter((r) => r.type === 'relatable').length ?? 0,
    insightful: reactions?.filter((r) => r.type === 'insightful').length ?? 0,
    respect: reactions?.filter((r) => r.type === 'respect').length ?? 0,
  }

  // Get user's own reaction
  const { data: userReaction } = await supabase
    .from('reactions')
    .select('type')
    .eq('post_id', id)
    .eq('user_id', user.id)
    .single()

  const usersArr = postData.users as { alias: string; avatar_seed: string }[] | { alias: string; avatar_seed: string }
  const userInfo = Array.isArray(usersArr) ? usersArr[0] : usersArr

  const post = {
    ...postData,
    category: postData.category as Post['category'],
    alias: userInfo?.alias ?? 'Anonymous',
    reaction_counts: reactionCounts,
    user_reaction: (userReaction?.type as Post['user_reaction']) ?? null,
  } as Post

  const meta = CATEGORY_META[post.category]

  return (
    <div style={{ minHeight: '100dvh' }}>
      <Navbar
        alias={profile?.alias}
        avatarSeed={profile?.avatar_seed ?? profile?.alias}
        isAdmin={profile?.is_admin}
      />
      <main className="page-shell">
        {/* Back nav */}
        <Link
          href="/feed"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            transition: 'color 0.2s',
          }}
        >
          ← Feed
        </Link>

        {/* Full post */}
        <div className="glass-card animate-fade-in-up" style={{ padding: '1.5rem', opacity: 0, marginBottom: '1rem' }}>
          {/* Category + timestamp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
            <span className={`badge ${meta.badgeClass}`}>{meta.emoji} {meta.label}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {new Date(post.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>

          {/* Full content — no line clamp */}
          <p style={{
            fontSize: '1.125rem',
            lineHeight: 1.75,
            color: 'var(--color-text-primary)',
            whiteSpace: 'pre-wrap',
            marginBottom: '1.5rem',
          }}>
            {post.content}
          </p>

          {/* Post card reactions */}
          <PostCard post={post} currentUserId={user.id} />
        </div>

        {/* Share CTA */}
        <div style={{
          padding: '1.25rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(124,109,250,0.08), rgba(255,107,107,0.06))',
          borderRadius: '14px',
          border: '1px solid var(--color-border-subtle)',
        }}>
          <p style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, marginBottom: '0.25rem', fontSize: '1rem' }}>
            You have one too.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Say it anonymously on Unlinked.
          </p>
          <Link href="/post/new" className="btn-primary" style={{ display: 'inline-flex' }}>
            ✍️ Say it
          </Link>
        </div>
      </main>
    </div>
  )
}
