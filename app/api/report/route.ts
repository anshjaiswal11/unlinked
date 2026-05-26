'use server'
// app/api/report/route.ts — Post reporting with rate limiting

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { ReportReason } from '@/lib/types'

const MAX_REPORTS_PER_DAY = 5
const AUTO_HIDE_THRESHOLD = 3

export async function POST(req: NextRequest): Promise<Response> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { post_id, reason } = await req.json() as {
    post_id: string
    reason: ReportReason
  }

  const validReasons: ReportReason[] = [
    'harassment', 'real_person_named', 'spam', 'harmful_content', 'legal_violation',
  ]
  if (!validReasons.includes(reason)) {
    return Response.json({ error: 'Invalid reason' }, { status: 400 })
  }

  // Rate limit: max 5 reports per user per day
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: todayReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_id', user.id)
    .gte('created_at', dayAgo)

  if ((todayReports ?? 0) >= MAX_REPORTS_PER_DAY) {
    return Response.json(
      { error: 'Report limit reached for today. Thank you for keeping Unlinked safe.' },
      { status: 429 }
    )
  }

  // Prevent duplicate reports from same user
  const { data: existingReport } = await supabase
    .from('reports')
    .select('id')
    .eq('post_id', post_id)
    .eq('reporter_id', user.id)
    .single()

  if (existingReport) {
    return Response.json({ error: 'You have already reported this post.' }, { status: 409 })
  }

  // Insert report
  await supabase.from('reports').insert({
    post_id,
    reporter_id: user.id,
    reason,
  })

  // Check total report count on the post
  const { data: postData } = await supabase
    .from('posts')
    .select('report_count, status')
    .eq('id', post_id)
    .single()

  const newCount = (postData?.report_count ?? 0) + 1

  const update: Record<string, unknown> = { report_count: newCount }

  // Auto-hide at threshold
  if (newCount >= AUTO_HIDE_THRESHOLD && postData?.status === 'live') {
    update.status = 'hidden'
  }

  await supabase.from('posts').update(update).eq('id', post_id)

  return Response.json({ success: true, autoHidden: update.status === 'hidden' })
}
