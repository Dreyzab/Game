/**
 * Trader Service - Generates trader inventory and handles buy/sell transactions
 * Activated when dailyEvent.type === 'traders_arrived'
 */
import type { SurvivalState, SurvivalPlayer } from '../shared/types/survival';
export interface TraderItem {
    templateId: string;
    nameRu: string;
    basePrice: number;
    sellPrice: number;
    category: 'food' | 'medicine' | 'gear' | 'ammo' | 'misc';
}
/**
 * TRADER_CATALOG
 * - 14 предметов
 * - templateId'ы подобраны так, чтобы существовать в `shared/data/itemTemplates`
 * - цены указаны в "еде" (state.resources.food)
 */
export declare const TRADER_CATALOG: TraderItem[];
export interface TraderInventoryItem {
    templateId: string;
    nameRu: string;
    price: number;
    sellPrice: number;
    quantity: number;
    category: TraderItem['category'];
}
/**
 * Generate trader inventory for a session
 * Called when 'traders_arrived' daily event starts
 */
export declare function generateTraderInventory(sessionId: string): TraderInventoryItem[];
/**
 * Get trader inventory for a session
 * Returns null if traders haven't arrived
 */
export declare function getTraderInventory(sessionId: string, player?: SurvivalPlayer): TraderInventoryItem[] | null;
/**
 * Buy item from trader
 */
export declare function buyFromTrader(state: SurvivalState, player: SurvivalPlayer, templateId: string, quantity: number): {
    success: boolean;
    message: string;
};
/**
 * Sell item to trader
 */
export declare function sellToTrader(state: SurvivalState, player: SurvivalPlayer, templateId: string, quantity: number): {
    success: boolean;
    message: string;
};
/**
 * Clear trader inventory for a session (when traders leave)
 */
export declare function clearTraderInventory(sessionId: string): void;
export declare const traderService: {
    generateTraderInventory: typeof generateTraderInventory;
    getTraderInventory: typeof getTraderInventory;
    buyFromTrader: typeof buyFromTrader;
    sellToTrader: typeof sellToTrader;
    clearTraderInventory: typeof clearTraderInventory;
};
