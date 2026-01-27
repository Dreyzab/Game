import { SimpleLRU } from './SimpleLRU'
import { DETECTIVE_CONFIG } from '../config'
import * as turf from '@turf/turf'

interface RouteResult {
    geometry: GeoJSON.LineString
    distance: number
    duration: number
    isFallback: boolean
}

const routeCache = new SimpleLRU<string, RouteResult>(DETECTIVE_CONFIG.CACHE_SIZE)

/**
 * Fetches a walking route between two points.
 * Uses Mapbox Directions API with fallback to Great Circle.
 */
export async function getWalkingRoute(
    start: [number, number],
    end: [number, number],
    accessToken: string
): Promise<RouteResult> {
    const cacheKey = `${start[0]},${start[1]}-${end[0]},${end[1]}`
    const cached = routeCache.get(cacheKey)
    if (cached) return cached

    const buildFallback = (): RouteResult => {
        const from = turf.point(start)
        const to = turf.point(end)
        const distance = turf.distance(from, to, { units: 'meters' }) // meters

        const geometry: GeoJSON.LineString = {
            type: 'LineString',
            coordinates: [start, end]
        }

        return {
            geometry,
            distance,
            duration: distance / DETECTIVE_CONFIG.FALLBACK_SPEED,
            isFallback: true
        }
    }

    // Some callers can't reliably read Mapbox token from Mapbox internals/window.
    // Use the Vite env token as a safe fallback source for routing.
    const envToken = (import.meta as any)?.env?.VITE_MAPBOX_TOKEN as string | undefined
    const token = accessToken || envToken || ''

    if (!token || token === 'dev-fallback-token') {
        return buildFallback()
    }

    try {
        const url = `https://api.mapbox.com/directions/v5/${DETECTIVE_CONFIG.DIRECTIONS_PROFILE}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${token}`

        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Directions API error: ${response.statusText}`)
            // logic for 429 too many requests is handled by catch
        }

        const data = await response.json()
        if (!data.routes || data.routes.length === 0) {
            throw new Error('No route found')
        }

        const route = data.routes[0]
        const result: RouteResult = {
            geometry: route.geometry,
            distance: route.distance,
            duration: route.duration,
            isFallback: false
        }

        routeCache.set(cacheKey, result)
        return result

    } catch (error) {
        console.warn('[DetectiveMovement] API failed or throttled, using fallback:', error)
        return buildFallback()
    }
}

/**
 * Calculates current position along a route based on elapsed time.
 */
export function interpolatePosition(
    route: GeoJSON.LineString,
    elapsedTime: number,
    totalDuration: number
): [number, number] {
    if (elapsedTime >= totalDuration) {
        return route.coordinates[route.coordinates.length - 1] as [number, number]
    }

    const progress = elapsedTime / totalDuration
    const line = turf.lineString(route.coordinates)
    const length = turf.length(line, { units: 'meters' })
    const targetDist = length * progress

    const point = turf.along(line, targetDist, { units: 'meters' })
    return point.geometry.coordinates as [number, number]
}
