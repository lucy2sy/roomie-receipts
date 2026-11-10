import { createClient } from '@supabase/supabase-js'

// Set these in a local .env file (see .env.example) and in
// Cloudflare Pages > Settings > Variables and Secrets.
// The publishable key is safe in the browser: the database is protected by
// RLS + the functions in supabase/v2_security.sql, not by hiding this key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill them in.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
