import { createClient } from '@supabase/supabase-js'

// Client admin avec service role — uniquement côté serveur (API routes)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
