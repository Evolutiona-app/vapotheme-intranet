'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const COLORS = ['#6964FC','#1D9E75','#D85A30','#378ADD','#D4537E','#639922','#BA7517','#5DCAA5','#7F77DD','#E24B4A']

export default function AccountClient({ profile, email }: { profile: Profile, email: string }) {
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [color, setColor] = useState(profile.color || '#6964FC')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [colorLoading, setColorLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [colorSuccess, setColorSuccess] = useState('')
  const supabase = createClient()

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return }
    if (newPwd.length < 8) { setPwdError('Minimum 8 caractères.'); return }
    setPwdLoading(true)
    setPwdError('')

    // Vérifier l'ancien mot de passe
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPwd })
    if (signInError) { setPwdError('Mot de passe actuel incorrect.'); setPwdLoading(false); return }

    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) { setPwdError(error.message); setPwdLoading(false); return }
    setPwdSuccess('Mot de passe modifié avec succès ✓')
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    setPwdLoading(false)
    setTimeout(() => setPwdSuccess(''), 4000)
  }

  async function handleChangeColor() {
    setColorLoading(true)
    await supabase.from('profiles').update({ color }).eq('id', profile.id)
    setColorSuccess('Couleur mise à jour ✓')
    setColorLoading(false)
    setTimeout(() => setColorSuccess(''), 3000)
  }

  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)
  const roleLabel = profile.role === 'admin' ? 'Admin' : profile.role === 'manager' ? 'Manager' : 'Employé'

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Mon compte</h1>

      {/* Infos */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{profile.full_name}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{email}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <span className="badge badge-violet" style={{ fontSize: 11 }}>{roleLabel}</span>
            {(profile as any).shop && <span className="badge badge-green" style={{ fontSize: 11 }}>{(profile as any).shop.name}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Changement mot de passe */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Changer le mot de passe</div>
          {pwdSuccess && <div style={{ fontSize: 12, color: '#3B6D11', background: '#EAF3DE', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>{pwdSuccess}</div>}
          {pwdError && <div style={{ fontSize: 12, color: '#A32D2D', background: '#FCEBEB', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>{pwdError}</div>}
          <form onSubmit={handleChangePwd}>
            <div style={{ marginBottom: 10 }}>
              <label>Mot de passe actuel</label>
              <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" required />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Nouveau mot de passe</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimum 8 caractères" required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Confirmer le nouveau mot de passe</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Répéter" required />
            </div>
            <button className="btn-primary" type="submit" disabled={pwdLoading}>
              {pwdLoading ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>

        {/* Couleur planning */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Ma couleur dans le planning</div>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Cette couleur identifie tes créneaux dans le planning.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 3, transition: 'outline 0.1s' }} />
            ))}
          </div>
          {colorSuccess && <div style={{ fontSize: 12, color: '#3B6D11', background: '#EAF3DE', padding: '8px 12px', borderRadius: 8, marginBottom: 10 }}>{colorSuccess}</div>}
          <button className="btn-primary" onClick={handleChangeColor} disabled={colorLoading}>
            {colorLoading ? 'Sauvegarde...' : 'Sauvegarder la couleur'}
          </button>
        </div>
      </div>
    </div>
  )
}
