import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Vérifier que l'appelant est admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('auth_user_id', user.id).single()
  if (!caller || caller.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { email, fullName, role, shopId, color } = await req.json()
  if (!email || !fullName || !role) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const admin = createAdminClient()

  // Créer l'utilisateur Auth avec un mot de passe temporaire
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Créer le profil
  const { error: profileError } = await admin.from('profiles').insert({
    auth_user_id: authUser.user.id,
    full_name: fullName,
    role,
    shop_id: shopId || null,
    color: color || '#6964FC'
  })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  // Envoyer l'email de reset de mot de passe
  await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/set-password` }
  })

  return NextResponse.json({ success: true })
}
