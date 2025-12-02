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
            return await ctx.db.insert('items', {
                ownerId,
                templateId,
                instanceId: crypto.randomUUID(),
                kind,
                name,
                description: 'Starter item',
                icon: '📦', // Placeholder, frontend has real icons
                rarity: 'common',
                stats: {
                    weight: 1,
                    width: 1,
                    height: 1,
                    containerConfig
                },
                quantity: 1,
                slot,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })
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
                }
            }
            else if (event.type === 'UNEQUIP_ITEM') {
                const item = await ctx.db
                    .query('items')
                    .withIndex('by_instance', (q) => q.eq('instanceId', event.itemId))
                    .first()

                if (item) {
                    await ctx.db.patch(item._id, {
                        slot: undefined,
                        updatedAt: Date.now()
                    })
                }
            }
            else if (event.type === 'MOVE_ITEM') {
                const item = await ctx.db
                    .query('items')
                    .withIndex('by_instance', (q) => q.eq('instanceId', event.itemId))
                    .first()

                if (item) {
                    await ctx.db.patch(item._id, {
                        containerId: event.containerId,
                        gridPosition: { x: event.x, y: event.y },
                        slot: undefined,
                        updatedAt: Date.now()
                    })
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
