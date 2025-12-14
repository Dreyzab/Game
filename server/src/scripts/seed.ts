import { db } from "../db";
import { mapPoints, items, safeZones } from "../db/schema";
import { SEED_MAP_POINTS } from "../seeds/mapPoints";
import { ITEM_TEMPLATES } from "../seeds/itemTemplates";
import { SEED_SAFE_ZONES } from "../seeds/safeZones";
import { inArray } from "drizzle-orm";

async function seedMapPoints() {
    const now = Date.now();
    let inserted = 0;
    for (const p of SEED_MAP_POINTS) {
        const metadata = { ...(p.metadata ?? {}) };

        await db.insert(mapPoints)
            .values({
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
            })
            .onConflictDoUpdate({
                target: mapPoints.id,
                set: {
                    title: p.title,
                    description: p.description,
                    lat: p.coordinates.lat,
                    lng: p.coordinates.lng,
                    type: p.type,
                    qrCode: p.qrCode ?? (p.metadata as any)?.qrCode,
                    phase: p.phase ?? null,
                    isActive: p.isActive,
                    metadata,
                },
            });

        inserted += 1;
    }
    console.log(`[seed] map_points upserted: ${inserted} (ts=${now})`);
}

async function seedSafeZones() {
    const now = Date.now();

    // For deterministic seeding, fully replace existing safe_zones with seed data.
    await db.delete(safeZones);

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

    console.log(`[seed] safe_zones inserted: ${inserted} (ts=${now})`);
}

async function seedItemTemplates() {
    const templateIds = ITEM_TEMPLATES.map((t) => t.id);

    // Clean previous world items for these templates
    await db.delete(items)
        .where(inArray(items.templateId, templateIds));

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
    console.log(`[seed] item templates inserted: ${inserted}`);
}

async function main() {
    await seedMapPoints();
    await seedSafeZones();
    await seedItemTemplates();
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
