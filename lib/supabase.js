import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hhjwtswrkcprljdvsrjg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoand0c3dya2NwcmxqZHZzcmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjA3ODcsImV4cCI6MjA5MjA5Njc4N30.-xdjfhwcUQaaMnPQAN7QaDT68XeyrOzVfqrCT4loLbo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)