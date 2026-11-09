import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://exarxqaylflskvxqjgfm.supabase.co'
const supabaseAnonKey = 'sb_publishable_qjCM6CzOMSFQkL6eBnKVfA_MYWl9q1F'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)