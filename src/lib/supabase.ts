import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

type SupabaseClientType = SupabaseClient<any>

declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient__: SupabaseClientType | undefined
}

const globalForSupabase = globalThis as typeof globalThis & {
  __supabaseClient__?: SupabaseClientType
}

if (!globalForSupabase.__supabaseClient__) {
  globalForSupabase.__supabaseClient__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })
}

export const supabase = globalForSupabase.__supabaseClient__
