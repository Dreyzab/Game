import { calculateTemplatePrice, calculateVendorBuyPrice, calculateVendorSellPrice, RARITY_MULTIPLIERS, BASE_PRICES } from "../shared/lib/itemPricing";
export { calculateTemplatePrice, calculateVendorBuyPrice, calculateVendorSellPrice, RARITY_MULTIPLIERS, BASE_PRICES };
/** Рассчитать цену предмета из БД (по строке items) */
export declare function calculateItemPriceFromRow(row: {
    templateId: string;
    kind?: string | null;
    rarity?: string | null;
    condition?: number | null;
    quantity?: number | null;
}): number;
