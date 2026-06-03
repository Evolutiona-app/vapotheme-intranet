'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8) { setError('Minimum 8 caractères.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard/accueil')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#13132b' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 380 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Définir votre mot de passe</h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Bienvenue ! Choisissez un mot de passe pour accéder à votre espace.</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}><label>Mot de passe</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 caractères" required /></div>
          <div style={{ marginBottom: 20 }}><label>Confirmer</label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répéter" required /></div>
          {error && <div style={{ fontSize: 12, color: '#A32D2D', background: '#FCEBEB', padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
            {loading ? 'Enregistrement...' : 'Accéder à mon espace'}
          </button>
        </form>
      </div>
    </div>
  )
}
