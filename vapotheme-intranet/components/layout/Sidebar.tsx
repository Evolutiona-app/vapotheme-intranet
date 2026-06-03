'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const navItems = [
  { href: '/dashboard/accueil', label: 'Accueil', icon: '⌂' },
  { href: '/dashboard/planning', label: 'Planning', icon: '📅' },
  { href: '/dashboard/conges', label: 'Congés', icon: '☀' },
  { href: '/dashboard/notes', label: 'Notes', icon: '📝' },
  { href: '/dashboard/vacances', label: 'Vacances', icon: '🏖' },
  { href: '/dashboard/compte', label: 'Mon compte', icon: '👤' },
]

const adminItems = [
  { href: '/dashboard/equipe', label: 'Équipe & comptes', icon: '👥' },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  // Ferme le menu quand on change de page
  useEffect(() => { setOpen(false) }, [pathname])

  // Empêche le scroll du body quand menu ouvert sur mobile
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = profile.role === 'admin'
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)
  const currentPage = navItems.find(i => i.href === pathname)?.label || adminItems.find(i => i.href === pathname)?.label || 'Vapotheme'

  return (
    <>
      {/* Header mobile */}
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
          <span></span><span></span><span></span>
        </button>
        <span className="mobile-header-title">Vapotheme</span>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: profile.color || '#6964FC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff' }}>
          {initials}
        </div>
      </div>

      {/* Overlay */}
      <div className={`sidebar-overlay${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div style={{ padding: '16px 16px 14px', borderBottom: '0.5px solid rgba(255,255,255,0.08)', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>Vapotheme</span>
            <small style={{ display: 'block', color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>Espace équipe</small>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, padding: '0 4px' }}>✕</button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`nav-item${pathname === item.href ? ' active' : ''}`}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <div style={{ padding: '10px 16px 3px', fontSize: 10, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 6 }}>Admin</div>
              {adminItems.map(item => (
                <Link key={item.href} href={item.href} className={`nav-item${pathname === item.href ? ' active' : ''}`}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div onClick={handleLogout} style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} title="Se déconnecter">
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: profile.color || '#6964FC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block' }}>{profile.full_name}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
              {profile.role === 'admin' ? 'Admin' : profile.role === 'manager' ? 'Manager' : 'Employé'}
              {(profile as any).shop && ` · ${(profile as any).shop.name}`}
            </span>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>↩</span>
        </div>
      </aside>
    </>
  )
}
