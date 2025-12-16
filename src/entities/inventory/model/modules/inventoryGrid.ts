import type { ItemState } from '@/entities/item/model/types'

export const moveItemWithinGrid = (
    items: Record<string, ItemState>,
    itemId: string,
    position: { x: number; y: number }
): Record<string, ItemState> => {
    const item = items[itemId]
    if (!item) return items

    const currentPosition = item.gridPosition
    const conflictingEntry = Object.values(items).find(
        (entry) =>
            entry.id !== itemId &&
            entry.gridPosition?.x === position.x &&
            entry.gridPosition?.y === position.y
    )

    const nextItems: Record<string, ItemState> = {
        ...items,
        [itemId]: { ...item, gridPosition: position },
    }

    if (conflictingEntry) {
        nextItems[conflictingEntry.id] = {
            ...conflictingEntry,
            gridPosition: currentPosition ?? undefined,
        }
    }

    return nextItems
}
