// import { ThemeToggle } from '@/widgets/ThemeToggle'
// import { Heading } from '@/shared/ui/Heading'
import { useTranslation } from 'react-i18next'
// import { Button } from '@/shared/ui/Button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
// import { api } from '@/shared/api' // Assuming api client exists

export default function SettingsPage() {
  const { t, i18n } = useTranslation(['settings', 'common'])
  // const queryClient = useQueryClient()

  /*
  const { mutate: updateLocale } = useMutation({
    mutationFn: (locale: string) => api.post('/player/locale', { locale }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player'] })
    }
  })
  */

  const changeLanguage = (lng: 'ru' | 'en' | 'de') => {
    i18n.changeLanguage(lng)
    // updateLocale(lng)
  }

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      {/* <Heading level={1}>{t('title')}</Heading> */}
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('theme')}</h2>
        {/* <ThemeToggle /> */}
        <p>Theme settings unavailable</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('language')}</h2>
        <div className="flex gap-2">
          <button onClick={() => changeLanguage('ru')} className="px-4 py-2 border">Русский</button>
          <button onClick={() => changeLanguage('en')} className="px-4 py-2 border">English</button>
          <button onClick={() => changeLanguage('de')} className="px-4 py-2 border">Deutsch</button>
          {/*
          <Button
            variant={i18n.language === 'ru' ? 'primary' : 'outline'}
            onClick={() => changeLanguage('ru')}
          >
            Русский
          </Button>
          <Button
            variant={i18n.language === 'en' ? 'primary' : 'outline'}
            onClick={() => changeLanguage('en')}
          >
            English
          </Button>
          <Button
            variant={i18n.language === 'de' ? 'primary' : 'outline'}
            onClick={() => changeLanguage('de')}
          >
            Deutsch
          </Button>
          */}
        </div>
      </section>
    </div>
  )
}
