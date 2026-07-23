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

// Mission (v2: Mission → Phases → Waypoints → Challenges; categories cross-cut)

export type Difficulty = 'baja' | 'media' | 'alta'

export interface Mission {
  id: string
  campaign_id: string
  campaign_name: string // resolved client-side from the campaigns list
  city_id: string
  name: string
  description: string
  translations: Record<string, { name: string; description: string }>
  difficulty: Difficulty
  reward_points: number
  estimated_time_minutes: number
  explorers_count: number
  is_active: boolean
}

export interface MissionCreate {
  campaign_id: string
  name: string
  description: string
  difficulty: Difficulty
  reward_points: number
  estimated_time_minutes: number
  is_active?: boolean
  translations?: Record<string, { name: string; description: string }>
}
export type MissionUpdate = Partial<Omit<MissionCreate, 'campaign_id'>>

// Category (cross-cuts a mission's waypoints; carries the completion threshold)

export interface MissionCategory {
  id: string
  mission_id: string
  name: string
  threshold_pct: number
  total_points: number
  order_index: number
}
export interface MissionCategoryCreate {
  name: string
  threshold_pct: number
  order_index: number
}
export type MissionCategoryUpdate = Partial<MissionCategoryCreate>

// Phase (ordered stage of a mission; contains waypoints)

export interface Phase {
  id: string
  mission_id: string
  name: string
  order_index: number
}
export interface PhaseCreate {
  name: string
  order_index: number
}
export type PhaseUpdate = Partial<PhaseCreate>

// Waypoint (a physical point in a phase, tagged with a category)
//
// Geolocation dwell check-in is the always-on presence proof for every
// waypoint (tolerance_radius_m already doubles as the geofence radius — no
// separate column). requires_qr/requires_keyword layer optional additional
// factors on top; onsite_keyword_answer is admin-only, never shown to players.

export interface Waypoint {
  id: string
  phase_id: string
  category_id: string
  name: string
  description: string
  translations: Record<string, { name: string; description: string }>
  lat: number
  lng: number
  tolerance_radius_m: number
  points: number
  order_index: number
  is_active: boolean
  requires_qr: boolean
  requires_keyword: boolean
  required_accuracy_m: number
  dwell_seconds: number
  min_fixes: number
  onsite_keyword_prompt: string | null
  onsite_keyword_answer: string | null
}
export interface WaypointCreate {
  category_id: string
  name: string
  description: string
  lat: number
  lng: number
  tolerance_radius_m: number
  points: number
  order_index: number
  is_active?: boolean
  requires_qr?: boolean
  requires_keyword?: boolean
  required_accuracy_m?: number
  dwell_seconds?: number
  min_fixes?: number
  onsite_keyword_prompt?: string | null
  onsite_keyword_answer?: string | null
  translations?: Record<string, { name: string; description: string }>
}
export type WaypointUpdate = Partial<WaypointCreate>

// Challenge / Option (belong to a waypoint)

export interface Option {
  id: string
  text: string
  is_correct: boolean
  order_index: number
  translations: Record<string, { text: string }>
}
export type OptionCreate = Omit<Option, 'id'>

export interface Challenge {
  id: string
  waypoint_id: string
  prompt: string
  order_index: number
  is_riddle: boolean
  keyword?: string | null
  fun_fact?: string | null
  options: Option[]
  translations: Record<string, { prompt: string }>
}
export interface ChallengeCreate {
  prompt: string
  order_index: number
  is_riddle: boolean
  keyword?: string | null
  fun_fact?: string | null
  options: OptionCreate[]
  translations?: Record<string, { prompt: string }>
}
export type ChallengeUpdate = Partial<ChallengeCreate>

// QR (one per waypoint)

export interface QRCode {
  id: string
  waypoint_id: string
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

// Geo check-in attempts (operator review queue) — the algorithm only surfaces
// candidates via `flags`; approve/reject is a human decision. Reject is
// flag-only (audit/ban signal), it never reverts the progress the attempt
// already granted.

export type GeoAttemptStatus = 'in_progress' | 'passed' | 'failed' | 'expired'

export interface GeoAttempt {
  id: string
  user_id: string
  waypoint_id: string
  waypoint_name: string
  city_id: string
  status: GeoAttemptStatus
  accepted_fixes: number
  best_accuracy_m: number | null
  worst_accuracy_m: number | null
  flags: string[]
  created_at: string
  reviewed_at: string | null
}

export interface GeoAttemptDetail extends GeoAttempt {
  first_fix_at: string | null
  last_fix_at: string | null
  qr_verified: boolean
  keyword_verified: boolean
  fix_sample: Record<string, unknown>[]
  reviewed_by_admin_id: string | null
  review_note: string | null
}

// Paginated response

export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}
