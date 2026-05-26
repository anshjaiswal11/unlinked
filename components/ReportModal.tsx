'use client'
// components/ReportModal.tsx — Report a post

import { useState, useTransition } from 'react'
import type { ReportReason } from '@/lib/types'

const REASONS: { value: ReportReason; label: string; emoji: string }[] = [
  { value: 'harassment', label: 'Harassment or bullying', emoji: '😤' },
  { value: 'real_person_named', label: 'Real person or company named', emoji: '🔍' },
  { value: 'spam', label: 'Spam or fake content', emoji: '🤖' },
  { value: 'harmful_content', label: 'Harmful or dangerous content', emoji: '⚠️' },
  { value: 'legal_violation', label: 'Legal violation', emoji: '⚖️' },
]

interface ReportModalProps {
  postId: string
  onClose: () => void
}

export default function ReportModal({ postId, onClose }: ReportModalProps) {
  const [selected, setSelected] = useState<ReportReason | null>(null)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, reason: selected }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(onClose, 2000)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
      }
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="glass-card animate-fade-in-up"
        style={{
          maxWidth: 420,
          width: '100%',
          padding: '1.5rem',
          opacity: 0,
        }}
        role="dialog"
        aria-label="Report post"
      >
        {done ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
            <p style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
              Report submitted
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Thank you for keeping Unlinked safe.
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Report this post
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Why are you reporting this? Your report is anonymous.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  id={`report-reason-${r.value}`}
                  onClick={() => setSelected(r.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: selected === r.value
                      ? '1px solid var(--color-brand-violet)'
                      : '1px solid var(--color-border-subtle)',
                    background: selected === r.value
                      ? 'rgba(124,109,250,0.12)'
                      : 'var(--color-bg-elevated)',
                    color: selected === r.value
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            {error && (
              <p style={{ color: 'var(--color-brand-coral)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                id="submit-report"
                className="btn-danger"
                onClick={submit}
                disabled={!selected || isPending}
                style={{ flex: 1 }}
              >
                {isPending ? 'Reporting...' : 'Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
