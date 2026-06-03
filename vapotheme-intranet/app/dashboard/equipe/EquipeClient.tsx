'use client'
import { useState } from 'react'
import type { Profile, Shop } from '@/types'

const COLORS = ['#6964FC','#1D9E75','#D85A30','#378ADD','#D4537E','#639922','#BA7517','#5DCAA5','#7F77DD','#D85A30']
const ROLES = [{ value: 'admin', label: 'Admin (patron)' }, { value: 'manager', label: 'Manager' }, { value: 'employe', label: 'Employé' }]

export default function EquipeClient({ shops, members }: { shops: Shop[], members: Profile[] }) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('employe')
  const [shopId, setShopId] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, role, shopId: shopId || null, color })
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Erreur'); setSubmitting(false); return }
    setSuccess(`Compte créé ! ${fullName} recevra un email pour définir son mot de passe.`)
    setEmail(''); setFullName(''); setRole('employe'); setShopId(''); setShowForm(false)
    setSubmitting(false)
    setTimeout(() => setSuccess(''), 5000)
    window.location.reload()
  }

  const roleBadge = (r: string) => {
    if (r === 'admin') return 'badge-violet'
    if (r === 'manager') return 'badge-blue'
    return 'badge-green'
  }
  const roleLabel = (r: string) => ROLES.find(x => x.value === r)?.label || r

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Équipe & comptes</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: 12 }}>+ Créer un compte</button>
      </div>

      {success && <div style={{ fontSize: 12, color: '#3B6D11', background: '#EAF3DE', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Nouveau compte</div>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label>Nom complet</label><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Marie Dupont" required /></div>
            <div><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marie@vapotheme.fr" required /></div>
            <div>
              <label>Rôle</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label>Boutique</label>
              <select value={shopId} onChange={e => setShopId(e.target.value)}>
                <option value="">Aucune boutique</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label>Couleur dans le planning</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            {error && <div style={{ gridColumn: 'span 2', fontSize: 12, color: '#A32D2D', background: '#FCEBEB', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8 }}>
              <button className="btn-primary" type="submit" disabled={submitting}>{submitting ? 'Création...' : 'Créer le compte'}</button>
              <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Membres ({members.length})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8f8fa', borderRadius: 8, border: '0.5px solid #eee' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color || '#6964FC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                {m.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{m.full_name}</div>
                <span className={`badge ${roleBadge(m.role)}`} style={{ fontSize: 10, marginTop: 2 }}>{roleLabel(m.role)}</span>
                {(m as any).shop && <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{(m as any).shop.name}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
