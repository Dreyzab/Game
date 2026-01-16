/**
 * Trader Service - Generates trader inventory and handles buy/sell transactions
 * Activated when dailyEvent.type === 'traders_arrived'
 */

import type { SurvivalState, SurvivalPlayer } from '../shared/types/survival'

// ============================================================================
// TRADER ITEM CATALOG
// ============================================================================

export interface TraderItem {
    templateId: string
    nameRu: string
    basePrice: number
    sellPrice: number // What trader pays for this item
    category: 'food' | 'medicine' | 'gear' | 'ammo' | 'misc'
}

/**
 * TRADER_CATALOG
 * - 14 предметов
 * - templateId'ы подобраны так, чтобы существовать в `shared/data/itemTemplates`
 * - цены указаны в "еде" (state.resources.food)
 */
export const TRADER_CATALOG: TraderItem[] = [
    // Food (3)
    { templateId: 'canned_food', nameRu: 'Консервы', basePrice: 15, sellPrice: 6, category: 'food' },
    { templateId: 'ration_pack', nameRu: 'Сухпаёк', basePrice: 18, sellPrice: 7, category: 'food' },
    { templateId: 'sausage_slice', nameRu: 'Кусок колбасы', basePrice: 10, sellPrice: 4, category: 'food' },

    // Medicine (3)
    { templateId: 'bandage', nameRu: 'Бинт', basePrice: 20, sellPrice: 8, category: 'medicine' },
    { templateId: 'pills', nameRu: 'Обезболивающее', basePrice: 16, sellPrice: 6, category: 'medicine' },
    { templateId: 'medkit', nameRu: 'Аптечка', basePrice: 45, sellPrice: 18, category: 'medicine' },

    // Gear (3)
    { templateId: 'flashlight', nameRu: 'Фонарик', basePrice: 25, sellPrice: 10, category: 'gear' },
    { templateId: 'radio', nameRu: 'Рация', basePrice: 28, sellPrice: 12, category: 'gear' },
    { templateId: 'repair_kit_small', nameRu: 'Ремкомплект (малый)', basePrice: 22, sellPrice: 9, category: 'gear' },

    // Ammo (3)
    { templateId: 'ammo_pistol_mag', nameRu: 'Магазин пистолетный', basePrice: 20, sellPrice: 8, category: 'ammo' },
    { templateId: 'ammo_rifle_mag', nameRu: 'Магазин автоматный', basePrice: 28, sellPrice: 11, category: 'ammo' },
    { templateId: 'ammo_shotgun', nameRu: 'Патроны 12 калибра', basePrice: 24, sellPrice: 10, category: 'ammo' },

    // Misc (2)
    { templateId: 'scrap', nameRu: 'Лом', basePrice: 6, sellPrice: 2, category: 'misc' },
    { templateId: 'organizer_pouch', nameRu: 'Органайзер', basePrice: 12, sellPrice: 5, category: 'misc' },
]

// ============================================================================
// TRADER INVENTORY STATE (per session)
// ============================================================================

export interface TraderInventoryItem {
    templateId: string
    nameRu: string
    price: number // Current buy price (may be modified by 'face' role)
    sellPrice: number
    quantity: number
    category: TraderItem['category']
}

const traderInventories = new Map<string, TraderInventoryItem[]>()

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Generate trader inventory for a session
 * Called when 'traders_arrived' daily event starts
 */
export function generateTraderInventory(sessionId: string): TraderInventoryItem[] {
    // Generate 6-10 random items from catalog
    const itemCount = 6 + Math.floor(Math.random() * 5)
    const shuffled = [...TRADER_CATALOG].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, itemCount)

    const inventory: TraderInventoryItem[] = selected.map(item => ({
        templateId: item.templateId,
        nameRu: item.nameRu,
        price: item.basePrice,
        sellPrice: item.sellPrice,
        quantity: 1 + Math.floor(Math.random() * 3), // 1-3 of each
        category: item.category,
    }))

    traderInventories.set(sessionId, inventory)
    return inventory
}

/**
 * Get trader inventory for a session
 * Returns null if traders haven't arrived
 */
export function getTraderInventory(
    sessionId: string,
    player?: SurvivalPlayer
): TraderInventoryItem[] | null {
    const inventory = traderInventories.get(sessionId)
    if (!inventory) return null

    // Apply 'face' role discount (50% off)
    if (player?.role === 'face') {
        return inventory.map(item => ({
            ...item,
            price: Math.floor(item.price * 0.5),
        }))
    }

    return inventory
}

/**
 * Buy item from trader
 */
export function buyFromTrader(
    state: SurvivalState,
    player: SurvivalPlayer,
    templateId: string,
    quantity: number
): { success: boolean; message: string } {
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        return { success: false, message: 'Invalid quantity' }
    }

    const inventory = traderInventories.get(state.sessionId)
    if (!inventory) {
        return { success: false, message: 'Traders not available' }
    }

    const item = inventory.find(i => i.templateId === templateId)
    if (!item) {
        return { success: false, message: 'Item not found' }
    }

    if (item.quantity < quantity) {
        return { success: false, message: 'Not enough stock' }
    }

    // Apply face discount
    const basePrice = item.price
    const price = player.role === 'face' ? Math.floor(basePrice * 0.5) : basePrice
    const totalCost = price * quantity

    // Check player has enough currency (use base resources as currency for now)
    if (state.resources.food < totalCost) {
        return { success: false, message: `Need ${totalCost} food, have ${state.resources.food}` }
    }

    // Process transaction
    state.resources.food -= totalCost
    item.quantity -= quantity

    // Add to player inventory
    const existing = player.inventory.items.find(i => i.templateId === templateId)
    if (existing) {
        existing.quantity += quantity
    } else {
        player.inventory.items.push({ templateId, quantity })
    }

    return { success: true, message: `Bought ${quantity}x ${item.nameRu} for ${totalCost} food` }
}

/**
 * Sell item to trader
 */
export function sellToTrader(
    state: SurvivalState,
    player: SurvivalPlayer,
    templateId: string,
    quantity: number
): { success: boolean; message: string } {
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        return { success: false, message: 'Invalid quantity' }
    }

    const inventory = traderInventories.get(state.sessionId)
    if (!inventory) {
        return { success: false, message: 'Traders not available' }
    }

    // Check player has the item
    const playerItem = player.inventory.items.find(i => i.templateId === templateId)
    if (!playerItem || playerItem.quantity < quantity) {
        return { success: false, message: 'Not enough items to sell' }
    }

    // Find sell price from catalog
    const catalogItem = TRADER_CATALOG.find(i => i.templateId === templateId)
    const sellPrice = catalogItem?.sellPrice ?? 2 // Default 2 if not in catalog
    const totalValue = sellPrice * quantity

    // Process transaction
    playerItem.quantity -= quantity
    if (playerItem.quantity <= 0) {
        const idx = player.inventory.items.indexOf(playerItem)
        player.inventory.items.splice(idx, 1)
    }

    state.resources.food += totalValue

    // Add sold items to trader stock so others can buy it back (simple economy)
    const existingInTrader = inventory.find(i => i.templateId === templateId)
    if (existingInTrader) {
        existingInTrader.quantity += quantity
    } else if (catalogItem) {
        inventory.push({
            templateId: catalogItem.templateId,
            nameRu: catalogItem.nameRu,
            price: catalogItem.basePrice,
            sellPrice: catalogItem.sellPrice,
            quantity,
            category: catalogItem.category,
        })
    } else {
        inventory.push({
            templateId,
            nameRu: templateId,
            price: Math.max(2, sellPrice * 4),
            sellPrice,
            quantity,
            category: 'misc',
        })
    }

    const itemName = catalogItem?.nameRu ?? templateId
    return { success: true, message: `Sold ${quantity}x ${itemName} for ${totalValue} food` }
}

/**
 * Clear trader inventory for a session (when traders leave)
 */
export function clearTraderInventory(sessionId: string): void {
    traderInventories.delete(sessionId)
}

export const traderService = {
    generateTraderInventory,
    getTraderInventory,
    buyFromTrader,
    sellToTrader,
    clearTraderInventory,
}
