/**
 * Модуль выдачи предметов игрокам
 * Используется в VN, квестах, торговле и других системах
 */
import { db } from "../db";
type Db = typeof db;
type TransactionCallback = Parameters<Db['transaction']>[0];
type Tx = Parameters<TransactionCallback>[0];
type DbClient = Db | Tx;
export interface ItemAward {
    itemId: string;
    quantity?: number;
}
export interface AwardResult {
    success: boolean;
    itemId: string;
    quantity: number;
    dbId?: string;
    error?: string;
}
/**
 * Выдать предметы игроку
 * @param playerId - ID игрока в таблице players
 * @param awards - массив предметов для выдачи
 * @returns результаты выдачи каждого предмета
 */
export declare function awardItemsToPlayer(playerId: number, awards: ItemAward[], client?: DbClient): Promise<AwardResult[]>;
/**
 * Удалить предметы у игрока (для торговли, использования и т.д.)
 * @param playerId - ID игрока
 * @param itemIds - массив ID предметов из таблицы items
 * @returns количество успешно удалённых предметов
 */
export declare function removeItemsFromPlayer(playerId: number, itemIds: string[], client?: DbClient): Promise<{
    removed: string[];
    failed: string[];
}>;
export {};
