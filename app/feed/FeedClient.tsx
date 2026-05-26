'use client'
// app/feed/FeedClient.tsx — Interactive feed with category filter + infinite scroll

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import type { Post, PostCategory } from '@/lib/types'
import { CATEGORY_META } from '@/lib/types'

interface FeedClientProps {
  currentUserId: string
  currentAlias: string
  weeklyPrompt: { id: string; text: string } | null
}

const CATEGORIES: { value: PostCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '✨' },
  { value: 'confession', label: 'Confessions', emoji: '🤫' },
  { value: 'opinion', label: 'Opinions', emoji: '💬' },
  { value: 'story', label: 'Stories', emoji: '📖' },
  { value: 'hottake', label: 'Hot Takes', emoji: '🔥' },
]

export default function FeedClient({ currentUserId, currentAlias, weeklyPrompt }: FeedClientProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState<PostCategory | 'all'>('all')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [promptDismissed, setPromptDismissed] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async (cat: PostCategory | 'all', p: number, reset: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (cat !== 'all') params.set('category', cat)
      const res = await fetch(`/api/posts?${params}`)
      const data = await res.json()
      const newPosts: Post[] = data.posts ?? []
      setPosts((prev) => reset ? newPosts : [...prev, ...newPosts])
      setHasMore(newPosts.length === 15)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    setPage(0)
    setPosts([])
    fetchPosts(category, 0, true)
  }, [category, fetchPosts])

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPosts(category, nextPage, false)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [loading, hasMore, page, category, fetchPosts])

  // Check prompt dismissed in session
  useEffect(() => {
    setPromptDismissed(sessionStorage.getItem('promptDismissed') === '1')
  }, [])

  function dismissPrompt() {
    sessionStorage.setItem('promptDismissed', '1')
    setPromptDismissed(true)
  }

  return (
    <main className="page-shell">
      {/* Weekly Prompt Banner */}
      {weeklyPrompt && !promptDismissed && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(124,109,250,0.15), rgba(48,201,255,0.08))',
          borderRadius: '14px',
          border: '1px solid rgba(124,109,250,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>✍️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-brand-violet)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              This week&apos;s prompt
            </div>
            <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
              {weeklyPrompt.text}
            </p>
            <p style={{ margin: '0.375rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
              Posting as {currentAlias}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flexShrink: 0 }}>
            <Link
              href={`/post/new?prompt=${weeklyPrompt.id}`}
              id="prompt-respond"
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '8px',
                background: 'var(--color-brand-violet)',
                color: '#fff',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Respond
            </Link>
            <button
              onClick={dismissPrompt}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textAlign: 'center',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="feed-filter-row">
        {CATEGORIES.map((cat) => {
          const active = category === cat.value
          return (
            <button
              key={cat.value}
              id={`filter-${cat.value}`}
              onClick={() => {
                startTransition(() => setCategory(cat.value))
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                border: active ? '1px solid var(--color-brand-violet)' : '1px solid var(--color-border-subtle)',
                background: active ? 'rgba(124,109,250,0.18)' : 'var(--color-bg-card)',
                color: active ? 'var(--color-brand-violet)' : 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* Posts */}
      {posts.map((post, i) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          index={i % 5}
        />
      ))}

      {/* Skeleton loaders */}
      {loading && posts.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem' }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: '0.375rem' }} />
                  <div className="skeleton" style={{ height: 10, width: '20%' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: '0.375rem' }} />
              <div className="skeleton" style={{ height: 14, width: '85%', marginBottom: '0.375rem' }} />
              <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="skeleton" style={{ height: 30, width: 90, borderRadius: '999px' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌌</div>
          <p style={{ fontFamily: 'var(--font-sora)', fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            Nothing here yet
          </p>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Be the first to say something real.
          </p>
          <Link href="/post/new" className="btn-primary">
            ✍️ Write something
          </Link>
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} style={{ height: 1 }} />

      {/* Loading more */}
      {loading && posts.length > 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Loading more...
        </div>
      )}

      {/* FAB — compose */}
      <Link
        href="/post/new"
        id="fab-compose"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-brand-violet), var(--color-brand-coral))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          boxShadow: '0 4px 20px rgba(124,109,250,0.45)',
          textDecoration: 'none',
          zIndex: 30,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(124,109,250,0.6)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(124,109,250,0.45)'
        }}
        aria-label="Write a post"
      >
        ✍️
      </Link>
    </main>
  )
}
