import type { EquipmentSlots, ItemState } from '@/entities/item/model/types'

export const setQuickSlot = (
    items: Record<string, ItemState>,
    equipment: EquipmentSlots,
    index: number,
    itemId: string | null
): EquipmentSlots => {
    if (index < 0 || index >= equipment.quick.length) return equipment

    const nextQuick = [...equipment.quick]
    nextQuick[index] = itemId ? items[itemId] ?? null : null

    return { ...equipment, quick: nextQuick }
}
