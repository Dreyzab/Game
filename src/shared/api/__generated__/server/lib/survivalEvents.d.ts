/**
 * Survival Events Registry - The "Content Pack"
 * Static event definitions for all zones
 */
import type { SurvivalEvent, ZoneType } from '../shared/types/survival';
/** Events grouped by zone */
declare const EVENTS_BY_ZONE: Record<ZoneType, SurvivalEvent[]>;
/**
 * Get an event by its ID
 */
export declare function getEventById(eventId: string): SurvivalEvent | undefined;
/**
 * Get all events for a specific zone
 */
export declare function getEventsForZone(zone: ZoneType): SurvivalEvent[];
/**
 * Roll a random event for a zone (weighted)
 * @param zone - The zone to roll for
 * @param flags - Session flags for condition checking
 * @param visitCount - How many times this zone has been visited
 */
export declare function rollRandomEvent(zone: ZoneType, flags?: Record<string, unknown>, visitCount?: number): SurvivalEvent | null;
/**
 * Get all events with a specific tag
 */
export declare function getEventsByTag(tag: string): SurvivalEvent[];
/**
 * Get all registered events
 */
export declare function getAllEvents(): SurvivalEvent[];
export { EVENTS_BY_ZONE };
