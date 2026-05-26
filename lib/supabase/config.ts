export const SUPABASE_ENV_NAMES = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

export type SupabaseConfig = {
  url: string
  anonKey: string
}

function normalizePublicEnv(value: string | undefined) {
  value = value?.trim()
  return value && value.length > 0 ? value : null
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = normalizePublicEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anonKey = normalizePublicEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!url || !anonKey) {
    return null
  }

  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'https:') {
      return null
    }
  } catch {
    return null
  }

  return { url, anonKey }
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig()

  if (!config) {
    throw new Error(
      `Missing or invalid Supabase configuration. Set ${SUPABASE_ENV_NAMES.join(
        ' and '
      )} in Vercel Project Settings.`
    )
  }

  return config
}
