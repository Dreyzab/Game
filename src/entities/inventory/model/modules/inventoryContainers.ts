import type {
    EquipmentSlots,
    InventoryContainer,
    ItemState,
} from '@/entities/item/model/types'

export const addItemToContainer = (
    containers: Record<string, InventoryContainer>,
    items: Record<string, ItemState>,
    containerId: string,
    itemId: string
): Record<string, InventoryContainer> => {
    const container = containers[containerId]
    const item = items[itemId]

    if (!container || !item) return containers

    if (container.items.some((entry) => entry.id === itemId)) {
        return containers
    }

    const updatedContainer: InventoryContainer = {
        ...container,
        items: [...container.items, item],
    }

    return { ...containers, [containerId]: updatedContainer }
}

export const removeItemFromContainer = (
    containers: Record<string, InventoryContainer>,
    containerId: string,
    itemId: string
): Record<string, InventoryContainer> => {
    const container = containers[containerId]
    if (!container) return containers

    const updatedContainer: InventoryContainer = {
        ...container,
        items: container.items.filter((entry) => entry.id !== itemId),
    }

    return { ...containers, [containerId]: updatedContainer }
}

export const getAllContainers = (
    items: Record<string, ItemState>,
    equipment: EquipmentSlots,
    storedContainers: Record<string, InventoryContainer>
): InventoryContainer[] => {
    const containers: InventoryContainer[] = []

    // From equipment
    const equipmentValues = Object.values(equipment)
    equipmentValues.forEach((equipped) => {
        // Check if it's a single item (not array) and has config
        if (equipped && !Array.isArray(equipped) && (equipped as ItemState).stats?.containerConfig) {
            const item = equipped as ItemState
            const containerItems = Object.values(items).filter(
                (i) => i.containerId === item.instanceId
            )

            const container: InventoryContainer = {
                id: item.instanceId,
                ownerId: item.ownerId || 'player',
                kind: 'equipment_storage', // Default fallback, usually refined by slot in store logs but here we might need slot info if we want exact kind. 
                // Note: The store logic inferred kind from slot. Here we iterate values so we lose slot info. 
                // But the storedContainers map in `store.ts` already has the correct kind when equipped!
                // HOWEVER, `getContainers` in `store.ts` re-constructs it.
                // Let's use the stored container if available to preserve 'kind', or fallback.
                name: item.stats.containerConfig!.name,
                width: item.stats.containerConfig!.width,
                height: item.stats.containerConfig!.height,
                items: containerItems,
            }

            // Try to find if we already have it in storedContainers to get the correct 'kind'
            const stored = storedContainers[item.instanceId]
            if (stored) {
                container.kind = stored.kind
            }

            containers.push(container)
        }
    })

    // From stored containers (that might not be equipped? or just generic containers)
    Object.values(storedContainers).forEach((container) => {
        if (!containers.find(c => c.id === container.id)) {
            const containerItems = Object.values(items).filter(
                (item) => item.containerId === container.id
            )
            containers.push({
                ...container,
                items: containerItems,
            })
        }
    })

    return containers
}
