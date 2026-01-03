/**
 * Модуль для работы с ассортиментом торговцев
 */
import { getItemTemplate } from "./itemTemplates";
import { calculateVendorBuyPrice, calculateVendorSellPrice } from "./itemPricing";
import type { ItemKind, ItemTemplate, Rarity } from "../shared/data/itemTypes";

export interface VendorStockItem {
  templateId: string;
  name: string;
  description: string;
  kind: ItemKind;
  rarity: Rarity;
  icon: string;
  price: number;
  quantity: number;
  stats: ItemTemplate['baseStats'];
}

/** Получить стандартный ассортимент торговца */
export function getVendorStock(vendorId?: string): VendorStockItem[] {
  // В будущем можно подгружать из БД по vendorId
  // Пока возвращаем базовый набор расходников и оружия
  
  const defaultVendorItems = [
    'bandage',
    'medkit',
    'pills',
    'ration_pack',
    'canned_food',
    'knife',
    'rusty_pipe',
    'scrap',
  ];
  
  return defaultVendorItems
    .map((templateId) => {
      const template = getItemTemplate(templateId);
      if (!template) return null;
      
      return {
        templateId: template.id,
        name: template.name,
        description: template.description,
        kind: template.kind,
        rarity: template.rarity,
        icon: template.icon,
        price: calculateVendorSellPrice(template),
        quantity: 10, // У торговца бесконечный запас (условно 10)
        stats: template.baseStats,
      };
    })
    .filter((item): item is VendorStockItem => item !== null);
}

/** Получить цену покупки (торговец покупает дешевле) */
export function getVendorBuyPrice(templateId: string): number {
  const template = getItemTemplate(templateId);
  if (!template) return 5;
  
  return calculateVendorBuyPrice(template);
}

/** Получить цену продажи (торговец продаёт дороже) */
export function getVendorSellPrice(templateId: string): number {
  const template = getItemTemplate(templateId);
  if (!template) return 50;
  
  return calculateVendorSellPrice(template);
}
