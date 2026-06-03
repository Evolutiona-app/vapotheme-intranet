import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EquipeClient from './EquipeClient'

export default async function EquipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('auth_user_id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard/accueil')
  const { data: shops } = await supabase.from('shops').select('*').order('name')
  const { data: members } = await supabase.from('profiles').select('*, shop:shops(*)').order('full_name')
  return <EquipeClient shops={shops || []} members={members || []} />
}
