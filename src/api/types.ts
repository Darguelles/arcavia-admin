// DTO types mirroring backend Pydantic models

export type Role = 'admin' | 'player'

export interface TokenPayload {
  sub: string
  role: Role
  exp: number
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  force_password_reset?: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// City

export interface City {
  id: string
  name: string
  slug: string
  country: string
  default_language: string
  timezone: string
  legal_regime: 'GDPR' | 'LEY_29733'
  bbox_north: number
  bbox_south: number
  bbox_east: number
  bbox_west: number
  center_lat: number
  center_lng: number
  map_tile_url?: string
  is_active: boolean
  launch_date?: string
  campaign_count: number
  translations: Record<string, { name: string }>
}

export type CityCreate = Omit<City, 'id' | 'campaign_count'>
export type CityUpdate = Partial<CityCreate>

// Campaign

export interface Campaign {
  id: string
  city_id: string
  city_name: string
  name: string
  description: string
  is_active: boolean
  starts_at?: string
  ends_at?: string
  mission_count: number
  translations: Record<string, { name: string; description: string }>
}

export type CampaignCreate = Omit<Campaign, 'id' | 'mission_count' | 'city_name'>
export type CampaignUpdate = Partial<CampaignCreate>

// Mission

export interface Mission {
  id: string
  campaign_id: string
  campaign_name: string
  city_id: string
  name: string
  description: string
  lat?: number
  lng?: number
  tolerance_radius_m: number
  points: number
  is_active: boolean
  challenge_count: number
  has_qr: boolean
  calibration_notes?: string
  translations: Record<string, { name: string; description: string }>
}

export type MissionCreate = Omit<
  Mission,
  'id' | 'challenge_count' | 'has_qr' | 'campaign_name' | 'city_id'
>
export type MissionUpdate = Partial<MissionCreate>

// Challenge / Option

export interface Option {
  id: string
  challenge_id: string
  text: string
  is_correct: boolean
  order_index: number
  translations: Record<string, { text: string }>
}

export type OptionCreate = Omit<Option, 'id' | 'challenge_id'>
export type OptionUpdate = Partial<OptionCreate>

export interface Challenge {
  id: string
  mission_id: string
  prompt: string
  order_index: number
  options: Option[]
  translations: Record<string, { prompt: string }>
}

export type ChallengeCreate = Omit<Challenge, 'id' | 'mission_id' | 'options'> & {
  options: OptionCreate[]
}
export type ChallengeUpdate = Partial<ChallengeCreate>

// QR

export interface QRCode {
  id: string
  mission_id: string
  token: string
  is_active: boolean
  created_at: string
}

// User

export interface User {
  id: string
  email: string
  display_name?: string
  role: Role
  is_active: boolean
  registered_at: string
  last_activity_at?: string
  force_password_reset: boolean
}

export interface UserDetail extends User {
  completions: MissionCompletion[]
  points_per_city: Record<string, number>
}

export interface MissionCompletion {
  mission_id: string
  mission_name: string
  city_name: string
  completed_at: string
  points: number
}

export interface PasswordResetResponse {
  temp_password: string
}

// Settings

export interface Setting {
  key: string
  value: unknown
}

// Dashboard

export interface DashboardStats {
  active_cities: number
  active_campaigns: number
  active_missions: number
  total_players: number
  recent_completions: number
}

export interface TopScorer {
  user_id: string
  display_name: string
  email: string
  points: number
  city_name: string
}

// Paginated response

export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}
