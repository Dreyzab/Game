/**
 * Модуль расчёта цен предметов (сервер) — опирается на shared расчёт
 */
import type { ItemTemplate, Rarity } from "../shared/data/itemTypes";
import {
  calculateTemplatePrice,
  calculateVendorBuyPrice,
  calculateVendorSellPrice,
  RARITY_MULTIPLIERS,
  BASE_PRICES,
} from "../shared/lib/itemPricing";
import { getItemTemplate } from "./itemTemplates";

export { calculateTemplatePrice, calculateVendorBuyPrice, calculateVendorSellPrice, RARITY_MULTIPLIERS, BASE_PRICES };

/** Рассчитать цену предмета из БД (по строке items) */
export function calculateItemPriceFromRow(row: {
  templateId: string;
  kind?: string | null;
  rarity?: string | null;
  condition?: number | null;
  quantity?: number | null;
}): number {
  const template = getItemTemplate(row.templateId);
  
  if (template) {
    let price = calculateTemplatePrice(template);
    
    // Учитываем состояние предмета (condition)
    if (row.condition !== null && row.condition !== undefined) {
      const conditionMultiplier = row.condition / 100;
      price = Math.floor(price * conditionMultiplier);
    }
    
    // Учитываем количество
    if (row.quantity && row.quantity > 1) {
      price *= row.quantity;
    }
    
    return price;
  }
  
  // Fallback для предметов без шаблона
  const basePrice = BASE_PRICES[row.kind ?? 'misc'] ?? 50;
  const multiplier = RARITY_MULTIPLIERS[(row.rarity as Rarity) ?? 'common'] ?? 1;
  return Math.floor(basePrice * multiplier * (row.quantity ?? 1));
}
