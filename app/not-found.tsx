// app/not-found.tsx — Global 404 page
import Link from 'next/link'

export default function NotFound() {
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
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌌</div>
      <h1 style={{ fontFamily: 'var(--font-sora)', fontSize: '2rem', marginBottom: '0.5rem' }}>
        Lost in the void
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginBottom: '2rem' }}>
        This post doesn&apos;t exist, was removed, or never made it here.
      </p>
      <Link href="/feed" className="btn-primary">
        ← Back to Feed
      </Link>
    </div>
  )
}
