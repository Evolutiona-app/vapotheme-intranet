'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const navItems = [
  
  { href: '/dashboard/accueil', label: 'Accueil', icon: '⌂' },
  { href: '/dashboard/conges', label: 'Congés', icon: '☀' },
  { href: '/dashboard/planning', label: 'Planning', icon: '📅' },
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
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = profile.role === 'admin'

  return (
    <aside className="sidebar" style={{
      width: 200, minHeight: '100vh', display: 'flex',
      flexDirection: 'column', flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 16px 18px', borderBottom: '0.5px solid rgba(255,255,255,0.08)', marginBottom: 6 }}>
        <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>Vapotheme</span>
        <small style={{ display: 'block', color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>Espace équipe</small>
      </div>

      {/* Nav principal */}
      <nav style={{ flex: 1 }}>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${pathname === item.href ? ' active' : ''}`}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* Section admin */}
        {isAdmin && (
          <>
            <div style={{ padding: '10px 16px 3px', fontSize: 10, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 8 }}>
              Admin
            </div>
            {adminItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${pathname === item.href ? ' active' : ''}`}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Profil utilisateur */}
      <div
        onClick={handleLogout}
        style={{
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
          padding: '12px 14px', display: 'flex', alignItems: 'center',
          gap: 10, cursor: 'pointer'
        }}
        title="Se déconnecter"
      >
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: profile.color || '#6964FC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0
        }}>
          {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
        </div>
        <div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block' }}>{profile.full_name}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
            {profile.role === 'admin' ? 'Admin' : profile.role === 'manager' ? 'Manager' : 'Employé'}
            {profile.shop && ` · ${profile.shop.name}`}
          </span>
        </div>
      </div>
    </aside>
  )
}
