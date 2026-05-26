// app/admin/page.tsx — Moderation dashboard (admin only)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'
import Navbar from '@/components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Moderation — Unlinked',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('alias, avatar_seed, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/feed')

  // Fetch hidden + reported posts
  const { data: flaggedPosts } = await supabase
    .from('posts')
    .select('id, content, category, status, report_count, created_at, users!inner(alias, avatar_seed)')
    .or('status.eq.hidden,report_count.gte.1')
    .order('report_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div style={{ minHeight: '100dvh' }}>
      <Navbar alias={profile.alias} avatarSeed={profile.avatar_seed ?? profile.alias} isAdmin />
      <AdminDashboard posts={flaggedPosts ?? []} />
    </div>
  )
}
