'use client'
// app/admin/AdminDashboard.tsx — Interactive moderation queue

import { useState, useTransition } from 'react'
import { CATEGORY_META } from '@/lib/types'
import Avatar from '@/components/Avatar'

interface FlaggedPost {
  id: string
  content: string
  category: string
  status: string
  report_count: number
  created_at: string
  users: { alias: string; avatar_seed: string } | { alias: string; avatar_seed: string }[]
}

function getUser(post: FlaggedPost): { alias: string; avatar_seed: string } {
  if (Array.isArray(post.users)) return post.users[0] ?? { alias: 'Unknown', avatar_seed: 'unknown' }
  return post.users
}

type ModAction = 'approve' | 'remove' | 'restore'

export default function AdminDashboard({ posts: initialPosts }: { posts: FlaggedPost[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [isPending, startTransition] = useTransition()
  const [actionDone, setActionDone] = useState<Record<string, ModAction>>({})

  function act(postId: string, action: ModAction) {
    startTransition(async () => {
      const statusMap: Record<ModAction, string> = {
        approve: 'live',
        remove: 'removed',
        restore: 'live',
      }
      await fetch('/api/admin/moderate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, action, status: statusMap[action] }),
      })
      setActionDone((prev) => ({ ...prev, [postId]: action }))
      setPosts((prev) => prev.filter((p) => p.id !== postId || action === 'restore'))
    })
  }

  if (posts.length === 0) {
    return (
      <main className="page-shell" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontFamily: 'var(--font-sora)', fontSize: '1.25rem' }}>Moderation queue is clear</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          No flagged posts right now. The community is behaving.
        </p>
      </main>
    )
  }

  return (
    <main className="page-shell" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-sora)', fontSize: '1.5rem', marginBottom: '0.375rem' }}>
          🛡️ Moderation Queue
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          {posts.length} post{posts.length !== 1 ? 's' : ''} flagged or hidden
        </p>
      </div>

      {posts.map((post) => {
        const meta = CATEGORY_META[post.category as keyof typeof CATEGORY_META]
        const done = actionDone[post.id]
        return (
          <div key={post.id} className="glass-card" style={{
            padding: '1.25rem',
            marginBottom: '0.875rem',
            borderLeft: `3px solid ${post.status === 'hidden' ? 'var(--color-brand-coral)' : 'var(--color-cat-hottake)'}`,
            opacity: done ? 0.4 : 1,
            transition: 'opacity 0.3s',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
              <Avatar seed={getUser(post).avatar_seed ?? getUser(post).alias} size={32} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{getUser(post).alias}</span>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.125rem', alignItems: 'center' }}>
                  <span className={`badge ${meta?.badgeClass}`}>{meta?.emoji} {meta?.label}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: post.status === 'hidden' ? 'var(--color-brand-coral)' : 'var(--color-cat-hottake)',
                    textTransform: 'uppercase',
                  }}>
                    {post.status}
                  </span>
                  {post.report_count > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      🚩 {post.report_count} report{post.report_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p style={{
              fontSize: '0.9375rem',
              lineHeight: 1.65,
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
              padding: '0.75rem',
              background: 'var(--color-bg-elevated)',
              borderRadius: '10px',
              border: '1px solid var(--color-border-subtle)',
            }}>
              {post.content}
            </p>

            {done ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                ✓ Marked as {done}
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  id={`approve-${post.id}`}
                  onClick={() => act(post.id, 'approve')}
                  disabled={isPending}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(52,211,153,0.4)',
                    background: 'rgba(52,211,153,0.1)',
                    color: '#34D399',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  ✓ Approve
                </button>
                <button
                  id={`remove-${post.id}`}
                  onClick={() => act(post.id, 'remove')}
                  disabled={isPending}
                  className="btn-danger"
                  style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                >
                  ✕ Remove
                </button>
                {post.status === 'hidden' && (
                  <button
                    id={`restore-${post.id}`}
                    onClick={() => act(post.id, 'restore')}
                    disabled={isPending}
                    className="btn-ghost"
                    style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                  >
                    ↑ Restore
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </main>
  )
}
