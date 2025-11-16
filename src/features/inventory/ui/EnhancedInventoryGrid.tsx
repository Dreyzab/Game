import React from 'react'
import type { ItemState } from '@/entities/item/model/types'
import { InventoryGrid } from '@/features/inventory/ui'

type EnhancedInventoryGridProps = {
  items: ItemState[]
  selectedItemId?: string | null
  onSelect?: (itemId: string) => void
  isQuestItem?: (itemId: string) => boolean
}

export const EnhancedInventoryGrid: React.FC<EnhancedInventoryGridProps> = (props) => {
  return <InventoryGrid {...props} />
}

export default EnhancedInventoryGrid

