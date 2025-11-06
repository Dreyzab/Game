/**
 * Navigation utilities
 */

/**
 * Determine the start destination based on player progress
 * @param skillPoints - Number of unallocated skill points
 * @returns Route path string
 */
export function getStartDestination(skillPoints?: number): string {
  if (skillPoints && skillPoints > 0) {
    return '/character'
  }
  return '/prologue'
}

/**
 * Navigation paths used throughout the app
 */
export const Routes = {
  HOME: '/',
  PROLOGUE: '/prologue',
  VISUAL_NOVEL: '/visual-novel',
  CHARACTER: '/character',
  MAP: '/map',
  ENHANCED_MAP: '/enhanced-map',
  QUESTS: '/quests',
  COMBAT: '/combat',
  INVENTORY: '/inventory',
  SETTINGS: '/settings',
  QR_SCANNER: '/qr-scanner',
  DEVTOOLS: '/dev-tools'
} as const

export type RoutePath = typeof Routes[keyof typeof Routes]

