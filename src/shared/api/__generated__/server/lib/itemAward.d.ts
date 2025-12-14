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
export declare function awardItemsToPlayer(playerId: number, awards: ItemAward[]): Promise<AwardResult[]>;
/**
 * Удалить предметы у игрока (для торговли, использования и т.д.)
 * @param playerId - ID игрока
 * @param itemIds - массив ID предметов из таблицы items
 * @returns количество успешно удалённых предметов
 */
export declare function removeItemsFromPlayer(playerId: number, itemIds: string[]): Promise<{
    removed: string[];
    failed: string[];
}>;
