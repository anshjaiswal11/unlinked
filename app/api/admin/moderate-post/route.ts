'use server'
// app/api/admin/moderate-post/route.ts — Admin actions on posts

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest): Promise<Response> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { post_id, status } = await req.json()

  await supabase.from('posts').update({ status }).eq('id', post_id)

  return Response.json({ success: true })
}
