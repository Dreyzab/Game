import { Elysia, t } from "elysia";
import { db } from "../../db";
import { items, trades, tradeItems, tradeSessions, players } from "../../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "../auth";
import { ITEM_TEMPLATES_BY_ID, hasItemTemplate } from "../../lib/itemTemplates";
import { calculateItemPriceFromRow, calculateTemplatePrice } from "../../lib/itemPricing";
import { getVendorStock, getVendorBuyPrice, getVendorSellPrice } from "../../lib/vendorStock";
import { awardItemsToPlayer, removeItemsFromPlayer } from "../../lib/itemAward";

type EquipmentSlots = {
    primary: any | null;
    secondary: any | null;
    melee: any | null;
    helmet: any | null;
    armor: any | null;
    clothing_top: any | null;
    clothing_bottom: any | null;
    backpack: any | null;
    rig: any | null;
    artifacts: any[];
    quick: Array<any | null>;
};

const TEMPLATE_BY_ID = ITEM_TEMPLATES_BY_ID;
const now = () => Date.now();

const resolvePlayer = async (user: any) => {
    if (!user) return null;
    return db.query.players.findFirst({
        where: user.type === 'clerk' ? eq(players.userId, user.id) : eq(players.deviceId, user.id),
    });
};

const buildInventoryPayload = async (ownerId: number) => {
    const userItems = await db.query.items.findMany({
        where: eq(items.ownerId, ownerId),
    });

    const itemById = new Map<string, any>();
    const idToInstanceId = new Map<string, string>();

    userItems.forEach((row) => {
        const instanceId = row.instanceId ?? row.id;
        idToInstanceId.set(row.id, instanceId);
        itemById.set(row.id, {
            id: row.id,
            templateId: row.templateId ?? 'unknown_template',
            instanceId,
            kind: row.kind ?? 'misc',
            name: row.name ?? TEMPLATE_BY_ID[row.templateId ?? '']?.name ?? 'Unknown item',
            description: row.description ?? TEMPLATE_BY_ID[row.templateId ?? '']?.description ?? '',
            icon: row.templateId ?? 'item',
            rarity: row.rarity ?? (TEMPLATE_BY_ID[row.templateId ?? '']?.rarity ?? 'common'),
            stats: row.stats ?? {
                weight: 0,
                width: 1,
                height: 1,
            },
            quantity: row.quantity ?? 1,
            condition: row.condition ?? undefined,
            gridPosition: row.gridPosition ?? undefined,
            containerId: undefined as string | undefined,
            isEquipped: false,
            equippedSlot: undefined as string | undefined,
            ownerId: row.ownerId,
        });
    });

    userItems.forEach((row) => {
        if (!row.containerId) return;
        const item = itemById.get(row.id);
        const containerInstanceId = idToInstanceId.get(row.containerId) ?? row.containerId;
        item.containerId = containerInstanceId;
    });

    const equipment: EquipmentSlots = {
        primary: null,
        secondary: null,
        melee: null,
        helmet: null,
        armor: null,
        clothing_top: null,
        clothing_bottom: null,
        backpack: null,
        rig: null,
        artifacts: [],
        quick: Array.from({ length: 5 }, () => null),
    };

    userItems.forEach((row) => {
        const slot = row.slot as string | null;
        if (!slot) return;
        const item = itemById.get(row.id);
        item.isEquipped = true;
        item.equippedSlot = slot;

        const quickMatch = slot.match(/^quick_(\d)$/);
        if (quickMatch) {
            const idx = Number(quickMatch[1]) - 1;
            if (idx >= 0 && idx < equipment.quick.length) {
                equipment.quick[idx] = item;
            }
            return;
        }

        switch (slot) {
            case 'primary': equipment.primary = item; break;
            case 'secondary': equipment.secondary = item; break;
            case 'melee': equipment.melee = item; break;
            case 'helmet': equipment.helmet = item; break;
            case 'armor': equipment.armor = item; break;
            case 'clothing_top': equipment.clothing_top = item; break;
            case 'clothing_bottom': equipment.clothing_bottom = item; break;
            case 'backpack': equipment.backpack = item; break;
            case 'rig': equipment.rig = item; break;
            case 'artifact': equipment.artifacts.push(item); break;
        }
    });

    const containers: any[] = [];
    userItems.forEach((row) => {
        const cfg = row.stats?.containerConfig as { width: number; height: number; name?: string } | undefined;
        if (!cfg) return;
        const item = itemById.get(row.id);
        const children = userItems
            .filter((child) => child.containerId === row.id)
            .map((child) => itemById.get(child.id));

        const kind =
            row.kind === 'backpack' ? 'backpack' :
                row.kind === 'rig' ? 'rig' :
                    row.kind === 'helmet' ? 'pocket' :
                        'equipment_storage';

        containers.push({
            id: item.instanceId,
            ownerId: String(row.ownerId ?? 'player'),
            kind,
            name: cfg.name ?? row.name ?? 'Container',
            width: cfg.width ?? 4,
            height: cfg.height ?? 4,
            items: children,
        });
    });

    const looseItems = userItems
        .filter((row) => !row.slot && !row.containerId)
        .map((row) => itemById.get(row.id));

    return {
        items: looseItems,
        containers,
        equipment,
    };
};

async function spendScrap(ownerId: number, required: number) {
    if (required <= 0) return { success: true, spent: 0 };
    // Ищем любой "scrap" у игрока (неэкипированный)
    const scrapItem = await db.query.items.findFirst({
        where: and(eq(items.ownerId, ownerId), eq(items.templateId, 'scrap')),
    });

    if (!scrapItem || (scrapItem.quantity ?? 1) < required) {
        return { success: false, error: 'Недостаточно скрапа', have: scrapItem?.quantity ?? 0, required };
    }

    const left = (scrapItem.quantity ?? 1) - required;
    if (left > 0) {
        await db.update(items).set({ quantity: left }).where(eq(items.id, scrapItem.id));
    } else {
        await db.delete(items).where(eq(items.id, scrapItem.id));
    }

    return { success: true, spent: required };
}

function calcMaxCondition(templateId: string): number {
    const tpl = ITEM_TEMPLATES_BY_ID[templateId];
    return tpl?.baseStats.maxDurability ?? 100;
}

function calcRepairCost(templateId: string, currentCondition: number | null | undefined) {
    const maxCond = calcMaxCondition(templateId);
    const condition = currentCondition ?? maxCond;
    const missing = Math.max(0, maxCond - condition);
    // 1 единица скрапа за каждые 25% урона, минимум 1 если есть урон
    const scrapNeeded = missing <= 0 ? 0 : Math.max(1, Math.ceil(missing / (maxCond * 0.25)));
    // Стоимость деньгами (пока не списываем валюту, только информируем)
    const tpl = ITEM_TEMPLATES_BY_ID[templateId];
    const price = tpl ? Math.floor(calculateTemplatePrice(tpl) * (missing / maxCond) * 0.4) : 0;
    return { scrapNeeded, price, missing, maxCond };
}

function applyUpgradeStats(row: any, upgradeType: 'weapon' | 'armor') {
    const stats = row.stats ?? {};
    const level = (stats.upgradeLevel ?? 0) + 1;
    const cappedLevel = Math.min(level, 3);
    const factor = 1 + 0.1; // +10% за апгрейд

    if (upgradeType === 'weapon') {
        const baseDamage = stats.damage ?? ITEM_TEMPLATES_BY_ID[row.templateId]?.baseStats.damage ?? 0;
        stats.damage = Math.round(baseDamage * factor);
    } else {
        const baseDefense = stats.defense ?? ITEM_TEMPLATES_BY_ID[row.templateId]?.baseStats.defense ?? 0;
        stats.defense = Math.round(baseDefense * factor);
    }

    stats.upgradeLevel = cappedLevel;
    return stats;
}

const mapTradeSession = (session: any) => ({
    id: session.id,
    status: session.status,
    partnerNpcId: session.partnerNpcId,
    partnerId: session.partnerId,
    currency: session.currency ?? 'кр.',
    expiresAt: session.expiresAt,
    updatedAt: session.updatedAt,
});

const loadSessionWithItems = async (sessionId: number) => {
    const session = await db.query.tradeSessions.findFirst({
        where: eq(tradeSessions.id, sessionId),
    });
    if (!session) return null;
    const items = await db.query.tradeItems.findMany({
        where: eq(tradeItems.sessionId, sessionId),
    });
    return { session, items };
};

export const inventoryRoutes = (app: Elysia) =>
    app
        .use(auth)
        .group("/inventory", (app) =>
            app
                // GET /inventory - Get all items for the user
                .get("/", async ({ user }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const player = await resolvePlayer(user);
                    if (!player) return { items: [] };
                    return buildInventoryPayload(player.id);
                })

                // POST /inventory/trade/offer
                .post("/trade/offer", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };

                    const sender = await db.query.players.findFirst({
                        where: user.type === 'clerk' ? eq(players.userId, user.id) : eq(players.deviceId, user.id)
                    });
                    if (!sender) return { error: "Player not found", status: 404 };

                    // Logic to create a trade offer
                    // Find receiver
                    const receiver = await db.query.players.findFirst({
                        where: eq(players.id, body.receiverId)
                    });
                    if (!receiver) return { error: "Receiver not found", status: 404 };

                    // Verify item ownership
                    const item = await db.query.items.findFirst({
                        where: and(eq(items.id, body.itemId), eq(items.ownerId, sender.id))
                    });
                    if (!item) return { error: "Item not found", status: 404 };

                    await db.insert(trades).values({
                        senderId: sender.id,
                        receiverId: receiver.id,
                        itemId: item.id,
                        status: 'pending',
                        createdAt: Date.now()
                    });

                    return { success: true };
                }, {
                    body: t.Object({
                        receiverId: t.Number(),
                        itemId: t.String()
                    })
                })

                // POST /inventory/trade/execute - Execute trade with NPC vendor
                .post("/trade/execute", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };

                    const player = await resolvePlayer(user);
                    if (!player) return { error: "Player not found", status: 404 };

                    const { playerOfferIds, traderOffer, npcId } = body;

                    // Validate player items
                    const playerItemsToSell: Array<{ id: string; templateId: string; quantity: number }> = [];
                    let playerTotal = 0;

                    if (playerOfferIds && playerOfferIds.length > 0) {
                        for (const itemId of playerOfferIds) {
                            const item = await db.query.items.findFirst({
                                where: and(
                                    eq(items.id, itemId),
                                    eq(items.ownerId, player.id)
                                )
                            });

                            if (!item) {
                                return { error: `Item not found: ${itemId}`, status: 404 };
                            }

                            // Cannot sell equipped items
                            if (item.slot) {
                                return { error: `Cannot sell equipped item: ${itemId}`, status: 400 };
                            }

                            // Cannot sell quest items (kind = 'quest' or tag 'quest')
                            if (item.kind === 'quest') {
                                return { error: `Cannot sell quest item: ${itemId}`, status: 400 };
                            }

                            playerItemsToSell.push({
                                id: item.id,
                                templateId: item.templateId,
                                quantity: item.quantity ?? 1
                            });

                            // Calculate buy price (vendor buys at 40% of sell price)
                            playerTotal += getVendorBuyPrice(item.templateId) * (item.quantity ?? 1);
                        }
                    }

                    // Validate trader items
                    const traderItemsToGive: Array<{ templateId: string; quantity: number }> = [];
                    let traderTotal = 0;

                    if (traderOffer && traderOffer.length > 0) {
                        for (const offer of traderOffer) {
                            if (!hasItemTemplate(offer.templateId)) {
                                return { error: `Unknown item template: ${offer.templateId}`, status: 400 };
                            }

                            const qty = offer.quantity ?? 1;
                            traderItemsToGive.push({
                                templateId: offer.templateId,
                                quantity: qty
                            });

                            traderTotal += getVendorSellPrice(offer.templateId) * qty;
                        }
                    }

                    // Check balance - player must pay at least what items cost
                    if (playerTotal < traderTotal) {
                        return {
                            error: `Insufficient trade value. You offer: ${playerTotal}, trader wants: ${traderTotal}`,
                            status: 400
                        };
                    }

                    // Execute trade
                    // 1. Remove player items
                    const removeResult = await removeItemsFromPlayer(
                        player.id,
                        playerItemsToSell.map(item => item.id)
                    );

                    if (removeResult.failed.length > 0) {
                        return {
                            error: `Failed to remove items: ${removeResult.failed.join(', ')}`,
                            status: 500
                        };
                    }

                    // 2. Give trader items to player
                    const awardResult = await awardItemsToPlayer(
                        player.id,
                        traderItemsToGive.map(item => ({
                            itemId: item.templateId,
                            quantity: item.quantity
                        }))
                    );

                    const awardedItems = awardResult
                        .filter(r => r.success)
                        .map(r => ({ itemId: r.itemId, quantity: r.quantity, dbId: r.dbId }));

                    const failedAwards = awardResult
                        .filter(r => !r.success)
                        .map(r => r.itemId);

                    return {
                        success: true,
                        soldItems: removeResult.removed,
                        receivedItems: awardedItems,
                        failedAwards: failedAwards.length > 0 ? failedAwards : undefined,
                        balance: {
                            playerTotal,
                            traderTotal,
                            difference: playerTotal - traderTotal
                        }
                    };
                }, {
                    body: t.Object({
                        playerOfferIds: t.Optional(t.Array(t.String())),
                        traderOffer: t.Optional(t.Array(t.Object({
                            templateId: t.String(),
                            quantity: t.Optional(t.Number())
                        }))),
                        npcId: t.Optional(t.String())
                    })
                })

                // POST /inventory/repair - Repair item using scrap
                .post("/repair", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const player = await resolvePlayer(user);
                    if (!player) return { error: "Player not found", status: 404 };

                    const { itemId } = body;
                    if (!itemId) return { error: "itemId is required", status: 400 };

                    const item = await db.query.items.findFirst({
                        where: and(eq(items.id, itemId), eq(items.ownerId, player.id)),
                    });
                    if (!item) return { error: "Item not found", status: 404 };

                    const { scrapNeeded, price, missing, maxCond } = calcRepairCost(item.templateId, item.condition);
                    if (missing <= 0) {
                        return { success: true, repaired: false, message: "Предмет уже в идеальном состоянии", itemId, condition: item.condition };
                    }

                    const spend = await spendScrap(player.id, scrapNeeded);
                    if (!spend.success) {
                        return { error: `Нужно скрапа: ${scrapNeeded}, у вас: ${spend.have ?? 0}`, status: 400 };
                    }

                    await db.update(items)
                        .set({ condition: maxCond, stats: item.stats })
                        .where(eq(items.id, item.id));

                    return {
                        success: true,
                        repaired: true,
                        itemId,
                        newCondition: maxCond,
                        scrapSpent: spend.spent,
                        suggestedPrice: price,
                    };
                }, {
                    body: t.Object({
                        itemId: t.String(),
                    }),
                })

                // POST /inventory/upgrade - Upgrade item (weapon dmg or armor def) using scrap
                .post("/upgrade", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const player = await resolvePlayer(user);
                    if (!player) return { error: "Player not found", status: 404 };

                    const { itemId } = body;
                    if (!itemId) return { error: "itemId is required", status: 400 };

                    const item = await db.query.items.findFirst({
                        where: and(eq(items.id, itemId), eq(items.ownerId, player.id)),
                    });
                    if (!item) return { error: "Item not found", status: 404 };

                    const tpl = ITEM_TEMPLATES_BY_ID[item.templateId];
                    if (!tpl) return { error: "Template not found", status: 404 };

                    const upgradeLevel = (item.stats as any)?.upgradeLevel ?? 0;
                    if (upgradeLevel >= 3) {
                        return { error: "Достигнут максимум улучшений (3)", status: 400 };
                    }

                    const upgradeType = tpl.kind === 'weapon' ? 'weapon' :
                        (tpl.kind === 'armor' || tpl.kind === 'clothing') ? 'armor' : null;

                    if (!upgradeType) {
                        return { error: "Этот предмет нельзя улучшить у мастера", status: 400 };
                    }

                    const scrapNeeded = (upgradeLevel + 1) * 2; // растущая стоимость
                    const spend = await spendScrap(player.id, scrapNeeded);
                    if (!spend.success) {
                        return { error: `Нужно скрапа: ${scrapNeeded}, у вас: ${spend.have ?? 0}`, status: 400 };
                    }

                    const newStats = applyUpgradeStats(item, upgradeType);

                    await db.update(items)
                        .set({
                            stats: newStats,
                        })
                        .where(eq(items.id, item.id));

                    return {
                        success: true,
                        itemId,
                        scrapSpent: spend.spent,
                        upgradeLevel: newStats.upgradeLevel,
                        stats: newStats,
                    };
                }, {
                    body: t.Object({
                        itemId: t.String(),
                    }),
                })

                // GET /inventory/stash - Get stash items (not directly on player)
                .get("/stash", async ({ user }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const player = await resolvePlayer(user);
                    if (!player) return { items: [] };

                    const stashItems = await db.query.items.findMany({
                        where: and(
                            eq(items.ownerId, player.id),
                            eq(items.slot, 'stash')
                        ),
                    });

                    return {
                        items: stashItems.map(row => ({
                            id: row.id,
                            templateId: row.templateId,
                            instanceId: row.instanceId ?? row.id,
                            kind: row.kind ?? 'misc',
                            name: row.name ?? TEMPLATE_BY_ID[row.templateId ?? '']?.name ?? 'Unknown',
                            quantity: row.quantity ?? 1,
                            condition: row.condition ?? 100,
                            gridPosition: row.gridPosition,
                            stats: row.stats,
                        }))
                    };
                })

                // POST /inventory/stash/move - Move item between inventory and stash
                // This is a simplified move for now: change 'slot' to 'stash' or null
                .post("/stash/move", async ({ user, body }) => {
                    if (!user) return { error: "Unauthorized", status: 401 };
                    const player = await resolvePlayer(user);
                    if (!player) return { error: "Player not found", status: 404 };

                    const { itemId, toStash, gridPosition } = body;

                    const item = await db.query.items.findFirst({
                        where: and(eq(items.id, itemId), eq(items.ownerId, player.id)),
                    });

                    if (!item) return { error: "Item not found", status: 404 };

                    await db.update(items)
                        .set({
                            slot: toStash ? 'stash' : null,
                            gridPosition: gridPosition ?? null,
                        })
                        .where(eq(items.id, itemId));

                    return { success: true };
                }, {
                    body: t.Object({
                        itemId: t.String(),
                        toStash: t.Boolean(),
                        gridPosition: t.Optional(t.Object({
                            x: t.Number(),
                            y: t.Number(),
                            rotation: t.Optional(t.Number()),
                        })),
                    }),
                })
        );
