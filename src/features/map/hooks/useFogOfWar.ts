import { useMemo, useRef, useEffect, useState } from 'react'
import * as turf from '@turf/turf'
import type { MapPoint } from '@/shared/types/map'
import type { Feature, Polygon, MultiPolygon } from 'geojson'

interface UseFogOfWarProps {
    discoveredPoints: MapPoint[]
    playerPosition: GeolocationPosition | null
    visible: boolean
}

export function useFogOfWar({ discoveredPoints, playerPosition, visible }: UseFogOfWarProps) {
    const [mask, setMask] = useState<Feature<Polygon | MultiPolygon> | null>(null)
    const lastPlayerPosRef = useRef<[number, number] | null>(null)

    // Memoize the "static" discovered area (union of all points)
    // This is the expensive part, so we only do it when points change
    const discoveredArea = useMemo(() => {
        if (!discoveredPoints.length) return null

        const holes = discoveredPoints.map(point =>
            turf.circle(
                [point.coordinates.lng, point.coordinates.lat],
                0.1, // 100m radius
                { steps: 32, units: 'kilometers' }
            )
        )

        try {
            // Union all holes into a single polygon/multipolygon
            if (holes.length === 1) return holes[0]
            // @ts-expect-error - turf types mismatch
            return holes.reduce((acc, hole) => turf.union(acc, hole) as Feature<Polygon | MultiPolygon>, holes[0])
        } catch (e) {
            console.error('Error calculating discovered area', e)
            return null
        }
    }, [discoveredPoints])

    // Combine static area with dynamic player position
    useEffect(() => {
        if (!visible) {
            setMask(null)
            return
        }

        const updateMask = () => {
            // World polygon
            const world = turf.polygon([[
                [-180, -90],
                [180, -90],
                [180, 90],
                [-180, 90],
                [-180, -90]
            ]])

            let currentHoles: Feature<Polygon | MultiPolygon> | null = discoveredArea

            // Add player visibility
            if (playerPosition) {
                const playerHole = turf.circle(
                    [playerPosition.coords.longitude, playerPosition.coords.latitude],
                    0.15, // 150m radius
                    { steps: 32, units: 'kilometers' }
                )

                if (currentHoles) {
                    // @ts-expect-error - turf types mismatch
                    currentHoles = turf.union(currentHoles, playerHole) as Feature<Polygon | MultiPolygon>
                } else {
                    currentHoles = playerHole
                }
            }

            // Subtract holes from world
            if (currentHoles) {
                try {
                    // @ts-expect-error - turf types are strict about Feature vs FeatureCollection
                    const newMask = turf.difference(world, currentHoles)
                    setMask(newMask as Feature<Polygon | MultiPolygon>)
                } catch (e) {
                    console.error('Error calculating final mask', e)
                }
            } else {
                // If no holes, the mask is the entire world
                setMask(world)
            }
        }

        // Throttle updates based on player movement to avoid excessive calcs
        // Simple distance check: only update if moved > 10 meters
        if (playerPosition) {
            const currentPos: [number, number] = [playerPosition.coords.longitude, playerPosition.coords.latitude]
            if (lastPlayerPosRef.current) {
                const dist = turf.distance(lastPlayerPosRef.current, currentPos, { units: 'kilometers' })
                if (dist < 0.01) return // Less than 10m movement, skip
            }
            lastPlayerPosRef.current = currentPos
        }

        updateMask()
    }, [discoveredArea, playerPosition, visible])

    return mask
}
