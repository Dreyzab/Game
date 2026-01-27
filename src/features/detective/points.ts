import type { MapPoint, MapPointMetadata, MapPointType } from '@/shared/types/map'
import type { DetectivePointType, DetectivePointState, DetectivePointMetadata } from './map/types'

type DetectivePointDef = {
  id: string
  title: string
  description: string
  coordinates: { lat: number; lng: number }
  type?: MapPointType // Mapbox generic type
  detectiveType: DetectivePointType // Gameplay type
  metadata?: MapPointMetadata
}

const POINT_CATALOG: Record<string, DetectivePointDef> = {
  bureau_office: {
    id: 'bureau_office',
    title: 'Detective Bureau',
    description: 'Your safe house and office. Review the case file here.',
    coordinates: { lat: 47.9972, lng: 7.8425 },
    type: 'location',
    detectiveType: 'bureau',
    // metadata: { faction: 'police' }, // Type mismatch with FactionType
  },
  hauptbahnhof: {
    id: 'hauptbahnhof',
    title: 'Hauptbahnhof',
    description: 'Central Station. Entry point to Freiburg (1905).',
    coordinates: { lat: 47.9978, lng: 7.8419 },
    type: 'location',
    detectiveType: 'support', // Station is a support hub initially
    metadata: { faction: 'unknown' },
  },
  munsterplatz_bank: {
    id: 'munsterplatz_bank',
    title: 'Bankhaus J.A. Krebs',
    description: 'Münsterplatz 4. Bank under reconstruction — scene of the heist.',
    coordinates: { lat: 47.9956, lng: 7.8522 },
    type: 'poi',
    detectiveType: 'crime',
    metadata: { faction: 'unknown' },
  },
  ganter_brauerei: {
    id: 'ganter_brauerei',
    title: 'Ganter Brauerei',
    description: 'Where workers talk. Rumors, leaflets, and blueprints change hands.',
    coordinates: { lat: 47.9950, lng: 7.8469 },
    type: 'location',
    detectiveType: 'support',
    metadata: { faction: 'unknown' },
  },
  rathaus_archiv: {
    id: 'rathaus_archiv',
    title: 'Rathaus / Archives',
    description: 'Old maps, permits, sewer plans. Bureaucracy with a long memory.',
    coordinates: { lat: 47.9958, lng: 7.8508 },
    type: 'location',
    detectiveType: 'support',
    metadata: { faction: 'unknown' },
  },
  basler_hof: {
    id: 'basler_hof',
    title: 'Basler Hof',
    description: 'Polizeidirektion. Paperwork, pressure, and sealed files.',
    coordinates: { lat: 47.9922, lng: 7.8479 },
    type: 'location',
    detectiveType: 'support',
    metadata: { faction: 'unknown' },
  },
  stuhlinger_warehouse: {
    id: 'stuhlinger_warehouse',
    title: 'Stühlinger Warehouse',
    description: 'A quiet depot behind the station. Good place to hide something loud and heavy.',
    coordinates: { lat: 47.9986, lng: 7.8379 },
    type: 'location',
    detectiveType: 'crime',
    metadata: { faction: 'unknown' },
  },
}

export function getDetectivePointById(id: string, state: DetectivePointState = 'discovered'): MapPoint | null {
  const def = POINT_CATALOG[id]
  if (!def) return null

  // Metadata merge
  const metadata: MapPointMetadata & DetectivePointMetadata = {
    ...def.metadata,
    detectiveType: def.detectiveType,
    detectiveState: state
  }

  return {
    id: def.id,
    title: def.title,
    description: def.description,
    coordinates: def.coordinates,
    type: def.type ?? 'poi',
    isActive: true,
    metadata,
    status: 'discovered', // MapPoint status (detective mode always shows as discovered when rendered)
  }
}

export function getDetectivePoints(states: Record<string, DetectivePointState>): MapPoint[] {
  // Always include Bureau if not in states, default to discovered
  const points: MapPoint[] = []

  // 1. Bureau (Always visible)
  const bureau = getDetectivePointById('bureau_office', 'discovered')
  if (bureau) points.push(bureau)

  // 2. State-driven points
  Object.entries(states).forEach(([id, state]) => {
    if (state === 'locked') return // Don't show unlocked points? Or show as locked? Plan says "Hidden" for locked.
    // If hidden, skip
    const point = getDetectivePointById(id, state)
    if (point) points.push(point)
  })

  return points
}
