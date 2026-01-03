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
export declare function getVendorStock(vendorId?: string): VendorStockItem[];
/** Получить цену покупки (торговец покупает дешевле) */
export declare function getVendorBuyPrice(templateId: string): number;
/** Получить цену продажи (торговец продаёт дороже) */
export declare function getVendorSellPrice(templateId: string): number;
