import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'

interface Field {
  key: string
  label: string
  multiline?: boolean
}

interface TranslationsEditorProps {
  /** The fields that need translations (e.g. [{key:'name', label:'Nombre'}]) */
  fields: Field[]
  /** Current translations object: { 'en': { name: '...', description: '...' } } */
  value: Record<string, Record<string, string>>
  onChange: (v: Record<string, Record<string, string>>) => void
  supportedLocales?: string[]
  className?: string
}

const DEFAULT_LOCALES = ['en', 'pt']
const LOCALE_LABELS: Record<string, string> = {
  en: 'Inglés',
  pt: 'Portugués',
  fr: 'Francés',
  de: 'Alemán',
}

const fieldClass =
  'block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:outline-2 focus:outline-gold focus:-outline-offset-[3px] focus:ring-0 focus:border-ink'

/**
 * Reusable translations editor shared across campaigns, missions, challenges, options.
 * Edits the `translations` JSONB field (spec §6.9).
 * Adding a locale is data — no migration required.
 */
export function TranslationsEditor({
  fields,
  value,
  onChange,
  supportedLocales = DEFAULT_LOCALES,
  className,
}: TranslationsEditorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLocale, setSelectedLocale] = useState(supportedLocales[0] ?? 'en')

  function setField(locale: string, fieldKey: string, text: string) {
    onChange({
      ...value,
      [locale]: { ...(value[locale] ?? {}), [fieldKey]: text },
    })
  }

  return (
    <div className={cn('border border-line rounded-control', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink rounded-control cursor-pointer hover:bg-paper-hover"
        aria-expanded={isOpen}
      >
        <span>{t.otherLanguages}</span>
        <span className="text-faint" aria-hidden>
          {isOpen ? (
            <ChevronUp size={16} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={16} strokeWidth={1.5} />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-line-soft">
          <p className="text-[13px] text-muted mb-3 mt-2.5">{t.otherLanguagesHint}</p>

          <div className="flex gap-2 mb-4">
            {supportedLocales.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocale(loc)}
                className={cn(
                  'h-8 px-3 rounded-control text-[13px] font-medium border cursor-pointer transition-colors',
                  selectedLocale === loc
                    ? 'bg-gold-tint border-gold text-gold-text'
                    : 'border-line-strong text-muted hover:bg-paper-hover hover:text-ink'
                )}
              >
                {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-ink">
                  {field.label} ({LOCALE_LABELS[selectedLocale] ?? selectedLocale})
                </label>
                {field.multiline ? (
                  <textarea
                    className={cn(fieldClass, 'resize-y min-h-[60px]')}
                    value={value[selectedLocale]?.[field.key] ?? ''}
                    onChange={(e) => setField(selectedLocale, field.key, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className={fieldClass}
                    value={value[selectedLocale]?.[field.key] ?? ''}
                    onChange={(e) => setField(selectedLocale, field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
