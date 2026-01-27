import { db } from '../index';
import { detectiveHardlinks } from '../schema/detective';

/**
 * Seed Detective Hardlinks for Freiburg 1905
 * 
 * Migrates hardlinks from client-side MOCK_HARDLINKS to server database.
 * This enables server-authoritative QR scanning with anti-replay protection.
 */

const FREIBURG_HARDLINKS = [
    {
        packId: 'fbg1905',
        hardlinkId: 'CASE01_BRIEFING_01',
        isRepeatable: false,
        actions: [
            { type: 'start_vn', sceneId: 'case1_act0_briefing' },
            { type: 'unlock_point', pointId: 'hauptbahnhof' },
            { type: 'add_flags', flags: { 'det:case01:started': true } },
        ],
    },
    {
        packId: 'fbg1905',
        hardlinkId: 'CASE01_BANK_02',
        isRepeatable: false,
        actions: [
            { type: 'unlock_point', pointId: 'munsterplatz_bank' },
            { type: 'start_vn', sceneId: 'case1_act1_bank_arrival' },
        ],
    },
    {
        packId: 'fbg1905',
        hardlinkId: 'CASE01_PUB_03',
        isRepeatable: false,
        actions: [
            { type: 'unlock_point', pointId: 'ganter_brauerei' },
            { type: 'start_vn', sceneId: 'case1_act1_pub_clues' },
        ],
    },
    {
        packId: 'fbg1905',
        hardlinkId: 'CASE01_ARCHIVE_04',
        isRepeatable: false,
        actions: [
            { type: 'unlock_point', pointId: 'rathaus_archiv' },
            { type: 'start_vn', sceneId: 'case1_act1_archive_maps' },
        ],
    },
    {
        packId: 'fbg1905',
        hardlinkId: 'CASE01_WAREHOUSE_05',
        isRepeatable: false,
        actions: [
            { type: 'unlock_point', pointId: 'stuhlinger_warehouse' },
            { type: 'start_vn', sceneId: 'case1_act2_warehouse_showdown' },
        ],
    },
    {
        packId: 'fbg1905',
        hardlinkId: 'TEST_BATTLE_DEBUG',
        isRepeatable: true, // Debug/testing QR - repeatable
        actions: [
            { type: 'start_battle', scenarioId: 'tutorial-battle', deckType: 'detective_skirmish' },
        ],
    },
    {
        packId: 'fbg1905',
        hardlinkId: 'TEST_LINK_DEBUG',
        isRepeatable: true, // Testing QR
        actions: [
            { type: 'add_flags', flags: { 'test:hardlink:activated': true } },
        ],
    },
];

export async function seedDetectiveHardlinks() {
    const now = Date.now();

    console.log('Seeding detective hardlinks...');

    for (const link of FREIBURG_HARDLINKS) {
        try {
            await db.insert(detectiveHardlinks).values({
                ...link,
                createdAt: now,
                updatedAt: now,
            });
            console.log(`✓ Seeded: ${link.packId}:${link.hardlinkId}`);
        } catch (error: any) {
            if (error?.code === '23505') {
                // Unique constraint violation - already exists
                console.log(`⊘ Skipped (exists): ${link.packId}:${link.hardlinkId}`);
            } else {
                console.error(`✗ Failed: ${link.packId}:${link.hardlinkId}`, error);
            }
        }
    }

    console.log('Detective hardlinks seeding complete.');
}

// Run if executed directly
if (import.meta.main) {
    seedDetectiveHardlinks()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Seed failed:', err);
            process.exit(1);
        });
}
