import type {
    EquipmentSlots,
    InventoryContainer,
    ItemState,
} from '@/entities/item/model/types'

type EquipmentSlotKey = Exclude<keyof EquipmentSlots, 'artifacts' | 'quick'>

type EquipmentUpdateResult = {
    items: Record<string, ItemState>
    equipment: EquipmentSlots
    containers: Record<string, InventoryContainer>
}

export const equipItem = (
    currentState: {
        items: Record<string, ItemState>
        equipment: EquipmentSlots
        containers: Record<string, InventoryContainer>
    },
    itemId: string | null,
    slotId: EquipmentSlotKey
): EquipmentUpdateResult => {
    const { items, equipment, containers } = currentState

    if (!(slotId in equipment)) {
        return { items, equipment, containers }
    }

    let item = itemId ? items[itemId] ?? null : null
    const nextItems = { ...items }

    // Create containerConfig for items that should have pockets/storage
    if (item && !item.stats.containerConfig) {
        let containerConfig: { width: number; height: number; name: string } | undefined

        switch (slotId) {
            case 'helmet':
                containerConfig = { width: 1, height: 1, name: 'Карман шлема' }
                break
            case 'rig':
                containerConfig = { width: 4, height: 2, name: 'Карманы разгрузки' }
                break
            case 'backpack':
                containerConfig = { width: 4, height: 4, name: 'Рюкзак' }
                break
            case 'clothing_bottom':
                // Belt logic
                if (item.kind === 'clothing' || item.templateId?.includes('belt')) {
                    containerConfig = { width: 4, height: 1, name: 'Карманы ремня' }
                }
                break
        }

        if (containerConfig) {
            item = {
                ...item,
                stats: {
                    ...item.stats,
                    containerConfig,
                },
            }
            nextItems[item.id] = item
        }
    }

    const nextEquipment = {
        ...equipment,
        [slotId]: item,
    }

    const nextContainers = { ...containers }

    // Add container if equipped item has config
    if (item && item.stats.containerConfig) {
        nextContainers[item.instanceId] = {
            id: item.instanceId,
            ownerId: item.ownerId || 'player',
            kind: slotId === 'backpack' ? 'backpack' :
                slotId === 'rig' ? 'rig' :
                    slotId === 'helmet' ? 'pocket' : 'equipment_storage',
            name: item.stats.containerConfig.name,
            width: item.stats.containerConfig.width,
            height: item.stats.containerConfig.height,
            items: [],
        }
    } else if (!item) {
        // Remove container if item unequipped
        const previousItem = equipment[slotId]
        if (previousItem && !Array.isArray(previousItem) && previousItem.stats.containerConfig) {
            delete nextContainers[previousItem.instanceId]
        }
    }

    return {
        items: nextItems,
        equipment: nextEquipment,
        containers: nextContainers,
    }
}
