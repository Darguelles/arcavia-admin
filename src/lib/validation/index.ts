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

// Mission (details + location together, but saved independently via API)

export const missionDetailsSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(150),
  description: z.string().max(2000).optional().default(''),
  points: z.number().int().min(0).default(100),
  tolerance_radius_m: z.number().int().min(5).max(5000).default(50),
  is_active: z.boolean(),
  calibration_notes: z.string().max(2000).optional(),
  translations: translationsSchema.optional(),
})
export type MissionDetailsForm = z.infer<typeof missionDetailsSchema>

export const missionLocationSchema = z.object({
  lat: z.number({ error: 'Coloca el pin en el mapa' }),
  lng: z.number({ error: 'Coloca el pin en el mapa' }),
  tolerance_radius_m: z.number().int().min(5).max(5000).default(50),
})
export type MissionLocationForm = z.infer<typeof missionLocationSchema>

export const missionCreateSchema = z.object({
  campaign_id: z.string().uuid('Selecciona una campaña'),
  name: z.string().min(1).max(150),
  description: z.string().max(2000).optional().default(''),
  points: z.number().int().min(0).default(100),
  tolerance_radius_m: z.number().int().min(5).max(5000).default(50),
  is_active: z.boolean(),
  translations: translationsSchema.optional(),
})
export type MissionCreateForm = z.infer<typeof missionCreateSchema>

// Option

export const optionSchema = z.object({
  text: z.string().min(1, 'El texto de la opción es obligatorio').max(500),
  is_correct: z.boolean(),
  order_index: z.number().int().min(0),
  translations: translationsSchema.optional(),
})
export type OptionFormItem = z.infer<typeof optionSchema>

// Challenge

export const challengeSchema = z
  .object({
    prompt: z.string().min(1, 'El enunciado es obligatorio').max(1000),
    order_index: z.number().int().min(0),
    options: z.array(optionSchema).min(2, 'Mínimo 2 opciones'),
    translations: translationsSchema.optional(),
  })
  .refine((c) => c.options.some((o) => o.is_correct), {
    message: 'Debes marcar una opción como correcta.',
    path: ['options'],
  })
export type ChallengeFormItem = z.infer<typeof challengeSchema>

export const challengesListSchema = z.object({
  challenges: z.array(challengeSchema).min(1, 'Agrega al menos una pregunta'),
})
export type ChallengesListForm = z.infer<typeof challengesListSchema>

// Settings

export const appInfoSchema = z.object({
  app_name: z.string().min(1),
  support_contact: z.string().email('Correo inválido'),
  privacy_policy_text: z.string().min(1),
  privacy_policy_version: z.string().min(1),
})
export type AppInfoForm = z.infer<typeof appInfoSchema>
