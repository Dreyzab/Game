// Thin wrapper around InventoryGrid.
// Exists to keep a stable public interface for future enhancements
// (container-based filtering, presets, responsive tuning), while
// the underlying grid implementation can evolve independently.
import React from 'react'
import type { ItemState } from '@/entities/item/model/types'
import { InventoryGrid } from '@/features/inventory/ui'

type EnhancedInventoryGridProps = {
  items: ItemState[]
  selectedItemId?: string | null
  onSelect?: (itemId: string) => void
  onCompare?: (item: ItemState) => void
  isQuestItem?: (itemId: string) => boolean
}

export const EnhancedInventoryGrid: React.FC<EnhancedInventoryGridProps> = (props) => {
  return <InventoryGrid {...props} />
}

export default EnhancedInventoryGrid
