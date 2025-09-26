import { supabase } from '../lib/supabase'

// Simple test to verify Supabase connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('count(*)', { count: 'exact' })

    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }

    console.log('Supabase connection successful!')
    return true
  } catch (err) {
    console.error('Failed to connect to Supabase:', err)
    return false
  }
}

// Test function you can run in the browser console
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection
}