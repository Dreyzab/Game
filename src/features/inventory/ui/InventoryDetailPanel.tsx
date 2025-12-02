import React from 'react'
import type { ItemState } from '@/entities/item/model/types'
import { ItemDetailsPanel } from '@/features/inventory/ui'

type InventoryDetailPanelProps = {
  item: ItemState | null
  isQuestItem?: boolean
  onEquip?: (item: ItemState) => void
  onUnequip?: (item: ItemState) => void
}

export const InventoryDetailPanel: React.FC<InventoryDetailPanelProps> = ({ item, isQuestItem, onEquip, onUnequip }) => {
  return <ItemDetailsPanel item={item} isQuestItem={isQuestItem} onEquip={onEquip} onUnequip={onUnequip} />
}

export default InventoryDetailPanel

