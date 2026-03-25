import { useI18n, type AppLanguage } from '@/features/i18n/model/I18nProvider'

const labels: Record<AppLanguage, string> = {
  en: 'EN',
  ru: 'RU',
  kk: 'KK',
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-full border border-border bg-card/90 p-1 shadow-lg backdrop-blur-sm">
      {(['en', 'ru', 'kk'] as AppLanguage[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          className={`h-8 min-w-8 rounded-full px-2 text-xs font-semibold transition-colors ${
            language === code
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
          aria-label={`Switch language to ${code.toUpperCase()}`}
          title={`Switch language to ${code.toUpperCase()}`}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  )
}
