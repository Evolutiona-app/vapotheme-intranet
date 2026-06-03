import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlanningClient from './PlanningClient'

export default async function PlanningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*, shop:shops(*)').eq('auth_user_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: shops } = await supabase.from('shops').select('*').order('name')
  const { data: profiles } = await supabase.from('profiles').select('*, shop:shops(*)').order('full_name')
  const { data: templates } = await supabase.from('schedule_templates').select('*')
  const { data: customShifts } = await supabase.from('custom_shifts').select('*')
  const { data: renforts } = await supabase
    .from('renforts').select('*, profile:profiles(*), from_shop:shops!renforts_from_shop_id_fkey(*), to_shop:shops!renforts_to_shop_id_fkey(*)')
    .gte('date', new Date().toISOString().slice(0,10))

  return (
    <PlanningClient
      currentProfile={profile}
      shops={shops || []}
      profiles={profiles || []}
      templates={templates || []}
      customShifts={customShifts || []}
      renforts={renforts || []}
    />
  )
}
