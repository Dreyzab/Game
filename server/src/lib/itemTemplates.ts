/**
 * Server Item Templates
 * Re-exports unified item templates from shared directory.
 * Run `npm run copy-shared` to update from src/shared/data.
 */

import { ITEM_TEMPLATES, ITEM_TEMPLATES_ARRAY, ITEM_TEMPLATES_BY_ID } from '../shared/data/itemTemplates'
import type { ItemTemplate } from '../shared/data/itemTypes'

export { ITEM_TEMPLATES, ITEM_TEMPLATES_ARRAY, ITEM_TEMPLATES_BY_ID }
export type { ItemTemplate }

/** Get template by ID */
export function getItemTemplate(templateId: string): ItemTemplate | undefined {
  return ITEM_TEMPLATES[templateId]
}

/** Check if template exists */
export function hasItemTemplate(templateId: string): boolean {
  return templateId in ITEM_TEMPLATES
}

/** Get all templates of a specific kind */
export function getTemplatesByKind(kind: ItemTemplate['kind']): ItemTemplate[] {
  return ITEM_TEMPLATES_ARRAY.filter((tpl) => tpl.kind === kind)
}
