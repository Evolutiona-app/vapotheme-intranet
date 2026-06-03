export type Role = 'admin' | 'manager' | 'employe'
export type ShiftDay = 'Lun' | 'Mar' | 'Mer' | 'Jeu' | 'Ven' | 'Sam' | 'Dim'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type LeaveType = 'CP' | 'RTT' | 'Maladie' | 'Sans solde'

export interface Shop {
  id: string
  name: string
  city: string | null
  created_at: string
}

export interface Profile {
  id: string
  auth_user_id: string
  full_name: string
  role: Role
  color: string
  shop_id: string | null
  created_at: string
  shop?: Shop
}

export interface ScheduleTemplate {
  id: string
  shop_id: string
  profile_id: string
  day_of_week: ShiftDay
  shift: string
  updated_at: string
  profile?: Profile
}

export interface Renfort {
  id: string
  profile_id: string
  from_shop_id: string
  to_shop_id: string
  date: string
  shift: string
  note: string | null
  created_at: string
  profile?: Profile
  from_shop?: Shop
  to_shop?: Shop
}

export interface LeaveRequest {
  id: string
  profile_id: string
  shop_id: string
  start_date: string
  end_date: string
  type: LeaveType
  status: LeaveStatus
  message: string | null
  created_at: string
  profile?: Profile
  shop?: Shop
}

export interface Note {
  id: string
  author_id: string
  title: string
  content: string
  visibility: 'all' | 'shop'
  shop_id: string | null
  created_at: string
  author?: Profile
}

export interface CustomShift {
  id: string
  shop_id: string
  label: string
  created_at: string
}
