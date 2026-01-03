import { db } from "../db";
import { sql } from "drizzle-orm";
import { SEED_MAP_POINTS } from "../seeds/mapPoints";
import { ITEM_TEMPLATES } from "../seeds/itemTemplates";
import { SEED_SAFE_ZONES } from "../seeds/safeZones";
import { SEED_DANGER_ZONES } from "../seeds/dangerZones";
import { seedScenarios } from "../db/seeds/scenarios";
import { mapPoints, items, safeZones, dangerZones } from "../db/schema";

async function resetDatabase() {
    console.log("ÐYõù Ñ?Ñø¥ÎÑ÷Ñ«Ñø¥Z Ñ¨ÑóÑ¯Ñ«¥Ÿ¥Z Ñó¥ÎÑ÷¥?¥'Ñ§¥Ÿ ÑñÑøÑú¥< ÑïÑøÑ«Ñ«¥<¥....");

    try {
        // ÑYÑóÑ¯¥Ÿ¥ÎÑøÑæÑ¬ ¥?Ñ¨Ñ÷¥?ÑóÑ§ Ñý¥?Ñæ¥. ¥'ÑøÑñÑ¯Ñ÷¥Å Ñý ¥?¥.ÑæÑ¬Ñæ public, Ñ§¥?ÑóÑ¬Ñæ Ñ¬Ñæ¥'Ñø-¥'ÑøÑñÑ¯Ñ÷¥Å Drizzle
        const tablesResponse = await db.execute(sql`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE '__drizzle_migrations%'
        `);

        if (tablesResponse && (tablesResponse as any).length > 0) {
            for (const table of (tablesResponse as any)) {
                const tableName = table.tablename;
                console.log(`ÐYõ¬ Ñz¥ÎÑ÷¥%Ñø¥Z ¥'ÑøÑñÑ¯Ñ÷¥Å¥Ÿ: ${tableName}`);
                await db.execute(sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`));
            }
        }

        console.log("ƒo. Ñ'ÑøÑúÑø ÑïÑøÑ«Ñ«¥<¥. ¥Ÿ¥?Ñ¨Ñæ¥^Ñ«Ñó Ñó¥ÎÑ÷¥%ÑæÑ«Ñø.");
    } catch (error) {
        console.error("ƒ?O Ñz¥^Ñ÷ÑñÑ§Ñø Ñ¨¥?Ñ÷ Ñó¥ÎÑ÷¥?¥'Ñ§Ñæ ÑñÑøÑú¥< ÑïÑøÑ«Ñ«¥<¥.:", error);
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
    console.log(`ÐYOñ Map points seeded: ${inserted}`);
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
    console.log(`ÐYOñ Safe zones seeded: ${inserted}`);
}

async function seedDangerZones() {
    let inserted = 0;
    for (const zone of SEED_DANGER_ZONES) {
        await db.insert(dangerZones).values({
            key: zone.key,
            title: zone.title,
            dangerLevel: zone.dangerLevel,
            polygon: zone.polygon,
            spawnPoints: zone.spawnPoints ?? [],
            isActive: true,
        });
        inserted += 1;
    }
    console.log(`ÐYOñ Danger zones seeded: ${inserted}`);
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
    console.log(`ÐYOñ Item templates seeded: ${inserted}`);
}

async function main() {
    await resetDatabase();
    console.log("ÐY\"­ Ñ?Ñø¥ÎÑ÷Ñ«Ñø¥Z ¥?Ñ÷ÑïÑ÷¥?ÑóÑýÑøÑ«Ñ÷Ñæ Ñ«ÑóÑý¥<¥. ÑïÑøÑ«Ñ«¥<¥....");
    await seedMapPoints();
    await seedSafeZones();
    await seedDangerZones();
    await seedItemTemplates();
    await seedScenarios();
    console.log("ƒoù ÑY¥?Ñó¥ÅÑæ¥?¥? ¥?Ññ¥?Ñó¥?Ñø Ñ÷ ¥?Ñ÷ÑïÑ÷¥?ÑóÑýÑøÑ«Ñ÷¥? ÑúÑøÑýÑæ¥?¥^ÑæÑ«!");
    process.exit(0);
}

main().catch((err) => {
    console.error("ÐY'¾ Ñs¥?Ñ÷¥'Ñ÷¥ÎÑæ¥?Ñ§Ñø¥? Ñó¥^Ñ÷ÑñÑ§Ñø Ñý Ñ¨¥?Ñó¥ÅÑæ¥?¥?Ñæ ¥?Ññ¥?Ñó¥?Ñø:", err);
    process.exit(1);
});
