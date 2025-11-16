import { create } from 'zustand'

type DragSourceType = 'grid' | 'equipment' | 'quick' | 'container'

type DragSource = {
  type: DragSourceType
  containerId?: string
}

type GridCell = { x: number; y: number }

type EquipmentTargetSlot =
  | 'primary'
  | 'secondary'
  | 'melee'
  | 'helmet'
  | 'armor'
  | 'clothing_top'
  | 'clothing_bottom'
  | 'backpack'
  | 'rig'

type DropTarget =
  | { kind: 'grid'; cell: GridCell }
  | { kind: 'equipment'; slotId: EquipmentTargetSlot }
  | { kind: 'quick'; index: number }

type CursorPosition = { x: number; y: number }

type DragState = {
  isDragging: boolean
  itemId: string | null
  source: DragSource | null
  target: DropTarget | null
  cursor: CursorPosition | null
  startDrag: (itemId: string, source: DragSource) => void
  setDropTarget: (target: DropTarget | null) => void
  updateCursor: (position: CursorPosition) => void
  endDrag: () => void
}

export const useInventoryDragStore = create<DragState>((set) => ({
  isDragging: false,
  itemId: null,
  source: null,
  target: null,
  cursor: null,
  startDrag: (itemId, source) =>
    set({
      isDragging: true,
      itemId,
      source,
    }),
  setDropTarget: (target) => set({ target }),
  updateCursor: (position) => set({ cursor: position }),
  endDrag: () =>
    set({
      isDragging: false,
      itemId: null,
      source: null,
      target: null,
      cursor: null,
    }),
}))
