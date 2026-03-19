import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lhrmcxdzflclqpiykoeb.supabase.co'
const supabaseKey = 'sb_publishable_RzNSGBsRw82CiiLcFkJJhg_gcEJLRvy'

export const supabase = createClient(supabaseUrl, supabaseKey)
