import { useTranslation } from 'react-i18next'

export default function SettingsPage() {
  const { t, i18n } = useTranslation('settings')
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'ru').split('-')[0]

  const changeLanguage = (lng: 'ru' | 'en' | 'de') => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('theme')}</h2>
        <p>{t('theme_unavailable')}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('language')}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => changeLanguage('ru')}
            className={`px-4 py-2 border ${currentLanguage === 'ru' ? 'bg-white/10 border-white/40' : ''}`}
          >
            {t('language_ru')}
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 border ${currentLanguage === 'en' ? 'bg-white/10 border-white/40' : ''}`}
          >
            {t('language_en')}
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('de')}
            className={`px-4 py-2 border ${currentLanguage === 'de' ? 'bg-white/10 border-white/40' : ''}`}
          >
            {t('language_de')}
          </button>
        </div>
      </section>
    </div>
  )
}
