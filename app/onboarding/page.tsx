'use client'
// app/onboarding/page.tsx — Multi-step onboarding flow

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'
import { generateAliasSuggestions, validateAlias } from '@/lib/aliases'
import type { PostCategory } from '@/lib/types'

const INTERESTS: { value: PostCategory; label: string; emoji: string; desc: string }[] = [
  { value: 'confession', label: 'Confessions', emoji: '🤫', desc: 'Things you\'ve never told anyone' },
  { value: 'opinion', label: 'Opinions', emoji: '💬', desc: 'Your unfiltered take on life' },
  { value: 'story', label: 'Stories', emoji: '📖', desc: 'Real moments, anonymously told' },
  { value: 'hottake', label: 'Hot Takes', emoji: '🔥', desc: 'Controversial, spicy, honest' },
]

const COMPACT = [
  'I will not name real people, companies, or institutions.',
  'I will express myself honestly, not to harm others.',
  'I understand my Trust Score shapes my visibility — good behavior gets rewarded.',
  'I am 18 years or older.',
]

type Step = 'alias' | 'interests' | 'compact'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('alias')
  const [alias, setAlias] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [aliasError, setAliasError] = useState<string | null>(null)
  const [suggestions] = useState(() => generateAliasSuggestions(6))
  const [interests, setInterests] = useState<PostCategory[]>([])
  const [agreed, setAgreed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const finalAlias = useCustom ? customAlias : alias

  function handleAliasNext() {
    const err = validateAlias(finalAlias)
    if (err) { setAliasError(err); return }
    setAliasError(null)
    setStep('interests')
  }

  function toggleInterest(cat: PostCategory) {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  function complete() {
    setServerError(null)
    startTransition(async () => {
      const res = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: finalAlias, interests }),
      })
      if (res.ok) {
        router.push('/feed')
      } else {
        const data = await res.json()
        setServerError(data.error ?? 'Something went wrong')
        if (data.error?.includes('taken')) setStep('alias')
      }
    })
  }

  const stepIndex = step === 'alias' ? 0 : step === 'interests' ? 1 : 2

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
            Step {stepIndex + 1} of 3
          </p>
          <div style={{
            display: 'flex',
            gap: '0.375rem',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                height: '4px',
                flex: 1,
                maxWidth: 60,
                borderRadius: '99px',
                background: i <= stepIndex
                  ? 'linear-gradient(90deg, var(--color-brand-violet), var(--color-brand-coral))'
                  : 'var(--color-bg-card)',
                transition: 'background 0.4s ease',
              }} />
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          {/* Step 1: Pick alias */}
          {step === 'alias' && (
            <div className="animate-fade-in" style={{ opacity: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontSize: '1.375rem', marginBottom: '0.375rem' }}>
                Choose your anonymous identity
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                This is who you are on Unlinked. Nobody knows it&apos;s you.
              </p>

              {/* Avatar preview */}
              {finalAlias && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', gap: '0.625rem' }}>
                  <Avatar seed={finalAlias} size={72} showRing />
                  <span style={{ fontFamily: 'var(--font-sora)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                    {finalAlias}
                  </span>
                </div>
              )}

              {/* Suggestions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    id={`alias-suggest-${s}`}
                    onClick={() => { setAlias(s); setUseCustom(false); setAliasError(null) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '10px',
                      border: alias === s && !useCustom
                        ? '1px solid var(--color-brand-violet)'
                        : '1px solid var(--color-border-subtle)',
                      background: alias === s && !useCustom
                        ? 'rgba(124,109,250,0.12)'
                        : 'var(--color-bg-elevated)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Avatar seed={s} size={24} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom alias */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                  Or create your own alias
                </label>
                <input
                  id="custom-alias-input"
                  type="text"
                  value={customAlias}
                  onChange={(e) => {
                    setCustomAlias(e.target.value)
                    setUseCustom(true)
                    setAliasError(null)
                  }}
                  placeholder="e.g. HollowDrift"
                  maxLength={24}
                  className="input-base"
                />
                {aliasError && (
                  <p style={{ color: 'var(--color-brand-coral)', fontSize: '0.8125rem', marginTop: '0.375rem' }}>
                    {aliasError}
                  </p>
                )}
                {serverError && (
                  <p style={{ color: 'var(--color-brand-coral)', fontSize: '0.8125rem', marginTop: '0.375rem' }}>
                    {serverError}
                  </p>
                )}
              </div>

              <button
                id="alias-next"
                className="btn-primary"
                onClick={handleAliasNext}
                disabled={!finalAlias}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 'interests' && (
            <div className="animate-fade-in" style={{ opacity: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontSize: '1.375rem', marginBottom: '0.375rem' }}>
                What do you want to read?
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Pick what resonates. Your feed gets shaped around this.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
                {INTERESTS.map((item) => {
                  const selected = interests.includes(item.value)
                  return (
                    <button
                      key={item.value}
                      id={`interest-${item.value}`}
                      onClick={() => toggleInterest(item.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: selected
                          ? '1px solid var(--color-brand-violet)'
                          : '1px solid var(--color-border-subtle)',
                        background: selected
                          ? 'rgba(124,109,250,0.12)'
                          : 'var(--color-bg-elevated)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '1.75rem' }}>{item.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                          {item.desc}
                        </div>
                      </div>
                      {selected && (
                        <div style={{ marginLeft: 'auto', color: 'var(--color-brand-violet)', fontWeight: 700 }}>✓</div>
                      )}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-ghost" onClick={() => setStep('alias')} style={{ flex: 1 }}>← Back</button>
                <button
                  id="interests-next"
                  className="btn-primary"
                  onClick={() => setStep('compact')}
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Community Compact */}
          {step === 'compact' && (
            <div className="animate-fade-in" style={{ opacity: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-sora)', fontSize: '1.375rem', marginBottom: '0.375rem' }}>
                The Unlinked Compact
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Four simple rules. Not for us — for the community you&apos;re joining.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
                {COMPACT.map((rule, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.875rem',
                    background: 'var(--color-bg-elevated)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border-subtle)',
                  }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-brand-violet), var(--color-brand-coral))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: '#fff',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      {rule}
                    </span>
                  </div>
                ))}
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                marginBottom: '1.25rem',
                padding: '0.875rem',
                background: 'rgba(124,109,250,0.06)',
                borderRadius: '10px',
                border: '1px solid rgba(124,109,250,0.2)',
              }}>
                <input
                  id="compact-agree"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-brand-violet)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                  I accept these four rules
                </span>
              </label>

              {serverError && (
                <p style={{ color: 'var(--color-brand-coral)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {serverError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-ghost" onClick={() => setStep('interests')} style={{ flex: 1 }}>← Back</button>
                <button
                  id="complete-onboarding"
                  className="btn-primary"
                  onClick={complete}
                  disabled={!agreed || isPending}
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  {isPending ? 'Setting up...' : '🚀 Enter Unlinked'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
