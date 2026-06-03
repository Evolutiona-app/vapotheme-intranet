import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotesClient from './NotesClient'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, shop:shops(*)').eq('auth_user_id', user.id).single()
  if (!profile) redirect('/login')
  const { data: shops } = await supabase.from('shops').select('*')
  const { data: notes } = await supabase.from('notes').select('*, author:profiles(full_name)').order('created_at', { ascending: false })
  return <NotesClient currentProfile={profile} shops={shops || []} initialNotes={notes || []} />
}
