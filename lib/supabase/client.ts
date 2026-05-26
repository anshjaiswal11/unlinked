// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { requireSupabaseConfig } from './config'

export function createClient() {
  const config = requireSupabaseConfig()

  return createBrowserClient(
    config.url,
    config.anonKey
  )
}
