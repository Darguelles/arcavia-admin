import { z } from 'zod'

// Re-usable base schemas

const translationsSchema = z.record(z.string(), z.record(z.string(), z.string()))

// Login

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})
export type LoginForm = z.infer<typeof loginSchema>

// Change password

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Requerido'),
    new_password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm_password: z.string().min(1, 'Requerido'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirm_password'],
  })
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>

// City

export const citySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  slug: z
    .string()
    .min(1, 'El código corto es obligatorio')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  country: z.string().min(2, 'Selecciona un país').max(2),
  default_language: z.string().min(2),
  timezone: z.string().min(1, 'Selecciona una zona horaria'),
  legal_regime: z.enum(['GDPR', 'LEY_29733']),
  bbox_north: z.number(),
  bbox_south: z.number(),
  bbox_east: z.number(),
  bbox_west: z.number(),
  center_lat: z.number(),
  center_lng: z.number(),
  map_tile_url: z.string().optional(),
  is_active: z.boolean(),
  launch_date: z.string().optional(),
  translations: translationsSchema.optional(),
})
export type CityForm = z.infer<typeof citySchema>

// Campaign

export const campaignSchema = z.object({
  city_id: z.string().uuid('Selecciona una ciudad'),
  name: z.string().min(1, 'El nombre es obligatorio').max(150),
  description: z.string().max(2000).optional().default(''),
  is_active: z.boolean(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  translations: translationsSchema.optional(),
})
export type CampaignForm = z.infer<typeof campaignSchema>

// Mission (v2: name/description/difficulty/reward_points/time; no location)

const difficultyEnum = z.enum(['baja', 'media', 'alta'])

// No is_active here: activation is a separate, explicit action (the "Activar
// misión" button in MissionReadinessPanel), never a side effect of saving
// details.
export const missionDetailsSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(150),
  description: z.string().max(2000).optional().default(''),
  difficulty: difficultyEnum,
  reward_points: z.number().int().min(0).default(0),
  estimated_time_minutes: z.number().int().min(0).default(0),
  translations: translationsSchema.optional(),
})
export type MissionDetailsForm = z.infer<typeof missionDetailsSchema>

export const missionCreateSchema = missionDetailsSchema.extend({
  campaign_id: z.string().uuid('Selecciona una campaña'),
})
export type MissionCreateForm = z.infer<typeof missionCreateSchema>

// Category

export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  threshold_pct: z.number().int().min(0).max(100).default(60),
  order_index: z.number().int().min(0).default(0),
})
export type CategoryForm = z.infer<typeof categorySchema>

// Phase

export const phaseSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  order_index: z.number().int().min(0).default(0),
})
export type PhaseForm = z.infer<typeof phaseSchema>

// Waypoint
//
// Geolocation dwell check-in is the always-on presence proof; requires_qr/
// requires_keyword are optional additional factors. requires_keyword needs
// both an on-site prompt and its expected answer to actually work.

export const waypointSchema = z
  .object({
    category_id: z.string().uuid('Selecciona una categoría'),
    name: z.string().min(1, 'El nombre es obligatorio').max(150),
    description: z.string().max(2000).optional().default(''),
    lat: z.number({ error: 'Coloca el pin en el mapa' }),
    lng: z.number({ error: 'Coloca el pin en el mapa' }),
    tolerance_radius_m: z.number().int().min(5).max(5000).default(50),
    points: z.number().int().min(0).default(0),
    order_index: z.number().int().min(0).default(0),
    is_active: z.boolean().default(false),
    requires_qr: z.boolean().default(false),
    requires_keyword: z.boolean().default(false),
    required_accuracy_m: z.number().int().min(5).max(500).default(50),
    dwell_seconds: z.number().int().min(0).max(600).default(60),
    min_fixes: z.number().int().min(1).max(50).default(4),
    onsite_keyword_prompt: z.string().max(300).optional().default(''),
    onsite_keyword_answer: z.string().max(200).optional().default(''),
    translations: translationsSchema.optional(),
  })
  .refine(
    (w) =>
      !w.requires_keyword || (w.onsite_keyword_prompt.trim() && w.onsite_keyword_answer.trim()),
    {
      message: 'La verificación por palabra clave necesita una pregunta y una respuesta.',
      path: ['onsite_keyword_answer'],
    }
  )
export type WaypointForm = z.infer<typeof waypointSchema>

// Option

export const optionSchema = z.object({
  text: z.string().min(1, 'El texto de la opción es obligatorio').max(500),
  is_correct: z.boolean(),
  order_index: z.number().int().min(0),
  translations: translationsSchema.optional(),
})
export type OptionFormItem = z.infer<typeof optionSchema>

// Challenge (belongs to a waypoint; saved individually)

export const challengeSchema = z
  .object({
    prompt: z.string().min(1, 'El enunciado es obligatorio').max(1000),
    order_index: z.number().int().min(0).default(0),
    is_riddle: z.boolean().default(false),
    keyword: z.string().max(200).optional(),
    fun_fact: z.string().max(1000).optional(),
    options: z.array(optionSchema).min(2, 'Mínimo 2 opciones'),
    translations: translationsSchema.optional(),
  })
  .refine((c) => c.options.some((o) => o.is_correct), {
    message: 'Debes marcar una opción como correcta.',
    path: ['options'],
  })
export type ChallengeFormItem = z.infer<typeof challengeSchema>

// Settings

export const appInfoSchema = z.object({
  app_name: z.string().min(1),
  support_contact: z.string().email('Correo inválido'),
  privacy_policy_text: z.string().min(1),
  privacy_policy_version: z.string().min(1),
})
export type AppInfoForm = z.infer<typeof appInfoSchema>
