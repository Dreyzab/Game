import { pgTable, serial, text, integer, jsonb, bigint, uuid, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { players } from './players';

// Items Table
export const items = pgTable('items', {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: integer('owner_id').references(() => players.id), // Nullable if in world/shop?

    templateId: text('template_id').notNull(), // "rusty_pipe"
    instanceId: text('instance_id').unique(), // Legacy ID support? Or generate new UUIDs?

    // Core Visuals (Snapshot from template)
    name: text('name'),
    description: text('description'),
    kind: text('kind'), // 'weapon', 'consumable'
    rarity: text('rarity'),

    // Dynamic Stats
    stats: jsonb('stats').$type<{
        damage?: number;
        defense?: number;
        weight: number;
        width: number;
        height: number;
        maxDurability?: number;
        specialEffects?: any[];
        containerConfig?: { width: number; height: number; name?: string };
    }>(),

    // Location Context
    containerId: uuid('container_id'), // Self-reference if nested inside another item (bag)?
    slot: text('slot'), // 'primary', 'backpack' (if directly on player)
    gridPosition: jsonb('grid_position').$type<{ x: number; y: number; rotation?: number }>(),

    quantity: integer('quantity').default(1),
    condition: integer('condition').default(100),

    createdAt: bigint('created_at', { mode: 'number' }),
}, (table) => ({
    ownerIdx: index('by_owner_id').on(table.ownerId),
}));

// Equipment Loadout (Snapshot of what is where)
// Note: In relational DB, we usually query items by slot.
// Items have `slot` field. If `slot` is set, it's equipped. 
// If `containerId` is set, it's in a bag.
// We rely on `items` table columns for equipment tracking.

export const itemsRelations = relations(items, ({ one }) => ({
    owner: one(players, {
        fields: [items.ownerId],
        references: [players.id],
    }),
}));

// Trades (legacy single-item offer)
export const trades = pgTable('trades', {
    id: serial('id').primaryKey(),
    senderId: integer('sender_id').references(() => players.id).notNull(),
    receiverId: integer('receiver_id').references(() => players.id).notNull(),

    itemId: uuid('item_id').references(() => items.id).notNull(),

    status: text('status').$type<'pending' | 'completed' | 'rejected'>().default('pending'),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    completedAt: bigint('completed_at', { mode: 'number' }),
});

// Trade sessions (multi-item, lockable)
export const tradeSessions = pgTable('trade_sessions', {
    id: serial('id').primaryKey(),
    initiatorId: integer('initiator_id').references(() => players.id).notNull(),
    partnerId: integer('partner_id').references(() => players.id),
    partnerNpcId: text('partner_npc_id'),
    currency: text('currency').default('кр.'),
    status: text('status').$type<'draft' | 'locked_initiator' | 'locked_partner' | 'locked' | 'committed' | 'cancelled' | 'expired'>().default('draft'),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
    expiresAt: bigint('expires_at', { mode: 'number' }),
});

export const tradeItems = pgTable('trade_items', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => tradeSessions.id).notNull(),
    ownerRole: text('owner_role').$type<'initiator' | 'partner'>().notNull(),
    itemId: uuid('item_id').references(() => items.id),
    templateId: text('template_id'),
    quantity: integer('quantity').default(1).notNull(),
    price: integer('price').default(0).notNull(),
    source: text('source').$type<'player_inventory' | 'npc_stock' | 'system'>().default('player_inventory'),
    locked: boolean('locked').default(false),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
