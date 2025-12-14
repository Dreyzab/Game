import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import * as turf from '@turf/turf'
import type { MapPoint, SafeZone, ConditionalZone } from '@/shared/types/map'
import type { Feature, Polygon, MultiPolygon } from 'geojson'

interface UseFogOfWarProps {
    mainFactionZones?: SafeZone[]
    conditionalZones?: ConditionalZone[]
    points?: MapPoint[]
    playerPosition: GeolocationPosition | null
    visible: boolean
    playerVisionRadiusMeters?: number
    defaultPointRevealRadiusMeters?: number
}

const DEFAULT_RADIUS_METERS = 15
const PLAYER_MOVE_THRESHOLD_KM = 0.01 // ~10m

export function useFogOfWar({
    mainFactionZones = [],
    conditionalZones = [],
    points = [],
    playerPosition,
    visible,
    playerVisionRadiusMeters = DEFAULT_RADIUS_METERS,
    defaultPointRevealRadiusMeters = DEFAULT_RADIUS_METERS
}: UseFogOfWarProps) {
    const [mask, setMask] = useState<Feature<Polygon | MultiPolygon> | null>(null)
    const lastPlayerPosRef = useRef<[number, number] | null>(null)
    const lastSignatureRef = useRef<string>('')
    const world = useMemo(
        () =>
            turf.polygon([[
                [-180, -90],
                [180, -90],
                [180, 90],
                [-180, 90],
                [-180, -90]
            ]]),
        []
    )

    const playerPoint = useMemo(() => {
        if (!playerPosition) return null
        return turf.point([playerPosition.coords.longitude, playerPosition.coords.latitude])
    }, [playerPosition])

    const makePolygon = useCallback((coordinates: { lat: number; lng: number }[]) => {
        if (!coordinates || coordinates.length < 3) return null
        const ring = coordinates.map((p) => [p.lng, p.lat])
        // Close the ring
        ring.push([coordinates[0].lng, coordinates[0].lat])
        return turf.polygon([ring])
    }, [])

    const unionFeatures = useCallback((features: Feature<Polygon | MultiPolygon>[]) => {
        if (!features.length) return null
        if (features.length === 1) return features[0]
        try {
            const result = turf.union(turf.featureCollection(features))
            return result as Feature<Polygon | MultiPolygon> | null
        } catch (error) {
            console.error('Error during union of features', error)
            return null
        }
    }, [])

    const buildStaticHoles = useCallback(() => {
        const features: Feature<Polygon | MultiPolygon>[] = []

        // Always-visible faction zones
        mainFactionZones.forEach((zone) => {
            const poly = makePolygon(zone.polygon)
            if (poly) {
                features.push(poly)
            }
        })

        // Conditional / story zones (only when discovered or revealed by proximity)
        conditionalZones.forEach((zone) => {
            const poly = makePolygon(zone.polygon)
            if (!poly) return

            const revealRadiusMeters = zone.revealRadiusMeters ?? 0

            const inside = playerPoint ? turf.booleanPointInPolygon(playerPoint, poly) : false
            const near =
                playerPoint && revealRadiusMeters > 0
                    ? turf.distance(playerPoint, turf.centroid(poly), { units: 'kilometers' }) <= revealRadiusMeters / 1000
                    : false

            const shouldReveal = zone.alwaysVisible || zone.isDiscovered || zone.autoRevealOnEntry || inside || near

            if (shouldReveal) {
                features.push(poly)
            }
        })

        // Points already discovered (static holes)
        points.forEach((point) => {
            const visibility = point.visibility
            const discoveredByStatus = point.status === 'discovered' || point.status === 'researched'
            const pointDiscovered = visibility?.isDiscovered ?? discoveredByStatus
            const radiusMeters =
                visibility?.revealOnProximityRadius ?? defaultPointRevealRadiusMeters ?? DEFAULT_RADIUS_METERS
            const nearPlayer =
                playerPoint && radiusMeters > 0
                    ? turf.distance(playerPoint, turf.point([point.coordinates.lng, point.coordinates.lat]), { units: 'kilometers' }) <= radiusMeters / 1000
                    : false
            const shouldReveal = pointDiscovered || nearPlayer || visibility?.autoReveal

            if (shouldReveal) {
                const circle = turf.circle(
                    [point.coordinates.lng, point.coordinates.lat],
                    radiusMeters / 1000,
                    { steps: 32, units: 'kilometers' }
                )
                features.push(circle)
            }
        })

        return unionFeatures(features)
    }, [
        conditionalZones,
        defaultPointRevealRadiusMeters,
        mainFactionZones,
        makePolygon,
        playerPoint,
        points,
        unionFeatures
    ])

    useEffect(() => {
        if (!visible) {
            setMask(null)
            return
        }

        const staticSignature = JSON.stringify({
            main: mainFactionZones.map((z) => z.id),
            conditional: conditionalZones.map((z) => `${z.id}:${z.isDiscovered}`),
            points: points.map((p) => `${p.id}:${p.visibility?.isDiscovered ?? p.status}`),
        })

        const playerMoved = (() => {
            if (!playerPosition) return false
            const currentPos: [number, number] = [playerPosition.coords.longitude, playerPosition.coords.latitude]
            if (lastPlayerPosRef.current) {
                const dist = turf.distance(lastPlayerPosRef.current, currentPos, { units: 'kilometers' })
                return dist >= PLAYER_MOVE_THRESHOLD_KM
            }
            return true
        })()

        const dataChanged = staticSignature !== lastSignatureRef.current

        if (!playerMoved && !dataChanged) {
            return
        }

        if (playerPosition) {
            lastPlayerPosRef.current = [playerPosition.coords.longitude, playerPosition.coords.latitude]
        }
        lastSignatureRef.current = staticSignature

        const updateMask = () => {
            const staticHoles = buildStaticHoles()

            // Player vision hole
            let combinedHoles: Feature<Polygon | MultiPolygon> | null = staticHoles
            if (playerPoint) {
                const playerHole = turf.circle(playerPoint.geometry.coordinates as [number, number], playerVisionRadiusMeters / 1000, {
                    steps: 32,
                    units: 'kilometers'
                })

                combinedHoles = combinedHoles
                    ? unionFeatures([combinedHoles, playerHole])
                    : playerHole
            }

            if (combinedHoles) {
                try {
                    const diffResult = turf.difference(turf.featureCollection([world, combinedHoles]))
                    setMask(diffResult as Feature<Polygon | MultiPolygon>)
                } catch (error) {
                    console.error('Error calculating final mask', error)
                }
            } else {
                setMask(world)
            }
        }

        updateMask()
    }, [
        playerPoint,
        playerPosition,
        visible,
        world,
        playerVisionRadiusMeters,
        defaultPointRevealRadiusMeters,
        mainFactionZones,
        conditionalZones,
        points,
        buildStaticHoles,
        unionFeatures
    ])

    return mask
}
