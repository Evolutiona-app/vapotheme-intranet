import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*, shop:shops(*)').eq('auth_user_id', user.id).single()
  if (!profile) redirect('/login')

  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  // Stats
  const { count: totalEmployes } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { data: pendingLeaves } = await supabase.from('leave_requests').select('*, profile:profiles(*), shop:shops(*)').eq('status', 'pending')
  const { data: recentNotes } = await supabase.from('notes').select('*, author:profiles(full_name)').order('created_at', { ascending: false }).limit(3)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#201516', margin: 0 }}>
          Bonjour, {profile.full_name.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats — vue patron */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          <div className="card" style={{ background: '#f8f8fa' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Salariés</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#201516' }}>{totalEmployes ?? 0}</div>
          </div>
          <div className="card" style={{ background: '#f8f8fa' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Congés en attente</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#201516' }}>{pendingLeaves?.length ?? 0}</div>
          </div>
          <div className="card" style={{ background: '#f8f8fa' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Notes actives</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#201516' }}>{recentNotes?.length ?? 0}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Demandes en attente */}
        {isAdmin && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Congés en attente</div>
            {!pendingLeaves?.length && <p style={{ fontSize: 13, color: '#888' }}>Aucune demande en attente.</p>}
            {pendingLeaves?.map(req => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #eee' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{req.profile?.full_name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {req.start_date} → {req.end_date} · {req.shop?.name}
                  </div>
                </div>
                <span className="badge badge-yellow">En attente</span>
              </div>
            ))}
          </div>
        )}

        {/* Notes récentes */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Notes récentes</div>
          {!recentNotes?.length && <p style={{ fontSize: 13, color: '#888' }}>Aucune note pour le moment.</p>}
          {recentNotes?.map(note => (
            <div key={note.id} style={{ padding: '8px 0', borderBottom: '0.5px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{note.title}</span>
                <span style={{ fontSize: 11, color: '#888' }}>{new Date(note.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <p style={{ fontSize: 12, color: '#666', margin: '3px 0 0', lineHeight: 1.5 }}>{note.content.slice(0, 80)}{note.content.length > 80 ? '…' : ''}</p>
            </div>
          ))}
        </div>

        {/* Planning salarié */}
        {!isAdmin && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Mon planning · {profile.shop?.name}
            </div>
            <p style={{ fontSize: 13, color: '#888' }}>
              Va dans l&apos;onglet <strong>Planning</strong> pour voir ton planning complet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
