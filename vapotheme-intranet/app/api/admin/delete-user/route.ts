import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('auth_user_id', user.id).single()
  if (!caller || caller.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { profileId } = await req.json()
  if (!profileId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const admin = createAdminClient()

  const { data: profile } = await admin.from('profiles').select('auth_user_id').eq('id', profileId).single()
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  await admin.from('profiles').delete().eq('id', profileId)
  await admin.auth.admin.deleteUser(profile.auth_user_id)

  return NextResponse.json({ success: true })
}
