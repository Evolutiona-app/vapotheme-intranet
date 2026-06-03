'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Shop } from '@/types'

const COLORS = ['#6964FC','#1D9E75','#D85A30','#378ADD','#D4537E','#639922','#BA7517','#5DCAA5','#7F77DD','#E24B4A']
const ROLES = [{ value: 'admin', label: 'Admin (patron)' }, { value: 'manager', label: 'Manager' }, { value: 'employe', label: 'Employé' }]

function roleBadgeClass(r: string) {
  if (r === 'admin') return 'badge-violet'
  if (r === 'manager') return 'badge-blue'
  return 'badge-green'
}

export default function EquipeClient({ shops: initialShops, members: initialMembers }: { shops: Shop[], members: Profile[] }) {
  const [shops, setShops] = useState<Shop[]>(initialShops)
  const [members, setMembers] = useState<Profile[]>(initialMembers)
  const [activeTab, setActiveTab] = useState<'membres' | 'boutiques'>('membres')

  // Création compte
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('employe')
  const [shopId, setShopId] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Édition membre
  const [editingMember, setEditingMember] = useState<Profile | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editShopId, setEditShopId] = useState('')
  const [editColor, setEditColor] = useState('')

  // Boutiques
  const [showShopForm, setShowShopForm] = useState(false)
  const [shopName, setShopName] = useState('')
  const [shopCity, setShopCity] = useState('')
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [editShopName, setEditShopName] = useState('')
  const [editShopCity, setEditShopCity] = useState('')

  const supabase = createClient()

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

  async function handleUpdateMember(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMember) return
    await supabase.from('profiles').update({
      role: editRole,
      shop_id: editShopId || null,
      color: editColor
    }).eq('id', editingMember.id)
    setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, role: editRole as any, shop_id: editShopId || null, color: editColor } : m))
    setEditingMember(null)
    setSuccess('Profil mis à jour ✓')
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleDeleteMember(id: string) {
    if (!confirm('Supprimer ce compte ? Cette action est irréversible.')) return
    await fetch('/api/admin/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: id }) })
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function handleCreateShop(e: React.FormEvent) {
    e.preventDefault()
    const { data } = await supabase.from('shops').insert({ name: shopName, city: shopCity || null }).select().single()
    if (data) { setShops(prev => [...prev, data]); setShopName(''); setShopCity(''); setShowShopForm(false) }
  }

  async function handleUpdateShop(e: React.FormEvent) {
    e.preventDefault()
    if (!editingShop) return
    await supabase.from('shops').update({ name: editShopName, city: editShopCity || null }).eq('id', editingShop.id)
    setShops(prev => prev.map(s => s.id === editingShop.id ? { ...s, name: editShopName, city: editShopCity } : s))
    setEditingShop(null)
  }

  async function handleDeleteShop(id: string) {
    if (!confirm('Supprimer cette boutique ? Les salariés assignés seront désassignés.')) return
    await supabase.from('shops').delete().eq('id', id)
    setShops(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Administration</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeTab === 'membres' && (
            <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: 12 }}>+ Créer un compte</button>
          )}
          {activeTab === 'boutiques' && (
            <button className="btn-primary" onClick={() => setShowShopForm(!showShopForm)} style={{ fontSize: 12 }}>+ Ajouter une boutique</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button onClick={() => setActiveTab('membres')} style={{ padding: '6px 16px', fontSize: 13, borderRadius: 20, border: 'none', cursor: 'pointer', background: activeTab === 'membres' ? '#6964FC' : '#eee', color: activeTab === 'membres' ? '#fff' : '#666' }}>
          Membres ({members.length})
        </button>
        <button onClick={() => setActiveTab('boutiques')} style={{ padding: '6px 16px', fontSize: 13, borderRadius: 20, border: 'none', cursor: 'pointer', background: activeTab === 'boutiques' ? '#6964FC' : '#eee', color: activeTab === 'boutiques' ? '#fff' : '#666' }}>
          Boutiques ({shops.length})
        </button>
      </div>

      {success && <div style={{ fontSize: 12, color: '#3B6D11', background: '#EAF3DE', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{success}</div>}

      {/* ===== ONGLET MEMBRES ===== */}
      {activeTab === 'membres' && (
        <>
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
                <div style={{ gridColumn: 'span 2' }}>
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

          {/* Modal édition membre */}
          {editingMember && (
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <div className="card" style={{ maxWidth: 400, width: '100%' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Modifier — {editingMember.full_name}</div>
                <form onSubmit={handleUpdateMember}>
                  <div style={{ marginBottom: 10 }}>
                    <label>Rôle</label>
                    <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label>Boutique</label>
                    <select value={editShopId} onChange={e => setEditShopId(e.target.value)}>
                      <option value="">Aucune boutique</option>
                      {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label>Couleur</label>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {COLORS.map(c => (
                        <div key={c} onClick={() => setEditColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', outline: editColor === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" type="submit">Sauvegarder</button>
                    <button className="btn-secondary" type="button" onClick={() => setEditingMember(null)}>Annuler</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8f8fa', borderRadius: 8, border: '0.5px solid #eee' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color || '#6964FC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                    {m.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.full_name}</div>
                    <span className={`badge ${roleBadgeClass(m.role)}`} style={{ fontSize: 10, marginTop: 2 }}>{ROLES.find(r => r.value === m.role)?.label}</span>
                    {(m as any).shop && <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{(m as any).shop.name}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button onClick={() => { setEditingMember(m); setEditRole(m.role); setEditShopId(m.shop_id || ''); setEditColor(m.color || '#6964FC') }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#6964FC', padding: '2px 4px' }} title="Modifier">✏️</button>
                    <button onClick={() => handleDeleteMember(m.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#A32D2D', padding: '2px 4px' }} title="Supprimer">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== ONGLET BOUTIQUES ===== */}
      {activeTab === 'boutiques' && (
        <>
          {showShopForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Nouvelle boutique</div>
              <form onSubmit={handleCreateShop} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label>Nom de la boutique</label><input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Ex : Paris 11" required /></div>
                <div><label>Ville</label><input value={shopCity} onChange={e => setShopCity(e.target.value)} placeholder="Ex : Paris" /></div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8 }}>
                  <button className="btn-primary" type="submit">Créer la boutique</button>
                  <button className="btn-secondary" type="button" onClick={() => setShowShopForm(false)}>Annuler</button>
                </div>
              </form>
            </div>
          )}

          {editingShop && (
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <div className="card" style={{ maxWidth: 380, width: '100%' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Modifier la boutique</div>
                <form onSubmit={handleUpdateShop}>
                  <div style={{ marginBottom: 10 }}><label>Nom</label><input value={editShopName} onChange={e => setEditShopName(e.target.value)} required /></div>
                  <div style={{ marginBottom: 14 }}><label>Ville</label><input value={editShopCity} onChange={e => setEditShopCity(e.target.value)} /></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" type="submit">Sauvegarder</button>
                    <button className="btn-secondary" type="button" onClick={() => setEditingShop(null)}>Annuler</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            {shops.length === 0 && <p style={{ fontSize: 13, color: '#888' }}>Aucune boutique créée.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shops.map(shop => {
                const shopMembers = members.filter(m => m.shop_id === shop.id)
                return (
                  <div key={shop.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8f8fa', borderRadius: 8, border: '0.5px solid #eee' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>🏪 {shop.name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {shop.city && `${shop.city} · `}{shopMembers.length} salarié{shopMembers.length > 1 ? 's' : ''}
                        {shopMembers.length > 0 && (
                          <span style={{ marginLeft: 6 }}>
                            {shopMembers.map(m => (
                              <span key={m.id} style={{ display: 'inline-block', width: 18, height: 18, borderRadius: '50%', background: m.color || '#888', marginRight: 3, verticalAlign: 'middle', title: m.full_name }} />
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditingShop(shop); setEditShopName(shop.name); setEditShopCity(shop.city || '') }}
                        style={{ background: '#EEEDFE', color: '#3C3489', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>✏️ Modifier</button>
                      <button onClick={() => handleDeleteShop(shop.id)}
                        style={{ background: '#FCEBEB', color: '#A32D2D', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>🗑 Supprimer</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
