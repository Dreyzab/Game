import React from 'react'
import { EquipmentSlots, EncumbrancePanel, EquipmentStatsPanel } from '@/features/inventory/ui'
import type { EquipmentSlots as EquipmentSlotsState } from '@/entities/item/model/types'
import type { PlayerStatsSummary, ActiveMastery } from '@/features/inventory/model/helpers'

type CharacterPanelProps = {
  equipment: EquipmentSlotsState
  encumbrance: import('@/entities/item/model/types').EncumbranceState
  stats: PlayerStatsSummary
  masteryCards: ActiveMastery[]
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  equipment,
  encumbrance,
  stats,
  masteryCards,
}) => {
  return (
    <div className="space-y-4">
      <EquipmentSlots equipment={equipment} />
      <EncumbrancePanel encumbrance={encumbrance} />
      <EquipmentStatsPanel stats={stats} masteryCards={masteryCards} />
    </div>
  )
}

export default CharacterPanel

