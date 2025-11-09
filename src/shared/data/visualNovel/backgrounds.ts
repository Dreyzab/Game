export const BACKGROUNDS = {
  train: '/public/images/backgrounds/train.png',
  station: '/public/images/backgrounds/station.png',
  station_check: '/public/images/backgrounds/station_check.png',
  freiburg_market: '/public/images/backgrounds/freiburg_market.jpg',
} as const

export type BackgroundKey = keyof typeof BACKGROUNDS

/**
 * Resolve background by key or pass-through a raw path for gradual migration.
 */
export function getBackground(input: string): string {
  return (BACKGROUNDS as Record<string, string>)[input] ?? input
}

