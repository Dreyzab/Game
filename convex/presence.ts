import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 5 минут оффлайна - и игрок исчезает с радаров
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Обновляет позицию игрока (Heartbeat)
 * Вызывается клиентом раз в N секунд или при значительном перемещении
 */
export const heartbeat = mutation({
    args: {
        lat: v.number(),
        lng: v.number(),
        deviceId: v.string(), // Используем deviceId как основной идентификатор для MVP
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Попробуем найти игрока по deviceId
        const player = await ctx.db
            .query("players")
            .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
            .first();

        const now = Date.now();

        if (player) {
            // Обновляем существующего
            await ctx.db.patch(player._id, {
                location: { lat: args.lat, lng: args.lng },
                lastSeen: now,
                status: args.status ?? player.status ?? "idle",
                updatedAt: now,
            });
        } else {
            // Если игрока нет, создаем нового (хотя обычно он должен создаваться при входе)
            // В данном случае, просто логируем или создаем "гостя"
            // Для надежности лучше не создавать тут, а ожидать что игрок уже есть.
            // Но для MVP "самовосстановления" можно и создать.
            console.warn(`Player with deviceId ${args.deviceId} not found in heartbeat.`);
        }
    },
});

/**
 * Радар: возвращает ближайших активных игроков
 */
export const getNearbyPlayers = query({
    args: {
        myLat: v.number(),
        myLng: v.number(),
        radiusKm: v.number(),
        deviceId: v.optional(v.string()), // Чтобы исключить себя из списка
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const onlineThreshold = now - ONLINE_THRESHOLD_MS;

        // 1. Получаем всех, кто был онлайн недавно
        // В идеале нужен гео-индекс, но Convex пока не поддерживает geo-queries нативно эффективно для круга.
        // Используем фильтр по lastSeen, чтобы отсечь оффлайн, это эффективно.
        const activePlayers = await ctx.db
            .query("players")
            .withIndex("by_lastSeen", (q) => q.gte("lastSeen", onlineThreshold))
            .collect();

        // 2. Фильтруем по расстоянию и исключаем себя
        const nearby = activePlayers.filter((p) => {
            if (args.deviceId && p.deviceId === args.deviceId) return false;
            if (!p.location) return false;

            const dist = calculateDistance(
                args.myLat,
                args.myLng,
                p.location.lat,
                p.location.lng
            );
            return dist <= args.radiusKm;
        });

        return nearby.map((p) => ({
            _id: p._id,
            name: p.name,
            location: p.location,
            status: p.status,
            factionId: p.factionId,
        }));
    },
});

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
