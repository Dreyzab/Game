/**
 * Detective Mode Constants
 * Centralized configuration for Freiburg 1905 detective pack
 */

// Pack Configuration
export const DETECTIVE_PACK_ID = 'fbg1905' as const
export const DETECTIVE_PACK_NAME = 'Freiburg 1905: Münsterplatz Heist' as const

// Hardlink IDs (Case #1)
export const HARDLINK_IDS = {
    // Case #1: Münsterplatz Heist
    CASE01_BRIEFING: 'CASE01_BRIEFING_01',
    CASE01_BANK: 'CASE01_BANK_02',
    CASE01_PUB: 'CASE01_PUB_03',
    CASE01_ARCHIVE: 'CASE01_ARCHIVE_04',
    CASE01_WAREHOUSE: 'CASE01_WAREHOUSE_05',

    // Test/Debug
    TEST_BATTLE: 'TEST_BATTLE_01',
    TEST_LINK: 'TEST_LINK',
} as const

// Point IDs
export const POINT_IDS = {
    BUREAU: 'bureau_office',
    STATION: 'hauptbahnhof',
    BANK: 'munsterplatz_bank',
    PUB: 'ganter_brauerei',
    ARCHIVE: 'rathaus_archiv',
    POLICE: 'basler_hof',
    WAREHOUSE: 'stuhlinger_warehouse',
} as const

// VN Scene IDs
export const SCENE_IDS = {
    // Act 0
    BRIEFING: 'case1_act0_briefing',

    // Act 1
    BANK_ARRIVAL: 'case1_act1_bank_arrival',
    LIME_FOOTPRINTS: 'case1_act1_lime_footprints',
    GUARDPOST: 'case1_act1_guardpost',
    DIRECTOR_OFFICE: 'case1_act1_director_office',
    FOREMAN_WAGON: 'case1_act1_foreman_wagon',

    // Act 2
    PUB_INTEL: 'case1_act2_pub_intel',
    ARCHIVES: 'case1_act2_archives',

    // Act 3
    WAREHOUSE_STING: 'case1_act3_warehouse_sting',
    ENDING_ARREST: 'case1_act3_ending_arrest',
    ENDING_COVERUP: 'case1_act3_ending_coverup',
} as const

// UI Action Labels (will be i18n later)
export const UI_LABELS = {
    INVESTIGATE: 'INVESTIGATE',
    INTERROGATE: 'INTERROGATE',
    REVIEW_NOTES: 'REVIEW NOTES',
    OPEN_DOSSIER: 'OPEN DOSSIER',
    DETAILS: 'DETAILS',
} as const

// Evidence IDs
export const EVIDENCE_IDS = {
    LIME_TRACE: 'lime_trace',
    BOTTLE_SHARD: 'bottle_shard',
    BLUEPRINT_MENTION: 'blueprint_mention',
    SEWER_MAP: 'sewer_map',
} as const
