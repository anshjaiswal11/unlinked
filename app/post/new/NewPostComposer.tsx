'use client'
// app/post/new/NewPostComposer.tsx — Full-screen post composer

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORY_META, type PostCategory } from '@/lib/types'
import Link from 'next/link'

const CATEGORIES = Object.entries(CATEGORY_META) as [PostCategory, (typeof CATEGORY_META)[PostCategory]][]

type ModerationState = 'idle' | 'checking' | 'ok' | 'friction' | 'blocked'

interface ModResult {
  score: number
  shouldBlock: boolean
  shouldFriction: boolean
  triggeredAttributes: string[]
  message: string
}

const placeholders: Record<PostCategory, string> = {
  confession: "Something I've never told anyone...",
  opinion: "Honestly, I think...",
  story: "This thing happened to me...",
  hottake: "Controversial opinion: ...",
}

export default function NewPostComposer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const promptId = searchParams.get('prompt')

  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory>('confession')
  const [modState, setModState] = useState<ModerationState>('idle')
  const [modResult, setModResult] = useState<ModResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [newStreakCount, setNewStreakCount] = useState<number | null>(null)
  const [hitMilestone, setHitMilestone] = useState<number | null>(null)

  const CHAR_LIMIT = 500
  const remaining = CHAR_LIMIT - content.length
  const isOverLimit = remaining < 0

  async function checkModeration(): Promise<ModResult | null> {
    setModState('checking')
    try {
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data: ModResult = await res.json()
      setModResult(data)
      if (data.shouldBlock) {
        setModState('blocked')
        return null
      } else if (data.shouldFriction) {
        setModState('friction')
        return null
      }
      setModState('ok')
      return data
    } catch {
      setModState('ok')
      return { score: 0, shouldBlock: false, shouldFriction: false, triggeredAttributes: [], message: 'Looks good.' }
    }
  }

  async function submitPost(bypassFriction = false) {
    setError(null)

    if (!bypassFriction) {
      const modRes = await checkModeration()
      if (!modRes) return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            category,
            prompt_id: promptId ?? undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Failed to post')
          setModState('idle')
          return
        }
        setNewStreakCount(data.newStreak)
        setHitMilestone(data.hitMilestone)
        setTimeout(() => router.push('/feed'), data.hitMilestone ? 2500 : 1200)
      } catch {
        setError('Connection error. Please try again.')
        setModState('idle')
      }
    })
  }

  // Success state
  if (newStreakCount !== null) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
          {hitMilestone ? '🎉' : '✅'}
        </div>
        <h2 style={{ fontFamily: 'var(--font-sora)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          {hitMilestone
            ? `${hitMilestone}-day streak! 🔥`
            : 'Posted anonymously'}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
          {hitMilestone
            ? `You've expressed yourself for ${hitMilestone} days straight. Keep going.`
            : `You've expressed yourself for ${newStreakCount} ${newStreakCount === 1 ? 'day' : 'days'} straight.`}
        </p>
        <div style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
          Heading back to feed...
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Composer header */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(8,8,16,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border-subtle)',
        zIndex: 10,
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/feed" className="btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          ← Back
        </Link>
        <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: '1rem' }}>
          New Post
        </span>
        <div style={{ width: 80 }} />
      </header>

      <main className="page-shell" style={{ flex: 1, width: '100%' }}>
        {/* Category selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)',
            marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Category
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {CATEGORIES.map(([cat, meta]) => {
              const selected = category === cat
              return (
                <button
                  key={cat}
                  id={`cat-${cat}`}
                  onClick={() => setCategory(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: selected ? `1px solid ${meta.color}66` : '1px solid var(--color-border-subtle)',
                    borderLeft: selected ? `3px solid ${meta.color}` : '1px solid var(--color-border-subtle)',
                    background: selected ? `${meta.color}18` : 'var(--color-bg-card)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: selected ? 600 : 400,
                    color: selected ? meta.color : 'var(--color-text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Text area */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)',
            marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Your thought
          </label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (modState !== 'idle') setModState('idle')
              setError(null)
            }}
            placeholder={placeholders[category]}
            rows={9}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'var(--color-bg-card)',
              border: isOverLimit
                ? '1px solid var(--color-brand-coral)'
                : modState === 'friction'
                  ? '1px solid rgba(255,184,48,0.5)'
                  : '1px solid var(--color-border-subtle)',
              borderRadius: '14px',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '1.0625rem',
              lineHeight: 1.7,
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Anonymous · No real names allowed
            </span>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: remaining < 100 ? 600 : 400,
              color: isOverLimit
                ? 'var(--color-brand-coral)'
                : remaining < 50
                  ? 'var(--color-cat-hottake)'
                  : 'var(--color-text-muted)',
            }}>
              {remaining}
            </span>
          </div>
        </div>

        {/* Friction warning */}
        {modState === 'friction' && modResult && (
          <div style={{
            padding: '1rem 1.125rem',
            background: 'rgba(255,184,48,0.08)',
            border: '1px solid rgba(255,184,48,0.3)',
            borderRadius: '12px',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <span>⚠️</span>
              <span style={{ fontWeight: 600, color: 'var(--color-cat-hottake)' }}>
                A moment before you post
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 0.875rem' }}>
              {modResult.message}
            </p>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button className="btn-ghost" onClick={() => setModState('idle')} style={{ flex: 1 }}>
                ✏️ Edit
              </button>
              <button
                id="post-anyway"
                onClick={() => submitPost(true)}
                disabled={isPending}
                style={{
                  flex: 1, padding: '0.625rem', borderRadius: '999px',
                  border: '1px solid rgba(255,184,48,0.4)',
                  background: 'rgba(255,184,48,0.12)', color: 'var(--color-cat-hottake)',
                  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                Post anyway
              </button>
            </div>
          </div>
        )}

        {/* Hard block */}
        {modState === 'blocked' && modResult && (
          <div style={{
            padding: '1rem 1.125rem',
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: '12px', marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <span>🚫</span>
              <span style={{ fontWeight: 600, color: 'var(--color-brand-coral)' }}>
                This can&apos;t go live as written
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              {modResult.message}
            </p>
            <button className="btn-ghost" onClick={() => setModState('idle')} style={{ marginTop: '0.875rem' }}>
              ✏️ Revise
            </button>
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--color-brand-coral)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        {(modState === 'idle' || modState === 'ok' || modState === 'checking') && (
          <button
            id="post-submit"
            className="btn-primary"
            onClick={() => submitPost(false)}
            disabled={content.trim().length < 5 || isOverLimit || isPending || modState === 'checking'}
            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
          >
            {modState === 'checking' ? '🔍 Checking...' : isPending ? '📤 Posting...' : '📤 Post anonymously'}
          </button>
        )}

        <p style={{
          marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem',
          color: 'var(--color-text-muted)', lineHeight: 1.6,
        }}>
          Your post is completely anonymous. Don&apos;t name real people, companies, or institutions.
        </p>
      </main>
    </div>
  )
}
