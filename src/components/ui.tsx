import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { t } from '../lib/i18n'

/**
 * Vocabulario visual del panel (sistema de diseño "Arcavia Admin — Propuesta").
 * Clases compartidas para no repetir cadenas Tailwind en cada pantalla:
 * el oro es escaso (una acción principal por pantalla), línea antes que
 * relleno, radios 3/5/10, control de 40 px.
 */

// ── Botones ──────────────────────────────────────────────────────────────
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-control text-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40'

export const btnPrimary = cn(
  btnBase,
  'h-10 px-5 bg-gold text-ink border border-gold font-semibold hover:bg-gold-soft hover:border-gold-soft disabled:hover:bg-gold disabled:hover:border-gold'
)

export const btnSecondary = cn(
  btnBase,
  'h-10 px-4 bg-surface text-ink border border-line-strong font-medium hover:bg-paper-hover hover:border-gold'
)

export const btnGhost = cn(
  btnBase,
  'h-10 px-3.5 bg-transparent text-muted border border-transparent font-medium hover:text-ink hover:bg-line-soft'
)

export const btnDanger = cn(
  btnBase,
  'h-10 px-4 bg-surface text-danger border border-danger-line font-medium hover:bg-danger-tint hover:border-danger'
)

export const btnDangerSolid = cn(
  btnBase,
  'h-10 px-4.5 bg-danger text-white border border-danger font-semibold hover:opacity-90'
)

export const btnApprove = cn(
  btnBase,
  'h-10 px-4 bg-surface text-success-deep border border-success-line font-semibold hover:bg-success-tint hover:border-success'
)

/** Botón de icono de barra de herramientas (40 px). */
export const btnIcon = cn(
  btnBase,
  'h-10 w-10 bg-surface text-ink border border-line-strong hover:border-gold'
)

/** Botón de icono dentro de una fila (32 px). */
export const btnIconSm = cn(
  btnBase,
  'h-8 w-8 bg-surface text-ink border border-line-strong hover:border-gold'
)

export const btnIconSmDanger = cn(
  btnBase,
  'h-8 w-8 bg-surface text-danger border border-danger-line hover:bg-danger-tint'
)

/** Botón de texto dentro de una fila (32 px). */
export const btnRowAction = cn(
  btnBase,
  'h-8 px-3 bg-surface text-ink border border-line-strong text-[13px] font-medium hover:border-gold'
)

/** Acción "agregar" con borde discontinuo (36 px). */
export const btnAddDashed = cn(
  btnBase,
  'h-9 px-3 bg-surface text-muted border border-dashed border-line-strong text-[13.5px] font-medium hover:border-gold hover:text-ink'
)

/** Enlace de acción en dorado profundo (subrayado). */
export const linkAction =
  'bg-transparent border-0 p-0 text-[12.5px] font-semibold text-gold-deep underline underline-offset-3 cursor-pointer'

// ── Tarjeta y etiquetas ──────────────────────────────────────────────────
export const card = 'rounded-card border border-line bg-surface'

/** Etiqueta en caja alta (11/16 · 600 · 0.1em). */
export const overline = 'text-[11px] leading-4 font-semibold tracking-[0.1em] uppercase text-faint'

// ── Especificación de imagen ─────────────────────────────────────────────
/**
 * Resolución recomendada junto a cada control de subida de imagen. Los
 * tamaños vienen del tamaño de render en la app del jugador (Figma) al doble
 * (2×) para pantallas de alta densidad; `spec` es la cadena ya traducida
 * (p. ej. `t.missionImageSpec`).
 */
export function ImageSpec({ spec, className }: { spec: string; className?: string }) {
  return (
    <p className={cn('m-0 text-[12.5px] leading-[18px] text-faint', className)}>
      <span className="font-semibold text-muted">{t.imageSpecLabel}:</span> {spec}
    </p>
  )
}

// ── Distintivos de estado ────────────────────────────────────────────────
type BadgeVariant = 'success' | 'neutral' | 'warn' | 'danger' | 'admin' | 'outline'

const badgeVariants: Record<BadgeVariant, string> = {
  success: 'bg-success-tint text-success-deep',
  neutral: 'bg-line-soft text-muted',
  warn: 'bg-warn-tint text-warn-deep',
  danger: 'bg-danger-tint text-danger-deep',
  admin: 'bg-gold-tint text-gold-text',
  outline: 'border border-line-strong text-muted',
}

/** Distintivo de estado: tinte al 10 %, texto al 100 %, radio 3. */
export function Badge({
  variant = 'neutral',
  mono = false,
  className,
  children,
}: {
  variant?: BadgeVariant
  mono?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs font-semibold',
        badgeVariants[variant],
        mono && 'font-mono font-normal text-[11.5px]',
        className
      )}
    >
      {children}
    </span>
  )
}
