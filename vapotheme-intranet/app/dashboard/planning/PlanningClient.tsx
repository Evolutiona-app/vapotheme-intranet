'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Shop, ScheduleTemplate, CustomShift, Renfort } from '@/types'

const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'] as const
const BASE_SHIFTS = ['9h–17h','10h–18h','11h–19h','14h–22h','8h–16h','12h–20h','9h–13h','14h–18h','Repos','Congé']

function getWeekDates(weekOffset: number) {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff + weekOffset * 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function isToday(d: Date) {
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

function shiftStyle(s: string) {
  if (!s || s === 'Repos') return { background: '#f4f4f6', color: '#888' }
  if (s === 'Congé') return { background: '#FAEEDA', color: '#633806' }
  if (['9h–17h','10h–18h','11h–19h','8h–16h','9h–13h'].includes(s)) return { background: '#E6F1FB', color: '#185FA5' }
  if (['14h–22h','12h–20h','14h–18h'].includes(s)) return { background: '#EAF3DE', color: '#3B6D11' }
  return { background: '#EEEDFE', color: '#3C3489' }
}

interface Props {
  currentProfile: Profile
  shops: Shop[]
  profiles: Profile[]
  templates: ScheduleTemplate[]
  customShifts: CustomShift[]
  renforts: Renfort[]
}

export default function PlanningClient({ currentProfile, shops, profiles, templates, customShifts, renforts }: Props) {
  const isAdmin = currentProfile.role === 'admin' || currentProfile.role === 'manager'
  const [activeShop, setActiveShop] = useState(currentProfile.shop_id || shops[0]?.id || '')
  const [weekOffset, setWeekOffset] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [localTemplates, setLocalTemplates] = useState<ScheduleTemplate[]>(templates)
  const [editingCell, setEditingCell] = useState<{ profileId: string; day: string; current: string } | null>(null)
  const [customInput, setCustomInput] = useState('')
  const [localCustomShifts, setLocalCustomShifts] = useState<CustomShift[]>(customShifts)
  const [showRenfortForm, setShowRenfortForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const weekDates = getWeekDates(weekOffset)
  const shopProfiles = profiles.filter(p => p.shop_id === activeShop)
  const shopRenforts = renforts.filter(r => r.to_shop_id === activeShop)

  const weekLabel = (() => {
    const start = weekDates[0]
    const end = weekDates[6]
    if (weekOffset === 0) return 'Cette semaine'
    if (weekOffset === 1) return 'Semaine prochaine'
    if (weekOffset === -1) return 'Semaine dernière'
    return `${formatDate(start)} – ${formatDate(end)}`
  })()

  function getShift(profileId: string, day: string) {
    return localTemplates.find(t => t.profile_id === profileId && t.day_of_week === day)?.shift || 'Repos'
  }

  async function saveShift(profileId: string, day: string, shift: string) {
    setSaving(true)
    const existing = localTemplates.find(t => t.profile_id === profileId && t.day_of_week === day)
    if (existing) {
      await supabase.from('schedule_templates').update({ shift }).eq('id', existing.id)
      setLocalTemplates(prev => prev.map(t => t.id === existing.id ? { ...t, shift } : t))
    } else {
      const { data } = await supabase.from('schedule_templates').insert({
        shop_id: activeShop, profile_id: profileId, day_of_week: day, shift
      }).select().single()
      if (data) setLocalTemplates(prev => [...prev, data])
    }
    setSaving(false)
    setEditingCell(null)
  }

  async function saveCustomShift(label: string) {
    if (!label.trim()) return
    const { data } = await supabase.from('custom_shifts').upsert({ shop_id: activeShop, label: label.trim() }, { onConflict: 'shop_id,label' }).select().single()
    if (data) setLocalCustomShifts(prev => [...prev.filter(s => s.label !== label), data])
    setCustomInput('')
  }

  const allShifts = [...BASE_SHIFTS, ...localCustomShifts.filter(s => !BASE_SHIFTS.includes(s.label)).map(s => s.label)]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#201516', margin: 0 }}>Planning de référence</h1>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {shops.map(shop => (
            <button key={shop.id} onClick={() => { setActiveShop(shop.id); setEditMode(false); setEditingCell(null) }}
              style={{ padding: '4px 12px', fontSize: 12, borderRadius: 20, cursor: 'pointer', border: 'none', background: activeShop === shop.id ? '#6964FC' : '#eee', color: activeShop === shop.id ? '#fff' : '#666' }}>
              {shop.name}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button onClick={() => { setEditMode(!editMode); setEditingCell(null) }}
            className={editMode ? 'btn-primary' : 'btn-secondary'}
            style={{ marginLeft: 'auto', fontSize: 12, padding: '5px 14px' }}>
            {editMode ? '✓ Terminer' : '✏ Modifier le planning de base'}
          </button>
        )}
      </div>

      {/* Navigation semaine */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 13 }}>← Préc.</button>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#201516', minWidth: 180, textAlign: 'center' }}>{weekLabel}</span>
        <button onClick={() => setWeekOffset(w => w + 1)} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 13 }}>Suiv. →</button>
        {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ fontSize: 11, color: '#6964FC', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Aujourd'hui</button>}
      </div>

      {!isAdmin && (
        <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, background: '#f8f8fa', padding: '8px 12px', borderRadius: 8 }}>
          🔒 Lecture seule — seuls les patrons peuvent modifier le planning.
        </div>
      )}

      {editMode && isAdmin && (
        <div style={{ fontSize: 11, color: '#3C3489', background: '#EEEDFE', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
          ✏️ Mode édition — clique sur une cellule pour modifier le créneau. Les changements s'appliquent au planning de base (toutes les semaines).
        </div>
      )}

      {/* Grille planning */}
      <div className="card" style={{ marginBottom: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2, minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ width: 120, textAlign: 'left', fontSize: 11, color: '#888', padding: '6px 8px', background: '#f4f4f6', borderRadius: 4 }}></th>
              {DAYS.map((d, i) => {
                const date = weekDates[i]
                const today = isToday(date)
                return (
                  <th key={d} style={{ textAlign: 'center', padding: '6px 4px', background: today ? '#EEEDFE' : '#f4f4f6', borderRadius: 4, minWidth: 80 }}>
                    <div style={{ fontSize: 11, color: today ? '#6964FC' : '#888', fontWeight: today ? 600 : 500 }}>{d}</div>
                    <div style={{ fontSize: 11, color: today ? '#6964FC' : '#aaa', fontWeight: today ? 600 : 400 }}>{formatDate(date)}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {shopProfiles.map(emp => (
              <tr key={emp.id}>
                <td style={{ padding: '2px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: '#f4f4f6', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: emp.color, flexShrink: 0 }}></div>
                    {emp.full_name.split(' ')[0]}
                  </div>
                </td>
                {DAYS.map(day => {
                  const shift = getShift(emp.id, day)
                  const st = shiftStyle(shift)
                  const isEditing = editingCell?.profileId === emp.id && editingCell?.day === day
                  const empOut = renforts.find(r => r.emp === emp.id && r.day === day && r.to_shop_id !== activeShop)
                  return (
                    <td key={day} style={{ padding: '2px 2px' }}>
                      <div onClick={() => editMode && isAdmin && setEditingCell({ profileId: emp.id, day, current: shift })}
                        style={{ ...st, padding: '5px 3px', textAlign: 'center', borderRadius: 4, fontSize: 10, fontWeight: 500, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: editMode && isAdmin ? 'pointer' : 'default', border: isEditing ? '1.5px solid #6964FC' : `1px dashed ${editMode && isAdmin ? '#6964FC44' : 'transparent'}` }}>
                        {shift || '—'}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}

            {shopRenforts.map(rf => (
              <tr key={rf.id}>
                <td style={{ padding: '2px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: '#f4f4f6', borderRadius: 4, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: (rf as any).profile?.color || '#888', flexShrink: 0 }}></div>
                    <span style={{ color: '#666' }}>{(rf as any).profile?.full_name?.split(' ')[0]}</span>
                    <span style={{ fontSize: 9, background: '#EEEDFE', color: '#3C3489', padding: '1px 5px', borderRadius: 10 }}>Renfort</span>
                  </div>
                </td>
                {DAYS.map(d => {
                  const rfDate = new Date(rf.date)
                  const cellDate = weekDates[DAYS.indexOf(d)]
                  const match = rfDate.toDateString() === cellDate.toDateString()
                  return (
                    <td key={d} style={{ padding: '2px 2px' }}>
                      <div style={{ ...(match ? { background: '#EEEDFE', color: '#3C3489', border: '1px solid #6964FC44' } : { background: '#f4f4f6', color: '#aaa' }), padding: '5px 3px', textAlign: 'center', borderRadius: 4, fontSize: 10, fontWeight: 500, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        {match ? <><span>{rf.shift}</span><span style={{ fontSize: 9, opacity: .75 }}>↙{(rf as any).from_shop?.name}</span></> : '—'}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Éditeur créneau */}
      {editingCell && (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <div className="card" style={{ maxWidth: 420, width: '100%' }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>
              {profiles.find(p => p.id === editingCell.profileId)?.full_name} · {editingCell.day}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
              {allShifts.map(s => (
                <button key={s} onClick={() => saveShift(editingCell.profileId, editingCell.day, s)}
                  style={{ ...shiftStyle(s), padding: '8px 4px', fontSize: 11, borderRadius: 8, border: s === editingCell.current ? '2px solid #6964FC' : '0.5px solid #ddd', cursor: 'pointer', fontWeight: 500 }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ borderTop: '0.5px solid #eee', paddingTop: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Créneau personnalisé</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={customInput} onChange={e => setCustomInput(e.target.value)} placeholder="Ex: 7h–15h, Télétravail..." style={{ flex: 1, fontSize: 12 }} onKeyDown={e => e.key === 'Enter' && saveCustomShift(customInput)} />
                <button className="btn-secondary" onClick={() => saveCustomShift(customInput)} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>+ Ajouter</button>
              </div>
            </div>
            <button className="btn-secondary" onClick={() => setEditingCell(null)} style={{ fontSize: 12, width: '100%' }}>Annuler</button>
            {saving && <p style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 8 }}>Sauvegarde...</p>}
          </div>
        </div>
      )}

      {/* Renforts */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Renforts & exceptions</span>
          {isAdmin && <button className="btn-primary" onClick={() => setShowRenfortForm(!showRenfortForm)} style={{ fontSize: 11, padding: '5px 12px' }}>+ Ajouter un renfort</button>}
        </div>
        {shopRenforts.length === 0 && <p style={{ fontSize: 13, color: '#888' }}>Aucun renfort prévu.</p>}
        {shopRenforts.map(rf => (
          <div key={rf.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: (rf as any).profile?.color || '#888' }}></div>
              <strong>{(rf as any).profile?.full_name}</strong>
              <span style={{ color: '#888' }}>{(rf as any).from_shop?.name}</span>
              <span style={{ color: '#6964FC' }}>→</span>
              <strong>{(rf as any).to_shop?.name}</strong>
              <span style={{ color: '#888' }}>{new Date(rf.date).toLocaleDateString('fr-FR')} · {rf.shift}</span>
              {rf.note && <span style={{ color: '#aaa', fontStyle: 'italic' }}>{rf.note}</span>}
            </div>
            {isAdmin && (
              <button onClick={async () => { await createClient().from('renforts').delete().eq('id', rf.id); window.location.reload() }}
                style={{ background: '#FCEBEB', color: '#A32D2D', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Supprimer</button>
            )}
          </div>
        ))}
        {showRenfortForm && isAdmin && (
          <RenfortForm shops={shops} profiles={profiles} currentShopId={activeShop} onClose={() => setShowRenfortForm(false)} />
        )}
      </div>
    </div>
  )
}

function RenfortForm({ shops, profiles, currentShopId, onClose }: { shops: Shop[], profiles: Profile[], currentShopId: string, onClose: () => void }) {
  const [empId, setEmpId] = useState('')
  const [date, setDate] = useState('')
  const [shift, setShift] = useState('9h–17h')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const otherProfiles = profiles.filter(p => p.shop_id !== currentShopId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!empId || !date) return
    setSaving(true)
    const emp = profiles.find(p => p.id === empId)
    await supabase.from('renforts').insert({ profile_id: empId, from_shop_id: emp?.shop_id, to_shop_id: currentShopId, date, shift, note: note || null })
    setSaving(false)
    onClose()
    window.location.reload()
  }

  return (
    <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 20, marginTop: 12 }}>
      <div className="card" style={{ maxWidth: 380 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Ajouter un renfort</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}><label>Employé</label>
            <select value={empId} onChange={e => setEmpId(e.target.value)} required>
              <option value="">Choisir...</option>
              {otherProfiles.map(p => <option key={p.id} value={p.id}>{p.full_name} ({(p as any).shop?.name || 'Sans boutique'})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}><label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
          <div style={{ marginBottom: 8 }}><label>Créneau</label>
            <select value={shift} onChange={e => setShift(e.target.value)}>
              {BASE_SHIFTS.filter(s => s !== 'Repos' && s !== 'Congé').map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}><label>Note</label><input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex : Renfort soldes..." /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Confirmer'}</button>
            <button className="btn-secondary" type="button" onClick={onClose}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  )
}
