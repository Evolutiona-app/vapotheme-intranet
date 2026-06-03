'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Shop, ScheduleTemplate, CustomShift, Renfort } from '@/types'

const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'] as const
const BASE_SHIFTS = ['9h–17h','10h–18h','11h–19h','14h–22h','8h–16h','12h–20h','9h–13h','14h–18h','Repos','Congé']

function getWeekDates(weekOffset: number) {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff + weekOffset * 7)
  monday.setHours(0,0,0,0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toISO(d: Date) {
  return d.toISOString().slice(0,10)
}

function formatDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function isToday(d: Date) {
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

function shiftStyle(s: string, isOverride = false) {
  if (!s || s === 'Repos') return { background: '#f4f4f6', color: '#888' }
  if (s === 'Congé') return { background: '#FAEEDA', color: '#633806' }
  if (isOverride) return { background: '#FFF3E0', color: '#E65100', border: '1px solid #FFB74D' }
  if (['9h–17h','10h–18h','11h–19h','8h–16h','9h–13h'].includes(s)) return { background: '#E6F1FB', color: '#185FA5' }
  if (['14h–22h','12h–20h','14h–18h'].includes(s)) return { background: '#EAF3DE', color: '#3B6D11' }
  return { background: '#EEEDFE', color: '#3C3489' }
}

interface Override { id: string; profile_id: string; date: string; shift: string }

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
  const [overrides, setOverrides] = useState<Override[]>([])
  const [editingCell, setEditingCell] = useState<{ profileId: string; day: string; dayIdx: number; current: string; hasOverride: boolean } | null>(null)
  const [customInput, setCustomInput] = useState('')
  const [localCustomShifts, setLocalCustomShifts] = useState<CustomShift[]>(customShifts)
  const [showRenfortForm, setShowRenfortForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const weekDates = getWeekDates(weekOffset)

  // Charger les overrides pour la semaine affichée
  useEffect(() => {
    const start = toISO(weekDates[0])
    const end = toISO(weekDates[6])
    supabase.from('schedule_overrides')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .then(({ data }) => { if (data) setOverrides(data) })
  }, [weekOffset, activeShop])

  const weekLabel = weekOffset === 0 ? 'Cette semaine' : weekOffset === 1 ? 'Semaine prochaine' : weekOffset === -1 ? 'Semaine dernière' : `${formatDate(weekDates[0])} – ${formatDate(weekDates[6])}`
  const shopProfiles = profiles.filter(p => p.shop_id === activeShop)
  const shopRenforts = renforts.filter(r => r.to_shop_id === activeShop)

  function getShift(profileId: string, dayIdx: number) {
    const dateStr = toISO(weekDates[dayIdx])
    const override = overrides.find(o => o.profile_id === profileId && o.date === dateStr)
    if (override) return { shift: override.shift, isOverride: true }
    const template = localTemplates.find(t => t.profile_id === profileId && t.day_of_week === DAYS[dayIdx])
    return { shift: template?.shift || 'Repos', isOverride: false }
  }

  async function saveShiftBase(profileId: string, day: string, shift: string) {
    setSaving(true)
    const existing = localTemplates.find(t => t.profile_id === profileId && t.day_of_week === day)
    if (existing) {
      await supabase.from('schedule_templates').update({ shift }).eq('id', existing.id)
      setLocalTemplates(prev => prev.map(t => t.id === existing.id ? { ...t, shift } : t))
    } else {
      const { data } = await supabase.from('schedule_templates').insert({ shop_id: activeShop, profile_id: profileId, day_of_week: day, shift }).select().single()
      if (data) setLocalTemplates(prev => [...prev, data])
    }
    setSaving(false)
    setEditingCell(null)
  }

  async function saveShiftOverride(profileId: string, dayIdx: number, shift: string) {
    setSaving(true)
    const dateStr = toISO(weekDates[dayIdx])
    const { data } = await supabase.from('schedule_overrides')
      .upsert({ profile_id: profileId, shop_id: activeShop, date: dateStr, shift, created_by: currentProfile.id }, { onConflict: 'profile_id,date' })
      .select().single()
    if (data) setOverrides(prev => [...prev.filter(o => !(o.profile_id === profileId && o.date === dateStr)), data])
    setSaving(false)
    setEditingCell(null)
  }

  async function removeOverride(profileId: string, dayIdx: number) {
    const dateStr = toISO(weekDates[dayIdx])
    await supabase.from('schedule_overrides').delete().eq('profile_id', profileId).eq('date', dateStr)
    setOverrides(prev => prev.filter(o => !(o.profile_id === profileId && o.date === dateStr)))
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Planning</h1>
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
            {editMode ? '✓ Terminer' : '✏ Modifier'}
          </button>
        )}
      </div>

      {/* Navigation semaine */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 13 }}>← Préc.</button>
        <span style={{ fontSize: 13, fontWeight: 500, minWidth: 180, textAlign: 'center' }}>{weekLabel}</span>
        <button onClick={() => setWeekOffset(w => w + 1)} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 13 }}>Suiv. →</button>
        {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ fontSize: 11, color: '#6964FC', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Aujourd'hui</button>}
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#E6F1FB', border: '0.5px solid #ddd' }}></div> Planning de base
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#FFF3E0', border: '1px solid #FFB74D' }}></div> Exception cette semaine
        </div>
      </div>

      {!isAdmin && <div style={{ fontSize: 11, color: '#888', background: '#f8f8fa', padding: '8px 12px', borderRadius: 8, marginBottom: 10 }}>🔒 Lecture seule</div>}

      {/* Grille */}
      <div className="card" style={{ marginBottom: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2, minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ width: 110, background: '#f4f4f6', borderRadius: 4, padding: '6px 8px' }}></th>
              {DAYS.map((d, i) => {
                const date = weekDates[i]
                const today = isToday(date)
                return (
                  <th key={d} style={{ textAlign: 'center', padding: '6px 4px', background: today ? '#EEEDFE' : '#f4f4f6', borderRadius: 4, minWidth: 78 }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: '#f4f4f6', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: emp.color, flexShrink: 0 }}></div>
                    {emp.full_name.split(' ')[0]}
                  </div>
                </td>
                {DAYS.map((day, di) => {
                  const { shift, isOverride } = getShift(emp.id, di)
                  const st = shiftStyle(shift, isOverride)
                  const isEditing = editingCell?.profileId === emp.id && editingCell?.dayIdx === di
                  return (
                    <td key={day} style={{ padding: '2px 2px' }}>
                      <div onClick={() => editMode && isAdmin && setEditingCell({ profileId: emp.id, day, dayIdx: di, current: shift, hasOverride: isOverride })}
                        style={{ ...st, padding: '5px 3px', textAlign: 'center', borderRadius: 4, fontSize: 10, fontWeight: 500, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: editMode && isAdmin ? 'pointer' : 'default', outline: isEditing ? '2px solid #6964FC' : 'none' }}>
                        <span>{shift || '—'}</span>
                        {isOverride && <span style={{ fontSize: 8, opacity: .7 }}>★ exception</span>}
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
          <div className="card" style={{ maxWidth: 440, width: '100%' }}>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              {profiles.find(p => p.id === editingCell.profileId)?.full_name} · {editingCell.day} {formatDate(weekDates[editingCell.dayIdx])}
            </div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Choisis le créneau puis indique si c'est une exception (cette semaine uniquement) ou une modification permanente du planning de base.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 12 }}>
              {allShifts.map(s => (
                <button key={s} onClick={() => setEditingCell(prev => prev ? { ...prev, current: s } : null)}
                  style={{ ...shiftStyle(s), padding: '7px 4px', fontSize: 11, borderRadius: 8, border: s === editingCell.current ? '2px solid #6964FC' : '0.5px solid #ddd', cursor: 'pointer', fontWeight: 500 }}>
                  {s}
                </button>
              ))}
            </div>

            <div style={{ borderTop: '0.5px solid #eee', paddingTop: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Créneau personnalisé</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={customInput} onChange={e => setCustomInput(e.target.value)} placeholder="Ex: 7h–15h..." style={{ flex: 1, fontSize: 12 }} onKeyDown={e => { if (e.key === 'Enter') { setEditingCell(prev => prev ? { ...prev, current: customInput } : null); setCustomInput('') } }} />
                <button className="btn-secondary" onClick={() => { setEditingCell(prev => prev ? { ...prev, current: customInput } : null); setCustomInput('') }} style={{ fontSize: 11 }}>OK</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => saveShiftOverride(editingCell.profileId, editingCell.dayIdx, editingCell.current)} disabled={saving}
                style={{ fontSize: 12, background: '#F57C00' }}>
                📅 Cette semaine seulement
              </button>
              <button className="btn-primary" onClick={() => saveShiftBase(editingCell.profileId, editingCell.day, editingCell.current)} disabled={saving}
                style={{ fontSize: 12 }}>
                🔄 Modifier le planning de base
              </button>
              {editingCell.hasOverride && (
                <button onClick={() => removeOverride(editingCell.profileId, editingCell.dayIdx)} disabled={saving}
                  style={{ fontSize: 12, background: '#FCEBEB', color: '#A32D2D', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer' }}>
                  ✕ Supprimer l'exception
                </button>
              )}
              <button className="btn-secondary" onClick={() => setEditingCell(null)} style={{ fontSize: 12 }}>Annuler</button>
            </div>
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
              <span style={{ color: '#888' }}>{(rf as any).from_shop?.name} → {(rf as any).to_shop?.name}</span>
              <span style={{ color: '#888' }}>{new Date(rf.date).toLocaleDateString('fr-FR')} · {rf.shift}</span>
              {rf.note && <span style={{ color: '#aaa', fontStyle: 'italic' }}>{rf.note}</span>}
            </div>
            {isAdmin && (
              <button onClick={async () => { await supabase.from('renforts').delete().eq('id', rf.id); window.location.reload() }}
                style={{ background: '#FCEBEB', color: '#A32D2D', border: 'none', padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Supprimer</button>
            )}
          </div>
        ))}
        {showRenfortForm && isAdmin && (
          <RenfortForm shops={shops} profiles={profiles} currentShopId={activeShop} onClose={() => setShowRenfortForm(false)} supabase={supabase} />
        )}
      </div>
    </div>
  )
}

function RenfortForm({ shops, profiles, currentShopId, onClose, supabase }: any) {
  const [empId, setEmpId] = useState('')
  const [date, setDate] = useState('')
  const [shift, setShift] = useState('9h–17h')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const otherProfiles = profiles.filter((p: Profile) => p.shop_id !== currentShopId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!empId || !date) return
    setSaving(true)
    const emp = profiles.find((p: Profile) => p.id === empId)
    await supabase.from('renforts').insert({ profile_id: empId, from_shop_id: emp?.shop_id, to_shop_id: currentShopId, date, shift, note: note || null })
    setSaving(false)
    onClose()
    window.location.reload()
  }

  return (
    <div style={{ background: 'rgba(0,0,0,0.1)', borderRadius: 10, padding: 16, marginTop: 12 }}>
      <div className="card" style={{ maxWidth: 380 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Ajouter un renfort</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}><label>Employé</label>
            <select value={empId} onChange={e => setEmpId(e.target.value)} required>
              <option value="">Choisir...</option>
              {otherProfiles.map((p: Profile) => <option key={p.id} value={p.id}>{p.full_name} ({(p as any).shop?.name || '—'})</option>)}
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
