/**
 * Унифицированный расчёт цен предметов (shared между клиентом и сервером)
 */
import type { ItemTemplate, Rarity } from './itemTypes';
/** Множители цены по редкости */
export declare const RARITY_MULTIPLIERS: Record<Rarity, number>;
/** Базовые цены по типу предмета */
export declare const BASE_PRICES: Record<string, number>;
/**
 * Цена по шаблону (без учёта износа и количества)
 */
export declare function calculateTemplatePrice(template: ItemTemplate): number;
/**
 * Цена по templateId, если шаблон найден
 */
export declare function calculateTemplatePriceById(templates: Record<string, ItemTemplate>, templateId: string): number;
/** Цена, по которой торговец покупает у игрока (скидка 60%) */
export declare function calculateVendorBuyPrice(template: ItemTemplate): number;
/** Цена, по которой торговец продаёт игроку (базовая цена) */
export declare function calculateVendorSellPrice(template: ItemTemplate): number;
