/**
 * Unified Item Templates
 * =====================================================
 * Single source of truth for all item definitions.
 * Used by both client and server (server copies during build).
 * =====================================================
 */
import type { ItemTemplate } from './itemTypes';
export declare const ITEM_TEMPLATES: Record<string, ItemTemplate>;
/** Array format for iteration (backwards compatible with server seeds) */
export declare const ITEM_TEMPLATES_ARRAY: ItemTemplate[];
/** Lookup by ID */
export declare const ITEM_TEMPLATES_BY_ID: Record<string, ItemTemplate>;
