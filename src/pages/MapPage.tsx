import React from 'react'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'

export const MapPage: React.FC = () => {
  return (
    <Layout>
      <div className="mb-8 text-center">
        <Heading level={1}>Карта</Heading>
        <Text variant="muted" size="sm" className="mt-3 uppercase tracking-[0.28em]">
          Интерктивная карта и слои Safe Zones (MVP)
        </Text>
      </div>
      <div className="glass-panel p-6 text-center">
        <Text variant="muted">MapView: будет подключено в следующем шаге.</Text>
      </div>
    </Layout>
  )
}

export default MapPage

