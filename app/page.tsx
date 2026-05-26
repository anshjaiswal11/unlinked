// app/page.tsx — Landing / splash page → redirects to feed or login
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseConfig } from '@/lib/supabase/config'

export default async function RootPage() {
  if (!getSupabaseConfig()) {
    redirect('/login?setup=missing-supabase')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check onboarding
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_complete) {
      redirect('/onboarding')
    }
    redirect('/feed')
  }

  redirect('/login')
}
