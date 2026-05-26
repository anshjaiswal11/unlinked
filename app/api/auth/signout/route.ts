// app/api/auth/signout/route.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(): Promise<Response> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function POST(): Promise<Response> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
