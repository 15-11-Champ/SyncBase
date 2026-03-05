import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// This client is safe to use in both Client and Server Components.
// It handles cookie-based auth automatically.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export const getSupabase = () => {
  if (typeof window !== 'undefined') {
    const isPlaceholder = supabaseUrl.includes('placeholder');
    console.log('--- SUPABASE CLIENT DIAGNOSTICS ---');
    console.log('URL:', isPlaceholder ? '⚠️ USING PLACEHOLDER' : `${supabaseUrl.substring(0, 15)}...`);
    console.log('KEY:', supabaseAnonKey === 'placeholder' ? '⚠️ USING PLACEHOLDER' : '✅ LOADED');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Only throw if we are actually trying to use it in a context where we expect it to work
    // During build (static generation), we want to avoid crashing
    if (typeof window !== 'undefined') {
      console.error('Supabase environment variables are missing! Check your Vercel settings.')
    }
  }
  return supabase
}
