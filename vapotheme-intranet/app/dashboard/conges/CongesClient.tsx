'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Shop, LeaveRequest } from '@/types'

const LEAVE_TYPES = ['CP', 'RTT', 'Maladie', 'Sans solde'] as const

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' }
  const labels: Record<string, string> = { pending: 'En attente', approved: 'Accepté', rejected: 'Refusé' }
  return <span className={`badge ${map[status] || 'badge-blue'}`}>{labels[status] || status}</span>
}

export default function CongesClient({ currentProfile, shops, leaves }: { currentProfile: Profile, shops: Shop[], leaves: LeaveRequest[] }) {
  const isAdmin = currentProfile.role === 'admin' || currentProfile.role === 'manager'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [type, setType] = useState<string>('CP')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [localLeaves, setLocalLeaves] = useState<LeaveRequest[]>(leaves)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const { data } = await supabase.from('leave_requests').insert({
      profile_id: currentProfile.id, shop_id: currentProfile.shop_id,
      start_date: startDate, end_date: endDate,
      type, message: message || null, status: 'pending'
    }).select('*, profile:profiles(*), shop:shops(*)').single()
    if (data) { setLocalLeaves(prev => [data, ...prev]); setSuccess(true); setStartDate(''); setEndDate(''); setMessage('') }
    setSubmitting(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    await supabase.from('leave_requests').update({ status }).eq('id', id)
    setLocalLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  const pending = localLeaves.filter(l => l.status === 'pending')
  const others = localLeaves.filter(l => l.status !== 'pending')

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Congés</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Formulaire */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Nouvelle demande</div>
          {success && <div style={{ fontSize: 12, color: '#3B6D11', background: '#EAF3DE', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>Demande envoyée ✓</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 10 }}>
              <label>Boutique</label>
              <input type="text" value={currentProfile.shop?.name || 'Non assignée'} disabled style={{ background: '#f0f0f0' }} />
            </div>
            <div style={{ marginBottom: 10 }}><label>Date de début</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></div>
            <div style={{ marginBottom: 10 }}><label>Date de fin</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required /></div>
            <div style={{ marginBottom: 10 }}>
              <label>Type</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Message (optionnel)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Précisez si besoin..." style={{ height: 70, resize: 'vertical' }} />
            </div>
            <button className="btn-primary" type="submit" disabled={submitting}>{submitting ? 'Envoi...' : 'Envoyer au patron'}</button>
          </form>
        </div>

        {/* Liste */}
        <div>
          {isAdmin && pending.length > 0 && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>En attente de validation</div>
              {pending.map(req => (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid #eee' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{req.profile?.full_name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{req.start_date} → {req.end_date} · {req.type} · {req.shop?.name}</div>
                    {req.message && <div style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>{req.message}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => updateStatus(req.id, 'approved')} style={{ background: '#EAF3DE', color: '#3B6D11', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>✓ Valider</button>
                    <button onClick={() => updateStatus(req.id, 'rejected')} style={{ background: '#FCEBEB', color: '#A32D2D', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>✗ Refuser</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{isAdmin ? 'Toutes les demandes' : 'Mes demandes'}</div>
            {others.length === 0 && <p style={{ fontSize: 13, color: '#888' }}>Aucune demande.</p>}
            {others.map(req => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #eee' }}>
                <div>
                  {isAdmin && <div style={{ fontSize: 12, fontWeight: 500 }}>{req.profile?.full_name}</div>}
                  <div style={{ fontSize: 12, color: '#666' }}>{req.start_date} → {req.end_date}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{req.type}{req.shop ? ` · ${req.shop.name}` : ''}</div>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
