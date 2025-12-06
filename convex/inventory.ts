import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'

// --- Types ---

export type ItemKind =
    | 'weapon'
    | 'armor'
    | 'artifact'
    | 'consumable'
    | 'clothing'
    | 'backpack'
    | 'rig'
    | 'quest'
    | 'misc'

export type PlayerRole = 'police' | 'doctor' | 'engineer' | 'smuggler'

// --- Mutations ---

export const seedInventory = mutation({
    args: {
        deviceId: v.string(),
        role: v.optional(v.string()) // PlayerRole
    },
    handler: async (ctx, args) => {
        const ownerId = args.deviceId
        const role = (args.role as PlayerRole) || 'smuggler'

        // Check if already seeded
        const existing = await ctx.db
            .query('items')
            .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
            .first()

        if (existing) return { success: false, message: 'Already seeded' }

        // Preparation for equipment slots
        const equipmentSlots: any = {
            primary: undefined,
            secondary: undefined,
            melee: undefined,
            helmet: undefined,
            armor: undefined,
            clothing_top: undefined,
            clothing_bottom: undefined,
            backpack: undefined,
            rig: undefined,
            artifacts: [],
            quick: [null, null, null, null, null],
        }

        // Item Stats Lookup (Synced with frontend templates)
        const ITEM_STATS: Record<string, any> = {
            clothing_basic: { weight: 1, width: 2, height: 2 },
            trousers_basic: { weight: 1, width: 2, height: 2 },
            pistol_pm: { weight: 1.5, width: 2, height: 1 },
            vest_police: { weight: 4, width: 2, height: 2 },
            badge: { weight: 0.1, width: 1, height: 1 },
            medkit: { weight: 1, width: 2, height: 2 },
            backpack_medic: { weight: 1.5, width: 2, height: 2 },
            pills: { weight: 0.1, width: 1, height: 1 },
            wrench: { weight: 2, width: 1, height: 2 },
            belt_tool: { weight: 1, width: 2, height: 1 },
            scrap: { weight: 0.5, width: 1, height: 1 },
            knife: { weight: 0.5, width: 1, height: 1 },
            jacket_hidden: { weight: 2, width: 2, height: 2 },
            cash: { weight: 0, width: 1, height: 1 },
        }

        // Helper to create item
        const createItem = async (
            templateId: string,
            name: string,
            kind: ItemKind,
            slot?: string,
            containerConfig?: {
                width: number;
                height: number;
                name: string;
            }
        ) => {
            const stats = ITEM_STATS[templateId] || { weight: 1, width: 1, height: 1 }

            const id = await ctx.db.insert('items', {
                ownerId,
                templateId,
                instanceId: crypto.randomUUID(),
                kind,
                name,
                description: 'Starter item',
                icon: '📦', // Placeholder, frontend has real icons
                rarity: 'common',
                stats: {
                    weight: stats.weight,
                    width: stats.width,
                    height: stats.height,
                    containerConfig
                },
                quantity: 1,
                slot,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })

            if (slot) {
                if (slot.startsWith('quick_')) {
                    // Handle quick slots logic if needed, simplifed for now
                    const quickSlotIndex = parseInt(slot.split('_')[1]) - 1;
                    if (quickSlotIndex >= 0 && quickSlotIndex < equipmentSlots.quick.length) {
                        equipmentSlots.quick[quickSlotIndex] = id;
                    }
                } else if (slot in equipmentSlots) {
                    equipmentSlots[slot] = id
                }
            }
            return id
        }

        // 1. Base Equipment (Common to all)
        await createItem('clothing_basic', 'Worn Clothes', 'clothing', 'clothing_top')
        await createItem('trousers_basic', 'Cargo Pants', 'clothing', 'clothing_bottom')

        // 2. Role-specific Loadout
        if (role === 'police') {
            await createItem('pistol_pm', 'PM Pistol', 'weapon', 'primary')
            await createItem('vest_police', 'Police Vest', 'armor', 'armor', { width: 4, height: 2, name: 'Vest Pockets' }) // 8 slots
            await createItem('badge', 'Police Badge', 'misc')
        } else if (role === 'doctor') {
            await createItem('medkit', 'First Aid Kit', 'consumable', 'quick_1')
            await createItem('backpack_medic', 'Medic Bag', 'backpack', 'backpack', { width: 4, height: 4, name: 'Medic Bag' }) // 16 slots
            await createItem('pills', 'Painkillers', 'consumable')
        } else if (role === 'engineer') {
            await createItem('wrench', 'Heavy Wrench', 'weapon', 'melee')
            await createItem('belt_tool', 'Tool Belt', 'rig', 'rig', { width: 4, height: 1, name: 'Tool Belt' }) // 4 slots
            await createItem('scrap', 'Scrap Metal', 'misc')
        } else if (role === 'smuggler') {
            await createItem('knife', 'Switchblade', 'weapon', 'melee')
            await createItem('jacket_hidden', 'Smuggler Jacket', 'armor', 'armor', { width: 2, height: 2, name: 'Hidden Pocket' }) // 4 slots
            await createItem('cash', 'Credits', 'misc')
        }

        // Init equipment table (legacy support)
        await ctx.db.insert('equipment', {
            ownerId,
            slots: equipmentSlots,
            updatedAt: Date.now(),
        })

        return { success: true, role }
    },
})

export const sync = mutation({
    args: {
        events: v.array(v.any()) // Array of InventoryEvent
    },
    handler: async (ctx, args) => {
        // Process events in order
        for (const event of args.events) {
            if (event.type === 'ADD_ITEM') {
                // Usually handled by backend logic, but if we allow client-side generation (e.g. looting)
                // We should validate strictly. For now, we skip or assume it's valid.
                // In a real secure app, ADD_ITEM should only come from server-side logic (loot, quest reward).
                // Here we might just log it or ignore it if we trust the client state is just a "view".
                // BUT, if the client says "I moved item X", we update it.
            }
            else if (event.type === 'EQUIP_ITEM') {
                const item = await ctx.db
                    .query('items')
                    .withIndex('by_instance', (q) => q.eq('instanceId', event.itemId))
                    .first()

                if (item) {
                    await ctx.db.patch(item._id, {
                        slot: event.slot,
                        containerId: undefined,
                        updatedAt: Date.now()
                    })

                    // Update equipment table logic should be here too in a real implementation
                    // For now assuming frontend syncs or separate equip mutation handles it
                    // But wait, the previous code didn't touch 'equipment' table in sync?
                    // That implies 'get' query relies on 'items' having 'slot' set OR 'equipment' table.
                    // The 'get' query uses 'equipment' table to structure the response.
                    // If 'sync' doesn't update 'equipment' table, then persistence is broken for 'get'.

                    const equipmentDoc = await ctx.db
                        .query('equipment')
                        .withIndex('by_owner', (q) => q.eq('ownerId', item.ownerId))
                        .first()

                    if (equipmentDoc && event.slot) {
                        const slots = { ...equipmentDoc.slots }
                        if (event.slot.startsWith('quick_')) {
                            const quickSlotIndex = parseInt(event.slot.split('_')[1]) - 1;
                            if (quickSlotIndex >= 0 && quickSlotIndex < 5) { // Assuming 5 quick slots
                                slots.quick[quickSlotIndex] = item._id;
                            }
                        } else {
                            (slots as any)[event.slot] = item._id
                        }
                        await ctx.db.patch(equipmentDoc._id, { slots })
                    }
                }
            }
            else if (event.type === 'UNEQUIP_ITEM') {
                const item = await ctx.db
                    .query('items')
                    .withIndex('by_instance', (q) => q.eq('instanceId', event.itemId))
                    .first()

                if (item) {
                    // Check if it was in a slot
                    const oldSlot = item.slot

                    await ctx.db.patch(item._id, {
                        slot: undefined,
                        updatedAt: Date.now()
                    })

                    const equipmentDoc = await ctx.db
                        .query('equipment')
                        .withIndex('by_owner', (q) => q.eq('ownerId', item.ownerId))
                        .first()

                    if (equipmentDoc && oldSlot) {
                        const slots = { ...equipmentDoc.slots }
                        if (oldSlot.startsWith('quick_')) {
                            const quickSlotIndex = parseInt(oldSlot.split('_')[1]) - 1;
                            if (quickSlotIndex >= 0 && quickSlotIndex < 5) {
                                slots.quick[quickSlotIndex] = null;
                            }
                        } else {
                            (slots as any)[oldSlot] = undefined
                        }
                        await ctx.db.patch(equipmentDoc._id, { slots })
                    }
                }
            }
            else if (event.type === 'MOVE_ITEM') {
                const item = await ctx.db
                    .query('items')
                    .withIndex('by_instance', (q) => q.eq('instanceId', event.itemId))
                    .first()

                if (item) {
                    // If it was equipped, unequip it from equipment set
                    const oldSlot = item.slot

                    await ctx.db.patch(item._id, {
                        containerId: event.containerId,
                        gridPosition: { x: event.x, y: event.y },
                        slot: undefined,
                        updatedAt: Date.now()
                    })

                    if (oldSlot) {
                        const equipmentDoc = await ctx.db
                            .query('equipment')
                            .withIndex('by_owner', (q) => q.eq('ownerId', item.ownerId))
                            .first()

                        if (equipmentDoc) {
                            const slots = { ...equipmentDoc.slots }
                            if (oldSlot.startsWith('quick_')) {
                                const quickSlotIndex = parseInt(oldSlot.split('_')[1]) - 1;
                                if (quickSlotIndex >= 0 && quickSlotIndex < 5) {
                                    slots.quick[quickSlotIndex] = null;
                                }
                            } else {
                                (slots as any)[oldSlot] = undefined
                            }
                            await ctx.db.patch(equipmentDoc._id, { slots })
                        }
                    }
                }
            }
            else if (event.type === 'TRADE_ITEM') {
                // Initiate trade
                await ctx.db.insert('trades', {
                    senderId: 'current_user', // TODO: get from auth
                    receiverId: event.targetPlayerId,
                    itemInstanceId: event.itemId,
                    status: 'pending',
                    createdAt: Date.now()
                })
            }
        }
        return { success: true }
    }
})

export const transferItem = mutation({
    args: {
        itemInstanceId: v.string(),
        receiverDeviceId: v.string()
    },
    handler: async (ctx, args) => {
        const item = await ctx.db
            .query('items')
            .withIndex('by_instance', (q) => q.eq('instanceId', args.itemInstanceId))
            .first()

        if (!item) return { success: false, error: 'Item not found' }

        // If the item was equipped, unequip it from the old owner's equipment
        if (item.slot) {
            const oldOwnerEquipment = await ctx.db
                .query('equipment')
                .withIndex('by_owner', (q) => q.eq('ownerId', item.ownerId))
                .first();

            if (oldOwnerEquipment) {
                const slots = { ...oldOwnerEquipment.slots };
                let modified = false;
                if (item.slot.startsWith('quick_')) {
                    const quickSlotIndex = parseInt(item.slot.split('_')[1]) - 1;
                    if (quickSlotIndex >= 0 && quickSlotIndex < 5) {
                        slots.quick[quickSlotIndex] = null;
                        modified = true;
                    }
                } else {
                    (slots as any)[item.slot] = undefined;
                    modified = true;
                }
                if (modified) {
                    await ctx.db.patch(oldOwnerEquipment._id, { slots });
                }
            }
        }

        // Move item to new owner
        await ctx.db.patch(item._id, {
            ownerId: args.receiverDeviceId,
            containerId: undefined, // Reset location
            slot: undefined,
            updatedAt: Date.now()
        })

        return { success: true }
    }
})

// --- Debug Mutations ---

export const debugClearInventory = mutation({
    args: {
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const ownerId = args.deviceId

        // Delete all items
        const items = await ctx.db
            .query('items')
            .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
            .collect()

        for (const item of items) {
            await ctx.db.delete(item._id)
        }

        // Reset equipment
        const equipment = await ctx.db
            .query('equipment')
            .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
            .first()

        if (equipment) {
            await ctx.db.patch(equipment._id, {
                slots: {
                    primary: undefined,
                    secondary: undefined,
                    melee: undefined,
                    helmet: undefined,
                    armor: undefined,
                    clothing_top: undefined,
                    clothing_bottom: undefined,
                    backpack: undefined,
                    rig: undefined,
                    artifacts: [],
                    quick: [null, null, null, null, null],
                },
                updatedAt: Date.now(),
            })
        }

        return { success: true }
    }
})

export const debugSpawnRoleItems = mutation({
    args: {
        deviceId: v.string(),
        role: v.string(), // 'police' | 'doctor' | 'engineer' | 'smuggler'
    },
    handler: async (ctx, args) => {
        const ownerId = args.deviceId
        const role = args.role

        // Item Stats Lookup (Synced with frontend templates)
        const ITEM_STATS: Record<string, any> = {
            clothing_basic: { weight: 1, width: 2, height: 2 },
            trousers_basic: { weight: 1, width: 2, height: 2 },
            pistol_pm: { weight: 0.8, width: 2, height: 1 },
            vest_police: { weight: 5.5, width: 3, height: 3 },
            badge: { weight: 0.01, width: 1, height: 1 },
            medkit: { weight: 0.2, width: 1, height: 1 },
            backpack_medic: { weight: 1.2, width: 2, height: 2 },
            pills: { weight: 0.05, width: 1, height: 1 },
            wrench: { weight: 2.5, width: 1, height: 2 },
            belt_tool: { weight: 1.5, width: 2, height: 1 },
            scrap: { weight: 0.3, width: 1, height: 1 },
            knife: { weight: 0.4, width: 1, height: 1 },
            jacket_hidden: { weight: 2.2, width: 2, height: 3 },
            cash: { weight: 0.1, width: 1, height: 1 },
            helmet_police: { weight: 1.8, width: 2, height: 2 },
            rifle_ak74: { weight: 3.2, width: 4, height: 2 },
            scout_jacket: { weight: 0.5, width: 2, height: 2 },
            vodka: { weight: 1.0, width: 1, height: 2 },
            ration_pack: { weight: 0.5, width: 2, height: 1 },
            bandage: { weight: 0.1, width: 1, height: 1 },
            geiger: { weight: 0.4, width: 1, height: 1 },
            artifact_stone: { weight: 0.5, width: 1, height: 1 },
        }

        const GRID_WIDTH = 12; // Standard inventory width
        const occupied = new Set<string>(); // Keep track of "x,y" keys

        // Load existing items to populate occupied grid
        const existingItems = await ctx.db
            .query('items')
            .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
            .collect();

        for (const item of existingItems) {
            if (item.gridPosition) {
                const w = item.stats.width || 1;
                const h = item.stats.height || 1;
                for (let y = item.gridPosition.y; y < item.gridPosition.y + h; y++) {
                    for (let x = item.gridPosition.x; x < item.gridPosition.x + w; x++) {
                        occupied.add(`${x},${y}`);
                    }
                }
            }
        }

        const isRegionFree = (startX: number, startY: number, w: number, h: number) => {
            if (startX + w > GRID_WIDTH) return false;
            for (let y = startY; y < startY + h; y++) {
                for (let x = startX; x < startX + w; x++) {
                    if (occupied.has(`${x},${y}`)) return false;
                }
            }
            return true;
        }

        const markRegion = (startX: number, startY: number, w: number, h: number) => {
            for (let y = startY; y < startY + h; y++) {
                for (let x = startX; x < startX + w; x++) {
                    occupied.add(`${x},${y}`);
                }
            }
        }

        // Helper to create item in grid
        const createItem = async (
            templateId: string,
            name: string,
            kind: ItemKind,
            containerConfig?: {
                width: number;
                height: number;
                name: string;
            }
        ) => {
            const stats = ITEM_STATS[templateId] || { weight: 1, width: 1, height: 1 }
            const w = stats.width || 1;
            const h = stats.height || 1;

            // Find first free spot
            let foundX = 0;
            let foundY = 0;
            let placed = false;

            // Search vertically then horizontally
            // Limit search depth to prevent infinite loops, e.g. 50 rows
            for (let y = 0; y < 50; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    if (isRegionFree(x, y, w, h)) {
                        foundX = x;
                        foundY = y;
                        placed = true;
                        break;
                    }
                }
                if (placed) break;
            }

            if (!placed) {
                // If grid is totally full, maybe just stack at 0,50 or error?
                // For debug, let's just dump at 0, next free row
                console.warn(`Could not place ${name} nicely.`);
                foundY += 1;
            }

            markRegion(foundX, foundY, w, h);

            const id = await ctx.db.insert('items', {
                ownerId,
                templateId,
                instanceId: crypto.randomUUID(),
                kind,
                name,
                description: 'Debug Spawned Item',
                icon: '📦',
                rarity: 'common',
                stats: {
                    weight: stats.weight,
                    width: stats.width,
                    height: stats.height,
                    containerConfig
                },
                quantity: 1,
                gridPosition: { x: foundX, y: foundY },
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })

            return id
        }

        // 1. Base Equipment
        await createItem('clothing_basic', 'Worn Clothes', 'clothing')
        await createItem('trousers_basic', 'Cargo Pants', 'clothing')

        // 2. Role-specific Loadout
        if (role === 'police') {
            await createItem('pistol_pm', 'PM Pistol', 'weapon')
            await createItem('vest_police', 'Police Vest', 'armor', { width: 4, height: 2, name: 'Vest Pockets' })
            await createItem('helmet_police', 'Riot Helmet', 'armor')
            await createItem('rifle_ak74', 'AK-74', 'weapon')
            await createItem('badge', 'Police Badge', 'misc')
        } else if (role === 'doctor') {
            await createItem('medkit', 'First Aid Kit', 'consumable')
            await createItem('backpack_medic', 'Medic Bag', 'backpack', { width: 4, height: 5, name: 'Medic Bag' })
            await createItem('pills', 'Painkillers', 'consumable')
            await createItem('medkit', 'Extra Medkit', 'consumable')
        } else if (role === 'engineer') {
            await createItem('wrench', 'Heavy Wrench', 'weapon')
            await createItem('belt_tool', 'Tool Belt', 'rig', { width: 4, height: 1, name: 'Tool Belt' })
            await createItem('scrap', 'Scrap Metal', 'misc')
            await createItem('pistol_pm', 'Old Pistol', 'weapon')
        } else if (role === 'smuggler') {
            await createItem('knife', 'Switchblade', 'weapon')
            await createItem('jacket_hidden', 'Smuggler Jacket', 'armor', { width: 2, height: 2, name: 'Hidden Pocket' })
            await createItem('cash', 'Credits', 'misc')
            await createItem('pistol_pm', 'Stolen Pistol', 'weapon')
        }

        return { success: true }
    }
})

// --- Queries ---

export const get = query({
    args: { deviceId: v.optional(v.string()), userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const ownerId = args.userId ?? args.deviceId
        if (!ownerId) return null

        const items = await ctx.db
            .query('items')
            .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
            .collect()

        // Get equipment
        const equipmentDoc = await ctx.db
            .query('equipment')
            .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
            .first()

        // Build equipment slots from equipment doc
        type EquipmentSlots = {
            primary: Doc<'items'> | null
            secondary: Doc<'items'> | null
            melee: Doc<'items'> | null
            helmet: Doc<'items'> | null
            armor: Doc<'items'> | null
            clothing_top: Doc<'items'> | null
            clothing_bottom: Doc<'items'> | null
            backpack: Doc<'items'> | null
            rig: Doc<'items'> | null
            artifacts: (Doc<'items'> | null)[]
            quick: (Doc<'items'> | null)[]
        }

        const equipment: EquipmentSlots = {
            primary: null,
            secondary: null,
            melee: null,
            helmet: null,
            armor: null,
            clothing_top: null,
            clothing_bottom: null,
            backpack: null,
            rig: null,
            artifacts: [],
            quick: [null, null, null, null, null],
        }

        if (equipmentDoc) {
            // Resolve item IDs to actual items
            const resolveItem = async (itemId: Id<'items'> | null | undefined): Promise<Doc<'items'> | null> => {
                if (!itemId) return null
                const item = await ctx.db.get(itemId)
                return item ?? null
            }

            equipment.primary = await resolveItem(equipmentDoc.slots.primary)
            equipment.secondary = await resolveItem(equipmentDoc.slots.secondary)
            equipment.melee = await resolveItem(equipmentDoc.slots.melee)
            equipment.helmet = await resolveItem(equipmentDoc.slots.helmet)
            equipment.armor = await resolveItem(equipmentDoc.slots.armor)
            equipment.clothing_top = await resolveItem(equipmentDoc.slots.clothing_top)
            equipment.clothing_bottom = await resolveItem(equipmentDoc.slots.clothing_bottom)
            equipment.backpack = await resolveItem(equipmentDoc.slots.backpack)
            equipment.rig = await resolveItem(equipmentDoc.slots.rig)

            // Resolve artifacts
            equipment.artifacts = await Promise.all(
                (equipmentDoc.slots.artifacts || []).map(resolveItem)
            )

            // Resolve quick slots
            equipment.quick = await Promise.all(
                (equipmentDoc.slots.quick || []).map(resolveItem)
            )
        }

        // Build containers from items with containerConfig
        type ContainerItem = {
            id: string
            ownerId: string
            kind: 'backpack' | 'rig' | 'pocket' | 'stash' | 'equipment_storage'
            name?: string
            width: number
            height: number
            items: Array<Doc<'items'> & { id: string; isEquipped: boolean; equippedSlot?: string }>
        }

        const containers: ContainerItem[] = []

        // Find items that are containers (backpack, rig, armor with containerConfig)
        const containerItems = items.filter((item: Doc<'items'>) => {
            return item.stats?.containerConfig ||
                (item.kind === 'backpack' || item.kind === 'rig' || item.kind === 'armor')
        })

        for (const containerItem of containerItems) {
            const containerConfig = containerItem.stats?.containerConfig
            if (!containerConfig) continue

            // Find items inside this container
            const containerItemsList = items.filter((item: Doc<'items'>) =>
                item.containerId === containerItem.instanceId
            )

            containers.push({
                id: containerItem.instanceId,
                ownerId: containerItem.ownerId,
                kind: containerItem.kind === 'backpack' ? 'backpack' :
                    containerItem.kind === 'rig' ? 'rig' :
                        containerItem.kind === 'armor' ? 'equipment_storage' : 'pocket',
                name: containerConfig.name,
                width: containerConfig.width,
                height: containerConfig.height,
                items: containerItemsList.map((item: Doc<'items'>) => ({
                    ...item,
                    id: item.instanceId,
                    isEquipped: !!item.slot,
                    equippedSlot: item.slot,
                })),
            })
        }

        // Transform items to match frontend format
        const transformedItems = items.map((item: Doc<'items'>) => ({
            ...item,
            id: item.instanceId,
            isEquipped: !!item.slot,
            equippedSlot: item.slot,
        }))

        return {
            items: transformedItems,
            containers,
            equipment,
        }
    },
})
