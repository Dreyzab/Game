/**
 * Модуль выдачи предметов игрокам
 * Используется в VN, квестах, торговле и других системах
 */
import { db } from "../db";
import { items } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { getItemTemplate, hasItemTemplate } from "./itemTemplates";

type Db = typeof db;
type TransactionCallback = Parameters<Db['transaction']>[0];
type Tx = Parameters<TransactionCallback>[0];
type DbClient = Db | Tx;

export interface ItemAward {
  itemId: string; // templateId
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
export async function awardItemsToPlayer(
  playerId: number,
  awards: ItemAward[],
  client: DbClient = db
): Promise<AwardResult[]> {
  const results: AwardResult[] = [];

  for (const award of awards) {
    const { itemId: templateId, quantity = 1 } = award;

    // Проверяем существование шаблона
    if (!hasItemTemplate(templateId)) {
      console.warn(`[itemAward] Unknown template: ${templateId}`);
      results.push({
        success: false,
        itemId: templateId,
        quantity,
        error: `Unknown template: ${templateId}`,
      });
      continue;
    }

    const template = getItemTemplate(templateId)!;

    try {
      // Проверяем, есть ли уже такой предмет в инвентаре (для стакаемых)
      // Стакаются только consumable и misc без слота и контейнера
      const isStackable = template.kind === 'consumable' || template.kind === 'misc';

      if (isStackable) {
        // Ищем существующий предмет того же шаблона без слота и контейнера
        const existing = await client.query.items.findFirst({
          where: and(
            eq(items.ownerId, playerId),
            eq(items.templateId, templateId),
            // slot IS NULL - предмет не экипирован
            // containerId IS NULL - предмет не в контейнере
          ),
        });

        // Фильтруем только свободные предметы (без slot и containerId)
        if (existing && !existing.slot && !existing.containerId) {
          // Увеличиваем количество
          await client.update(items)
            .set({
              quantity: (existing.quantity ?? 1) + quantity,
            })
            .where(eq(items.id, existing.id));

          results.push({
            success: true,
            itemId: templateId,
            quantity,
            dbId: existing.id,
          });
          continue;
        }
      }

      // Создаём новый экземпляр предмета
      const instanceId = `${templateId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();

      const [created] = await client.insert(items).values({
        ownerId: playerId,
        templateId: template.id,
        instanceId,
        name: template.name,
        description: template.description,
        kind: template.kind,
        rarity: template.rarity,
        stats: {
          damage: template.baseStats.damage,
          defense: template.baseStats.defense,
          weight: template.baseStats.weight,
          width: template.baseStats.width,
          height: template.baseStats.height,
          maxDurability: template.baseStats.maxDurability,
          containerConfig: template.baseStats.containerConfig,
        },
        slot: null,
        containerId: null,
        gridPosition: null,
        quantity,
        condition: template.baseStats.maxDurability ?? null,
        createdAt: now,
      }).returning();

      results.push({
        success: true,
        itemId: templateId,
        quantity,
        dbId: created.id,
      });

    } catch (error) {
      console.error(`[itemAward] Error awarding ${templateId}:`, error);
      results.push({
        success: false,
        itemId: templateId,
        quantity,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Удалить предметы у игрока (для торговли, использования и т.д.)
 * @param playerId - ID игрока
 * @param itemIds - массив ID предметов из таблицы items
 * @returns количество успешно удалённых предметов
 */
export async function removeItemsFromPlayer(
  playerId: number,
  itemIds: string[],
  client: DbClient = db
): Promise<{ removed: string[]; failed: string[] }> {
  const removed: string[] = [];
  const failed: string[] = [];

  for (const itemId of itemIds) {
    try {
      // Проверяем, что предмет принадлежит игроку и не экипирован
      const item = await client.query.items.findFirst({
        where: and(
          eq(items.id, itemId),
          eq(items.ownerId, playerId)
        ),
      });

      if (!item) {
        failed.push(itemId);
        continue;
      }

      // Не позволяем удалять экипированные предметы
      if (item.slot) {
        console.warn(`[itemAward] Cannot remove equipped item: ${itemId}`);
        failed.push(itemId);
        continue;
      }

      // Удаляем предмет
      await client.delete(items).where(eq(items.id, itemId));
      removed.push(itemId);

    } catch (error) {
      console.error(`[itemAward] Error removing ${itemId}:`, error);
      failed.push(itemId);
    }
  }

  return { removed, failed };
}
