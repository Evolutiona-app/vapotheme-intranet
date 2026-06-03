import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CongesClient from './CongesClient'

export default async function CongesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, shop:shops(*)').eq('auth_user_id', user.id).single()
  if (!profile) redirect('/login')
  const { data: shops } = await supabase.from('shops').select('*')
  const query = profile.role === 'admin' || profile.role === 'manager'
    ? supabase.from('leave_requests').select('*, profile:profiles(*), shop:shops(*)')
    : supabase.from('leave_requests').select('*, profile:profiles(*), shop:shops(*)').eq('profile_id', profile.id)
  const { data: leaves } = await query.order('created_at', { ascending: false })
  return <CongesClient currentProfile={profile} shops={shops || []} leaves={leaves || []} />
}
