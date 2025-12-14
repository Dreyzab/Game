/**
 * Client Item Templates
 * Re-exports from unified shared data source.
 * 
 * @deprecated Import directly from '@/shared/data/itemTemplates' for new code.
 * This file is kept for backwards compatibility.
 */

// Re-export everything from shared for backwards compatibility
export * from '@/shared/data/itemTemplates'
export * from '@/shared/data/itemTypes'

// Also re-export types used in existing code
import type { ItemKind, Rarity, ItemStats, ContainerConfig, SpecialEffect } from '@/shared/data/itemTypes'
export type { ItemKind, Rarity, ItemStats, ContainerConfig, SpecialEffect }
