'use client'
import type { Profile, LeaveRequest } from '@/types'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAY_LABELS = ['D','L','M','M','J','V','S']

function isOnLeave(profile: Profile, year: number, month: number, day: number, leaves: LeaveRequest[]) {
  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  return leaves.some(l => l.profile_id === profile.id && l.start_date <= dateStr && l.end_date >= dateStr)
}

export default function VacancesClient({ currentProfile, profiles, leaves }: { currentProfile: Profile, profiles: Profile[], leaves: LeaveRequest[] }) {
  const year = new Date().getFullYear()
  const today = new Date()

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Planning vacances {year}</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Vue annuelle — congés approuvés uniquement</p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {profiles.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color || '#888' }}></div>
            {p.full_name}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {MONTHS.map((monthName, mi) => {
          const firstDay = new Date(year, mi, 1).getDay()
          const daysInMonth = new Date(year, mi+1, 0).getDate()
          return (
            <div key={mi} className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{monthName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {DAY_LABELS.map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: 9, color: '#aaa', padding: '2px 0', fontWeight: 500 }}>{d}</div>
                ))}
                {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
                {Array(daysInMonth).fill(null).map((_, i) => {
                  const day = i + 1
                  const isToday = year === today.getFullYear() && mi === today.getMonth() && day === today.getDate()
                  const onLeaveProfiles = profiles.filter(p => isOnLeave(p, year, mi, day, leaves))
                  const firstColor = onLeaveProfiles[0]?.color

                  return (
                    <div
                      key={day}
                      style={{
                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, borderRadius: isToday ? '50%' : 3,
                        fontWeight: onLeaveProfiles.length > 0 ? 600 : 400,
                        background: isToday ? '#6964FC' : firstColor ? firstColor + '33' : 'transparent',
                        color: isToday ? '#fff' : firstColor || '#888',
                        outline: onLeaveProfiles.length > 1 ? `1.5px solid ${onLeaveProfiles[1]?.color}` : 'none',
                        outlineOffset: '-1px',
                      }}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
