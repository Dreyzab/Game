import React from 'react'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'

export const DevToolsPage: React.FC = () => {
  return (
    <Layout>
      <div className="mb-8 text-center">
        <Heading level={1}>DevTools</Heading>
        <Text variant="muted" size="sm" className="mt-3 uppercase tracking-[0.28em]">
          Сиды, очистка и тестовые операции (MVP)
        </Text>
      </div>
      <div className="glass-panel p-6 text-center">
        <Text variant="muted">Dev-инструменты: будут добавлены позже.</Text>
      </div>
    </Layout>
  )
}

export default DevToolsPage

