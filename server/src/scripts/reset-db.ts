import { db } from "../db";
import { sql } from "drizzle-orm";
import { SEED_MAP_POINTS } from "../seeds/mapPoints";
import { ITEM_TEMPLATES } from "../seeds/itemTemplates";
import { SEED_SAFE_ZONES } from "../seeds/safeZones";
import { mapPoints, items, safeZones } from "../db/schema";

async function resetDatabase() {
    console.log("🧨 Начинаю полную очистку базы данных...");

    try {
        // Получаем список всех таблиц в схеме public, кроме мета-таблиц Drizzle
        const tablesResponse = await db.execute(sql`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE '__drizzle_migrations%'
        `);

        if (tablesResponse && tablesResponse.length > 0) {
            for (const table of tablesResponse) {
                const tableName = table.tablename;
                console.log(`🧼 Очищаю таблицу: ${tableName}`);
                await db.execute(sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`));
            }
        }

        console.log("✅ База данных успешно очищена.");
    } catch (error) {
        console.error("❌ Ошибка при очистке базы данных:", error);
        throw error;
    }
}

async function seedMapPoints() {
    let inserted = 0;
    for (const p of SEED_MAP_POINTS) {
        const metadata = { ...(p.metadata ?? {}) };
        await db.insert(mapPoints).values({
            id: p.id,
            title: p.title,
            description: p.description,
            lat: p.coordinates.lat,
            lng: p.coordinates.lng,
            type: p.type,
            qrCode: p.qrCode ?? (p.metadata as any)?.qrCode,
            phase: p.phase ?? null,
            isActive: p.isActive,
            metadata,
        });
        inserted += 1;
    }
    console.log(`🌱 Map points seeded: ${inserted}`);
}

async function seedSafeZones() {
    let inserted = 0;
    for (const zone of SEED_SAFE_ZONES) {
        await db.insert(safeZones).values({
            title: zone.name,
            faction: zone.faction,
            polygon: zone.polygon,
            isActive: zone.isActive,
        });
        inserted += 1;
    }
    console.log(`🌱 Safe zones seeded: ${inserted}`);
}

async function seedItemTemplates() {
    const now = Date.now();
    let inserted = 0;
    for (const tpl of ITEM_TEMPLATES) {
        await db.insert(items).values({
            templateId: tpl.id,
            instanceId: `tpl_${tpl.id}`,
            name: tpl.name,
            description: tpl.description,
            kind: tpl.kind,
            rarity: tpl.rarity,
            stats: {
                ...tpl.baseStats,
                width: tpl.baseStats.width,
                height: tpl.baseStats.height,
                weight: tpl.baseStats.weight,
            },
            quantity: 1,
            createdAt: now,
        });
        inserted += 1;
    }
    console.log(`🌱 Item templates seeded: ${inserted}`);
}

async function main() {
    await resetDatabase();
    console.log("📡 Начинаю сидирование новых данных...");
    await seedMapPoints();
    await seedSafeZones();
    await seedItemTemplates();
    console.log("✨ Процесс сброса и сидирования завершен!");
    process.exit(0);
}

main().catch((err) => {
    console.error("💥 Критическая ошибка в процессе сброса:", err);
    process.exit(1);
});
