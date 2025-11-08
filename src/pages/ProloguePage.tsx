import React from 'react'
import { Text } from '@/shared/ui/components/Text'

export const ProloguePage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-background)] px-4 pb-6 pt-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center py-16">
          <Text variant="muted">Пролог: полноэкранный режим (placeholder)</Text>
        </div>
      </div>
    </div>
  )
}

export default ProloguePage






