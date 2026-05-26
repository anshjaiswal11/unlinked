'use server'
// app/api/auth/complete-onboarding/route.ts — Finish onboarding, set alias + avatar

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { validateAlias } from '@/lib/aliases'
import { TRUST_DEFAULTS } from '@/lib/trust'

export async function POST(req: NextRequest): Promise<Response> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { alias, interests } = await req.json() as {
    alias: string
    interests: string[]
  }

  const aliasError = validateAlias(alias)
  if (aliasError) {
    return Response.json({ error: aliasError }, { status: 400 })
  }

  // Check alias uniqueness
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('alias', alias)
    .single()

  if (existing) {
    return Response.json({ error: 'This alias is already taken. Try another.' }, { status: 409 })
  }

  // Upsert user profile
  const { error: upsertError } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      alias,
      avatar_seed: alias, // Deterministic from alias
      trust_score: TRUST_DEFAULTS.INITIAL,
      streak_count: 0,
      streak_last_at: null,
      interests: interests ?? [],
      onboarding_complete: true,
      is_admin: false,
    })

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
