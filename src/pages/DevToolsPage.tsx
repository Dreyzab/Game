import React from 'react'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'

// DevTools - панель разработчика
export const DevToolsPage: React.FC = () => {
  return (
    <Layout>
      <div className="text-center space-y-4 py-10">
        <Heading level={1}>DevTools</Heading>
        <Text variant="muted" size="sm" className="mt-3 uppercase tracking-[0.28em]">
          Сиды и отладка доступны через `bun run db:seed` на сервере.
        </Text>
      </div>
    </Layout>
  )
}

export default DevToolsPage
