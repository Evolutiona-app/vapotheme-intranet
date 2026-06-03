import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, shop:shops(*)').eq('auth_user_id', user.id).single()
  if (!profile) redirect('/login')
  return <AccountClient profile={profile} email={user.email || ''} />
}
