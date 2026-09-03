import type { ReactNode } from 'react'
import { t } from '../../lib/i18n'
import logoUrl from '../../assets/logo.svg'

/**
 * Marco compartido de las pantallas de acceso (diseño "Propuesta"):
 * pantalla dividida sobre tinta con panel de marca a la izquierda y
 * panel de papel a la derecha donde vive el formulario. En pantallas
 * pequeñas el panel de marca se oculta y el formulario ocupa todo.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-ink">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 border-r border-cream/10">
        <img
          src={logoUrl}
          alt="Arcavia Quest"
          width={260}
          height={122}
          className="h-auto w-[180px] self-start"
        />
        <div className="flex max-w-[30ch] flex-col gap-5">
          <p className="m-0 text-[40px] leading-[48px] font-semibold text-cream tracking-[-0.01em]">
            {t.loginBrandTitle}
          </p>
          <p className="m-0 text-[15px] leading-[25px] text-cream/60">{t.loginBrandSubtitle}</p>
        </div>
        <p className="m-0 text-xs text-muted">{t.loginBrandFootnote}</p>
      </div>

      <div className="flex w-full flex-col justify-center gap-7 bg-paper px-6 py-16 sm:px-[72px] lg:w-[520px]">
        {children}
      </div>
    </div>
  )
}

/** Encabezado del panel derecho: sobrelínea dorada + título 26/34. */
export function AuthHeading({ overline, title }: { overline: string; title: string }) {
  return (
    <div>
      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-deep">
        {overline}
      </p>
      <h1 className="mt-2.5 mb-0 text-[26px] leading-[34px] font-semibold text-ink">{title}</h1>
    </div>
  )
}
