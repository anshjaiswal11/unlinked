'use client'
// components/StreakBanner.tsx — Private streak display (only seen by the user themselves)

import { computeStreakStatus, STREAK_MILESTONES } from '@/lib/streaks'

interface StreakBannerProps {
  streakCount: number
  streakLastAt: string | null
}

export default function StreakBanner({ streakCount, streakLastAt }: StreakBannerProps) {
  const status = computeStreakStatus(streakCount, streakLastAt)

  if (!status.isActive && streakCount === 0) {
    return (
      <div style={{
        padding: '0.875rem 1rem',
        background: 'var(--color-bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--color-border-subtle)',
        fontSize: '0.875rem',
        color: 'var(--color-text-secondary)',
        textAlign: 'center',
      }}>
        🌱 Post your first thought to start your streak
      </div>
    )
  }

  const progress = status.nextMilestone
    ? ((streakCount % status.nextMilestone) / status.nextMilestone) * 100
    : 100

  return (
    <div style={{
      padding: '1.125rem 1.25rem',
      background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,184,48,0.1))',
      borderRadius: '14px',
      border: '1px solid rgba(255,184,48,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', animation: status.isActive ? 'none' : undefined }}>
            {status.isActive ? '🔥' : '❄️'}
          </span>
          <div>
            <div style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
              {streakCount} {streakCount === 1 ? 'day' : 'days'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Expression streak
            </div>
          </div>
        </div>

        {status.hoursUntilExpiry !== null && (
          <div style={{
            padding: '0.25rem 0.625rem',
            background: 'rgba(255,184,48,0.12)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: 'var(--color-cat-hottake)',
            fontWeight: 600,
          }}>
            {status.hoursUntilExpiry}h left
          </div>
        )}
      </div>

      {/* Progress to next milestone */}
      {status.nextMilestone && (
        <>
          <div style={{
            height: '4px',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '99px',
            overflow: 'hidden',
            marginBottom: '0.375rem',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #FF6B6B, #FFB830)',
              borderRadius: '99px',
              transition: 'width 0.8s ease',
            }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {status.nextMilestone - streakCount} more {status.nextMilestone - streakCount === 1 ? 'day' : 'days'} to {status.nextMilestone}-day milestone
          </div>
        </>
      )}

      {/* Milestones */}
      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {STREAK_MILESTONES.map((m) => {
          const achieved = streakCount >= m
          return (
            <div
              key={m}
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                background: achieved ? 'rgba(255,184,48,0.2)' : 'rgba(255,255,255,0.04)',
                color: achieved ? 'var(--color-cat-hottake)' : 'var(--color-text-muted)',
                border: achieved ? '1px solid rgba(255,184,48,0.35)' : '1px solid transparent',
              }}
            >
              {achieved ? '✓' : ''} {m}d
            </div>
          )
        })}
      </div>
    </div>
  )
}
