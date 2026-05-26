'use client'
// components/PostCard.tsx — The core feed card

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from './Avatar'
import ReportModal from './ReportModal'
import { CATEGORY_META, REACTION_META, type Post, type ReactionType } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

interface PostCardProps {
  post: Post
  currentUserId?: string
  index?: number
}

export default function PostCard({ post, currentUserId, index = 0 }: PostCardProps) {
  const meta = CATEGORY_META[post.category]
  const alias = post.alias ?? 'Anonymous'
  const avatarSeed = alias

  const [reactions, setReactions] = useState<Record<ReactionType, number>>({
    relatable: (post.reaction_counts?.relatable ?? 0),
    insightful: (post.reaction_counts?.insightful ?? 0),
    respect: (post.reaction_counts?.respect ?? 0),
  })
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    post.user_reaction ?? null
  )
  const [isPending, startTransition] = useTransition()
  const [showReport, setShowReport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  async function handleReact(type: ReactionType) {
    if (!currentUserId) return

    // Optimistic update
    const prev = userReaction
    const prevCounts = { ...reactions }

    startTransition(() => {
      setReactions((r) => {
        const next = { ...r }
        if (prev) next[prev] = Math.max(0, next[prev] - 1)
        if (prev !== type) {
          next[type] = next[type] + 1
          setUserReaction(type)
        } else {
          setUserReaction(null)
        }
        return next
      })
    })

    try {
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, type }),
      })
      if (!res.ok) {
        // Revert
        setReactions(prevCounts)
        setUserReaction(prev)
      }
    } catch {
      setReactions(prevCounts)
      setUserReaction(prev)
    }
  }

  const delay = `${index * 60}ms`

  return (
    <>
      <article
        className="glass-card animate-fade-in-up"
        style={{
          padding: '1.25rem',
          marginBottom: '0.75rem',
          animationDelay: delay,
          opacity: 0,
          borderLeft: `3px solid ${meta.color}33`,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
          <Avatar seed={avatarSeed} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontFamily: 'var(--font-sora)',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)',
              }}>
                {alias}
              </span>
              <span className={`badge ${meta.badgeClass}`}>
                {meta.emoji} {meta.label}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {timeAgo(post.created_at)}
            </span>
          </div>

          {/* Menu */}
          <div style={{ position: 'relative' }}>
            <button
              id={`post-menu-${post.id}`}
              onClick={() => setShowMenu((s) => !s)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '0.25rem',
                borderRadius: '6px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)' }}
              aria-label="Post options"
            >
              ···
            </button>
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '0.25rem',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-muted)',
                  borderRadius: '10px',
                  padding: '0.375rem',
                  zIndex: 50,
                  minWidth: '140px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <button
                  id={`share-${post.id}`}
                  onClick={() => {
                    navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`)
                    setShowMenu(false)
                  }}
                  style={menuItemStyle}
                >
                  🔗 Share
                </button>
                {currentUserId && (
                  <button
                    id={`report-${post.id}`}
                    onClick={() => { setShowMenu(false); setShowReport(true) }}
                    style={{ ...menuItemStyle, color: 'var(--color-brand-coral)' }}
                  >
                    🚩 Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <Link href={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
          <p style={{
            margin: '0 0 1rem',
            fontSize: '1rem',
            lineHeight: 1.7,
            color: 'var(--color-text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {post.content}
          </p>
        </Link>

        {/* Reactions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(Object.keys(REACTION_META) as ReactionType[]).map((type) => {
            const rm = REACTION_META[type]
            const active = userReaction === type
            return (
              <button
                key={type}
                id={`react-${type}-${post.id}`}
                onClick={() => handleReact(type)}
                disabled={isPending || !currentUserId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '999px',
                  border: active
                    ? '1px solid rgba(124,109,250,0.6)'
                    : '1px solid var(--color-border-subtle)',
                  background: active
                    ? 'rgba(124,109,250,0.15)'
                    : 'transparent',
                  color: active
                    ? 'var(--color-brand-violet)'
                    : 'var(--color-text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: active ? 600 : 400,
                  cursor: currentUserId ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  transform: active ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                <span>{rm.emoji}</span>
                <span>{reactions[type] > 0 ? reactions[type] : ''}</span>
                <span style={{ opacity: 0.7 }}>{rm.label}</span>
              </button>
            )
          })}
        </div>
      </article>

      {showReport && (
        <ReportModal
          postId={post.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'none',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)',
  transition: 'background 0.15s',
  textAlign: 'left',
}
