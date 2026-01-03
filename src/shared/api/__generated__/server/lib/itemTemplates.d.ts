/**
 * Server Item Templates
 * Re-exports unified item templates from shared directory.
 * Run `npm run copy-shared` to update from src/shared/data.
 */
import { ITEM_TEMPLATES, ITEM_TEMPLATES_ARRAY, ITEM_TEMPLATES_BY_ID } from '../shared/data/itemTemplates';
import type { ItemTemplate } from '../shared/data/itemTypes';
export { ITEM_TEMPLATES, ITEM_TEMPLATES_ARRAY, ITEM_TEMPLATES_BY_ID };
export type { ItemTemplate };
/** Get template by ID */
export declare function getItemTemplate(templateId: string): ItemTemplate | undefined;
/** Check if template exists */
export declare function hasItemTemplate(templateId: string): boolean;
/** Get all templates of a specific kind */
export declare function getTemplatesByKind(kind: ItemTemplate['kind']): ItemTemplate[];
