import React from 'react'
import type { ItemState } from '@/entities/item/model/types'
import { ItemDetailsPanel } from '@/features/inventory/ui'

type InventoryDetailPanelProps = {
  item: ItemState | null
  isQuestItem?: boolean
}

export const InventoryDetailPanel: React.FC<InventoryDetailPanelProps> = ({ item, isQuestItem }) => {
  return <ItemDetailsPanel item={item} isQuestItem={isQuestItem} />
}

export default InventoryDetailPanel

