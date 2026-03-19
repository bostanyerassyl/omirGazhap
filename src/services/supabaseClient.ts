import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'PROJECT_URL'
const supabaseKey = 'ANON_PUBLIC_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
