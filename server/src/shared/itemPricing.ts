/**
 * Унифицированный расчёт цен предметов (shared между клиентом и сервером)
 */

import type { ItemTemplate, Rarity } from './itemTypes'

/** Множители цены по редкости */
export const RARITY_MULTIPLIERS: Record<Rarity, number> = {
    common: 1,
    uncommon: 2.5,
    rare: 6,
    epic: 15,
    legendary: 50,
}

/** Базовые цены по типу предмета */
export const BASE_PRICES: Record<string, number> = {
    weapon: 150,
    armor: 120,
    clothing: 80,
    artifact: 500,
    consumable: 30,
    backpack: 200,
    rig: 150,
    misc: 10,
}

/**
 * Цена по шаблону (без учёта износа и количества)
 */
export function calculateTemplatePrice(template: ItemTemplate): number {
    const basePrice = BASE_PRICES[template.kind] ?? 50
    const multiplier = RARITY_MULTIPLIERS[template.rarity] ?? 1
    return Math.floor(basePrice * multiplier)
}

/**
 * Цена по templateId, если шаблон найден
 */
export function calculateTemplatePriceById(templates: Record<string, ItemTemplate>, templateId: string): number {
    const tpl = templates[templateId]
    if (!tpl) return 0
    return calculateTemplatePrice(tpl)
}

/** Цена, по которой торговец покупает у игрока (скидка 60%) */
export function calculateVendorBuyPrice(template: ItemTemplate): number {
    return Math.floor(calculateTemplatePrice(template) * 0.4)
}

/** Цена, по которой торговец продаёт игроку (базовая цена) */
export function calculateVendorSellPrice(template: ItemTemplate): number {
    return calculateTemplatePrice(template)
}

