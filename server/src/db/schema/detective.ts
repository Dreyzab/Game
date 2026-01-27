import { pgTable, serial, varchar, text, jsonb, boolean, bigint, index } from 'drizzle-orm/pg-core';

/**
 * Detective Mode Hardlinks
 * 
 * Stores server-authoritative hardlink configurations for QR code scanning.
 * Each hardlink represents a scannable QR that triggers specific game actions.
 */
export const detectiveHardlinks = pgTable('detective_hardlinks', {
    id: serial('id').primaryKey(),
    packId: varchar('pack_id', { length: 64 }).notNull(), // 'fbg1905', 'karlsruhe1906'
    hardlinkId: varchar('hardlink_id', { length: 255 }).notNull(), // 'CASE01_BRIEFING_01'
    isRepeatable: boolean('is_repeatable').notNull().default(false), // Can be scanned multiple times
    actions: jsonb('actions').notNull(), // HardlinkAction[] - game actions to execute
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
}, (table) => ({
    packHardlinkIdx: index('idx_pack_hardlink').on(table.packId, table.hardlinkId),
}));

/**
 * Detective QR Scan History
 * 
 * Tracks when users scan hardlink QRs for anti-replay protection.
 * Prevents re-farming of one-time QR codes.
 */
export const detectiveScans = pgTable('detective_scans', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }), // Clerk authenticated user
    deviceId: varchar('device_id', { length: 255 }), // Guest device ID
    packId: varchar('pack_id', { length: 64 }).notNull(),
    hardlinkId: varchar('hardlink_id', { length: 255 }).notNull(),
    scannedAt: bigint('scanned_at', { mode: 'number' }).notNull(),
}, (table) => ({
    userPackHardlinkIdx: index('idx_user_pack_hardlink').on(table.userId, table.packId, table.hardlinkId),
    devicePackHardlinkIdx: index('idx_device_pack_hardlink').on(table.deviceId, table.packId, table.hardlinkId),
}));

export type DetectiveHardlink = typeof detectiveHardlinks.$inferSelect;
export type NewDetectiveHardlink = typeof detectiveHardlinks.$inferInsert;
export type DetectiveScan = typeof detectiveScans.$inferSelect;
export type NewDetectiveScan = typeof detectiveScans.$inferInsert;
