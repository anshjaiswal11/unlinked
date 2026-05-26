'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Unlink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseConfig } from '@/lib/supabase/config'
import ThemeToggle from '@/components/ThemeToggle'

type AuthMode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const hasSupabaseConfig = Boolean(getSupabaseConfig())
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function switchMode(next: AuthMode) {
    setMode(next)
    setNotice(null)
    setError(null)
    setPassword('')
    setConfirmPassword('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      if (!hasSupabaseConfig) {
        setError('Supabase is not configured for this deployment.')
        return
      }

      const supabase = createClient()

      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (authError) {
          setError(authError.message)
          return
        }

        router.push('/')
        router.refresh()
        return
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.session) {
        router.push('/onboarding')
        router.refresh()
        return
      }

      setNotice('Account created. Check your email to confirm it, then sign in with your password.')
      setMode('login')
      setPassword('')
      setConfirmPassword('')
    })
  }

  return (
    <main className="auth-shell">
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <ThemeToggle />
      </div>

      <section className="auth-panel">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="brand-mark" style={{ marginBottom: '0.9rem' }}>
            <Unlink size={27} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-sora)', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.45rem' }}>
            Unlinked
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.98rem', lineHeight: 1.55, margin: 0 }}>
            Anonymous posts with real accountability.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1rem' }}>
          <div className="segmented-control" aria-label="Authentication mode">
            <button
              type="button"
              className="segmented-option"
              data-active={mode === 'login'}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className="segmented-option"
              data-active={mode === 'signup'}
              onClick={() => switchMode('signup')}
            >
              Sign up
            </button>
          </div>

          <div style={{ padding: '1.25rem 0.25rem 0.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-sora)', fontSize: '1.25rem', margin: '0 0 0.35rem' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '0 0 1.25rem', lineHeight: 1.55 }}>
              {mode === 'login'
                ? 'Use your email and password to continue.'
                : 'After signup, you will choose an anonymous alias.'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.95rem' }}>
              <label style={{ display: 'grid', gap: '0.4rem' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 700 }}>Email</span>
                <span style={{ position: 'relative', display: 'block' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="input-base"
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </span>
              </label>

              <label style={{ display: 'grid', gap: '0.4rem' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 700 }}>Password</span>
                <span style={{ position: 'relative', display: 'block' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="input-base"
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </span>
              </label>

              {mode === 'signup' && (
                <label style={{ display: 'grid', gap: '0.4rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 700 }}>Confirm password</span>
                  <span style={{ position: 'relative', display: 'block' }}>
                    <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                      id="confirm-password-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat your password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="input-base"
                      style={{ paddingLeft: '2.75rem' }}
                    />
                  </span>
                </label>
              )}

              {notice && (
                <p style={{ color: 'var(--color-cat-story)', fontSize: '0.875rem', lineHeight: 1.55, margin: 0 }}>
                  {notice}
                </p>
              )}

              {error && (
                <p style={{ color: 'var(--color-brand-coral)', fontSize: '0.875rem', lineHeight: 1.55, margin: 0 }}>
                  {error}
                </p>
              )}

              {!hasSupabaseConfig && (
                <p style={{ color: 'var(--color-brand-coral)', fontSize: '0.875rem', lineHeight: 1.55, margin: 0 }}>
                  Deployment setup is missing Supabase environment variables.
                </p>
              )}

              <button
                id="login-submit"
                type="submit"
                className="btn-primary"
                disabled={!hasSupabaseConfig || isPending || !email || !password || (mode === 'signup' && !confirmPassword)}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                {isPending
                  ? mode === 'login' ? 'Logging in...' : 'Creating account...'
                  : mode === 'login' ? 'Login' : 'Sign up'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ margin: '1rem 0 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.78rem', lineHeight: 1.55 }}>
          Your account email is private. Your public identity starts with an anonymous alias.
        </p>
      </section>
    </main>
  )
}
