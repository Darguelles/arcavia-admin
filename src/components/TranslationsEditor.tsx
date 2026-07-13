import { useState } from 'react'
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
    <div className={cn('border border-gray-200 rounded-lg', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
        aria-expanded={isOpen}
      >
        <span>{t.otherLanguages}</span>
        <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3 mt-2">{t.otherLanguagesHint}</p>

          <div className="flex gap-2 mb-4">
            {supportedLocales.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocale(loc)}
                className={cn(
                  'px-3 py-1 rounded text-xs font-medium border',
                  selectedLocale === loc
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                )}
              >
                {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  {field.label} ({LOCALE_LABELS[selectedLocale] ?? selectedLocale})
                </label>
                {field.multiline ? (
                  <textarea
                    className="block w-full rounded border border-gray-300 px-3 py-2 text-sm resize-y min-h-[60px]"
                    value={value[selectedLocale]?.[field.key] ?? ''}
                    onChange={(e) => setField(selectedLocale, field.key, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="block w-full rounded border border-gray-300 px-3 py-2 text-sm"
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
