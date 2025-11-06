import React from 'react'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { useTheme } from '@/shared/hooks/useTheme'

export const SettingsPage: React.FC = () => {
  const { theme, toggle } = useTheme()

  return (
    <Layout>
      <div className="mb-8 text-center">
        <Heading level={1}>Настройки</Heading>
        <Text variant="muted" size="sm" className="mt-3 uppercase tracking-[0.28em]">
          UI и Dev-инструменты (MVP)
        </Text>
      </div>
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <Text variant="body">Тема интерфейса</Text>
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-xs uppercase tracking-[0.24em] hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]"
          >
            Переключить: {theme === 'dark' ? 'Светлая' : 'Тёмная'}
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default SettingsPage

