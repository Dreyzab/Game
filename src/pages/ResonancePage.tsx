import React from 'react'
import { HostPanel, PlayerPanel } from '@/features/resonance'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'

const ResonancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <Heading level={2}>Резонанс: кооперативный квест</Heading>
          <Text variant="muted" size="sm">
            Запуск LCSD с архетипами (Скептик, Эмпат, Защитник, Визионер), голосованиями, прерываниями и метрикой
            напряжения.
          </Text>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <HostPanel />
          <PlayerPanel />
        </div>
      </div>
    </div>
  )
}

export default ResonancePage






















