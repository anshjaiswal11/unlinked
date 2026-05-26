// app/post/new/page.tsx — Wrapper that provides Suspense for useSearchParams
import { Suspense } from 'react'
import NewPostComposer from './NewPostComposer'

export default function NewPostPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>Loading composer...</span>
      </div>
    }>
      <NewPostComposer />
    </Suspense>
  )
}
