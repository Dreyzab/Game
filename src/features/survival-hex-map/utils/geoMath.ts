import * as turf from '@turf/turf'
import type { HexCell, HexCoordinate } from '../types'
import { hexToPixel } from './hexMath'

// Default center: Freiburg, Germany
export const DEFAULT_MAP_CENTER: [number, number] = [7.856004, 47.993425] // [lng, lat]

// Hex size in meters (distance from center to edge, not vertex)
// For pointy-top hexes, the vertex radius is size / cos(30°) = size * 2/sqrt(3)
export const GEO_HEX_SIZE_METERS = 25

/**
 * Convert hex axial coordinates to geographic [lng, lat]
 */
export function hexToGeo(
    q: number,
    r: number,
    center: [number, number] = DEFAULT_MAP_CENTER,
    hexSizeMeters: number = GEO_HEX_SIZE_METERS
): [number, number] {
    // Get pixel offset using existing hex math (reuse logic)
    const { x: dx, y: dy } = hexToPixel(q, r, hexSizeMeters)

    // Convert meters to geographic offset
    // Use turf to calculate destination point from center
    // First move east by dx meters, then north by dy meters
    const pointAfterX = turf.destination(center, dx / 1000, 90, { units: 'kilometers' })
    const finalPoint = turf.destination(
        pointAfterX.geometry.coordinates as [number, number],
        dy / 1000,
        0, // bearing 0 = north
        { units: 'kilometers' }
    )

    return finalPoint.geometry.coordinates as [number, number]
}

/**
 * Convert geographic [lng, lat] to nearest hex axial coordinates
 */
export function geoToHex(
    lngLat: [number, number],
    center: [number, number] = DEFAULT_MAP_CENTER,
    hexSizeMeters: number = GEO_HEX_SIZE_METERS
): HexCoordinate {
    // Calculate distance from center in meters
    const distanceX = turf.distance(center, [lngLat[0], center[1]], { units: 'meters' })
    const distanceY = turf.distance(center, [center[0], lngLat[1]], { units: 'meters' })

    // Determine sign based on direction
    const dx = lngLat[0] > center[0] ? distanceX : -distanceX
    const dy = lngLat[1] > center[1] ? distanceY : -distanceY

    // Reverse the hexToPixel formula for pointy-topped hexes
    // x = size * (sqrt(3) * q + sqrt(3)/2 * r)
    // y = size * (3/2 * r)
    const sqrt3 = Math.sqrt(3)
    const r = dy / (hexSizeMeters * 1.5)
    const q = (dx / hexSizeMeters - (sqrt3 / 2) * r) / sqrt3

    // Round to nearest hex using cube coordinates
    return axialRound(q, r)
}

/**
 * Round fractional axial coordinates to nearest hex
 */
function axialRound(q: number, r: number): HexCoordinate {
    const s = -q - r

    let rq = Math.round(q)
    let rr = Math.round(r)
    const rs = Math.round(s)

    const qDiff = Math.abs(rq - q)
    const rDiff = Math.abs(rr - r)
    const sDiff = Math.abs(rs - s)

    if (qDiff > rDiff && qDiff > sDiff) {
        rq = -rr - rs
    } else if (rDiff > sDiff) {
        rr = -rq - rs
    }

    return { q: rq, r: rr }
}

/**
 * Generate GeoJSON polygon coordinates for a single hex
 * 
 * In hexToPixel, 'size' is the outer radius (center to vertex).
 * The horizontal spacing is size * sqrt(3), vertical is size * 1.5.
 * For proper tiling, we use the same 'size' as the vertex radius.
 */
export function hexPolygonCoordinates(
    q: number,
    r: number,
    center: [number, number] = DEFAULT_MAP_CENTER,
    hexSizeMeters: number = GEO_HEX_SIZE_METERS
): [number, number][] {
    const hexCenter = hexToGeo(q, r, center, hexSizeMeters)

    // For pointy-topped hexes in hexToPixel:
    // - Horizontal distance between adjacent centers = size * sqrt(3)
    // - Vertical distance between row centers = size * 1.5
    // 
    // For hexes to touch edge-to-edge:
    // - The flat-to-flat width = horizontal distance = size * sqrt(3)
    // - So the outer radius (center to vertex) = (size * sqrt(3)) / 2 * (2/sqrt(3)) = size
    // 
    // But wait, in pointy-top hex:
    // - width (flat-to-flat) = sqrt(3) * outer_radius
    // - height (point-to-point) = 2 * outer_radius
    // 
    // If horizontal spacing = size * sqrt(3), then: 
    // width = size * sqrt(3) => outer_radius = size
    const outerRadius = hexSizeMeters

    // Generate 6 vertices for pointy-topped hex
    // Turf uses bearing where 0° = North, 90° = East
    // For pointy-topped: first vertex points up (North = 0°), then every 60°
    const vertices: [number, number][] = []
    for (let i = 0; i < 6; i++) {
        const angleDeg = 60 * i // 0°, 60°, 120°, 180°, 240°, 300°
        const vertex = turf.destination(hexCenter, outerRadius / 1000, angleDeg, {
            units: 'kilometers',
        })
        vertices.push(vertex.geometry.coordinates as [number, number])
    }

    // Close the polygon
    vertices.push(vertices[0])

    return vertices
}

/**
 * Convert a single HexCell to a GeoJSON Feature
 */
export function hexCellToFeature(
    cell: HexCell,
    center: [number, number] = DEFAULT_MAP_CENTER,
    hexSizeMeters: number = GEO_HEX_SIZE_METERS
): GeoJSON.Feature<GeoJSON.Polygon> {
    const coordinates = hexPolygonCoordinates(cell.q, cell.r, center, hexSizeMeters)
    const hexId = `${cell.q},${cell.r}`

    return {
        type: 'Feature',
        id: hexId,
        properties: {
            hexId,
            q: cell.q,
            r: cell.r,
            biome: cell.biome,
            threatLevel: cell.threatLevel,
            elevation: cell.elevation,
            isObstacle: cell.isObstacle,
            resource: cell.resource,
        },
        geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
        },
    }
}

/**
 * Convert entire HexCell[] to GeoJSON FeatureCollection
 */
export function mapToGeoJSON(
    cells: HexCell[],
    center: [number, number] = DEFAULT_MAP_CENTER,
    hexSizeMeters: number = GEO_HEX_SIZE_METERS
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
    return {
        type: 'FeatureCollection',
        features: cells.map((cell) => hexCellToFeature(cell, center, hexSizeMeters)),
    }
}

/**
 * Get bounds for a hex map (for fitting the map view)
 */
export function getMapBounds(
    cells: HexCell[],
    center: [number, number] = DEFAULT_MAP_CENTER,
    hexSizeMeters: number = GEO_HEX_SIZE_METERS
): [[number, number], [number, number]] {
    let minLng = Infinity
    let maxLng = -Infinity
    let minLat = Infinity
    let maxLat = -Infinity

    for (const cell of cells) {
        const coords = hexPolygonCoordinates(cell.q, cell.r, center, hexSizeMeters)
        for (const [lng, lat] of coords) {
            minLng = Math.min(minLng, lng)
            maxLng = Math.max(maxLng, lng)
            minLat = Math.min(minLat, lat)
            maxLat = Math.max(maxLat, lat)
        }
    }

    return [
        [minLng, minLat],
        [maxLng, maxLat],
    ]
}
