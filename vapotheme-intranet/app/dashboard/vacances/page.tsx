import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VacancesClient from './VacancesClient'

export default async function VacancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, shop:shops(*)').eq('auth_user_id', user.id).single()
  if (!profile) redirect('/login')
  const { data: profiles } = await supabase.from('profiles').select('*').order('full_name')
  const { data: leaves } = await supabase.from('leave_requests').select('*').eq('status', 'approved')
  return <VacancesClient currentProfile={profile} profiles={profiles || []} leaves={leaves || []} />
}
