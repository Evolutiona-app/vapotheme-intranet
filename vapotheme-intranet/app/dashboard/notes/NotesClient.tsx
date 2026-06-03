'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Shop, Note } from '@/types'

export default function NotesClient({ currentProfile, shops, initialNotes }: { currentProfile: Profile, shops: Shop[], initialNotes: Note[] }) {
  const isAdmin = currentProfile.role === 'admin' || currentProfile.role === 'manager'
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'shop'>('all')
  const [shopId, setShopId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const { data } = await supabase.from('notes').insert({
      author_id: currentProfile.id, title, content,
      visibility, shop_id: visibility === 'shop' ? shopId || currentProfile.shop_id : null
    }).select('*, author:profiles(full_name)').single()
    if (data) { setNotes(prev => [data, ...prev]); setTitle(''); setContent('') }
    setSubmitting(false)
  }

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Notes</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Toutes les notes</div>
          {notes.length === 0 && <p style={{ fontSize: 13, color: '#888' }}>Aucune note.</p>}
          {notes.map(note => (
            <div key={note.id} style={{ padding: '10px 0', borderBottom: '0.5px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{note.title}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                    {(note.author as any)?.full_name} · {new Date(note.created_at).toLocaleDateString('fr-FR')}
                    {note.visibility === 'shop' && <span className="badge badge-violet" style={{ marginLeft: 6, fontSize: 9 }}>Boutique</span>}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#666', margin: '6px 0 0', lineHeight: 1.5 }}>{note.content}</p>
            </div>
          ))}
        </div>

        {isAdmin ? (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Publier une note <span className="badge badge-violet" style={{ fontSize: 10 }}>Admin</span></div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 10 }}><label>Titre</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex : Réunion jeudi 14h" required /></div>
              <div style={{ marginBottom: 10 }}><label>Contenu</label><textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Détails..." style={{ height: 90, resize: 'vertical' }} required /></div>
              <div style={{ marginBottom: 10 }}>
                <label>Visibilité</label>
                <select value={visibility} onChange={e => setVisibility(e.target.value as 'all' | 'shop')}>
                  <option value="all">Toute l&apos;équipe</option>
                  <option value="shop">Boutique spécifique</option>
                </select>
              </div>
              {visibility === 'shop' && (
                <div style={{ marginBottom: 10 }}>
                  <label>Boutique</label>
                  <select value={shopId} onChange={e => setShopId(e.target.value)}>
                    <option value="">Ma boutique</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <button className="btn-primary" type="submit" disabled={submitting}>{submitting ? 'Publication...' : 'Publier'}</button>
            </form>
          </div>
        ) : (
          <div className="card">
            <div style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}>
              🔒 Seuls les admins peuvent publier des notes.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
