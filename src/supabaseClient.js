import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://exarxqaylflskvxqjgfm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YXJ4cWF5bGZsc2t2eHFqZ2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTc1OTIsImV4cCI6MjA4NTczMzU5Mn0.YSEZ1zHI0VtGdQZU69uwR0r2l3BsOE0up0NDGS-v_yE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)