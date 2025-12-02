// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MapView } from './MapView'
import mapboxgl from 'mapbox-gl'

// Mock mapbox-gl
vi.mock('mapbox-gl', () => {
    return {
        default: {
            Map: vi.fn(() => ({
                on: vi.fn(),
                remove: vi.fn(),
                getBounds: vi.fn(() => ({
                    getSouth: () => 0,
                    getWest: () => 0,
                    getNorth: () => 10,
                    getEast: () => 10,
                    toArray: () => [[0, 0], [10, 10]]
                })),
                flyTo: vi.fn(),
                getZoom: vi.fn(() => 10),
                addControl: vi.fn(),
            })),
            Marker: vi.fn(() => ({
                setLngLat: vi.fn().mockReturnThis(),
                addTo: vi.fn().mockReturnThis(),
                remove: vi.fn(),
                getElement: vi.fn(() => document.createElement('div')),
            })),
            Popup: vi.fn(() => ({
                setLngLat: vi.fn().mockReturnThis(),
                setDOMContent: vi.fn().mockReturnThis(),
                addTo: vi.fn().mockReturnThis(),
                remove: vi.fn(),
                on: vi.fn(),
            })),
            LngLatBounds: vi.fn(),
        }
    }
})

// Mock hooks
vi.mock('@/shared/hooks/useMapData', () => ({
    useVisibleMapPoints: vi.fn(() => ({ points: [], isLoading: false })),
    useSafeZones: vi.fn(() => ({ zones: [], isLoading: false })),
    useGeolocation: vi.fn(() => ({ position: null, isLoading: false, getCurrentPosition: vi.fn() })),
    useCenterOnUser: vi.fn(() => ({ center: null, handleLocateUser: vi.fn() })),
    convertBBoxToConvex: vi.fn(),
}))

vi.mock('@/shared/hooks/useDeviceId', () => ({
    useDeviceId: vi.fn(() => ({ deviceId: 'test-device-id' })),
}))

vi.mock('@/shared/api/convex', () => ({
    convexClient: {
        mutation: vi.fn(),
    },
}))

describe('MapView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders without crashing', () => {
        render(<MapView />)
        // Check for controls
        expect(screen.getByText('📍 Моё местоположение')).toBeInTheDocument()
        expect(screen.getByText('Точек: 0')).toBeInTheDocument()
    })

    it('initializes mapbox map', () => {
        render(<MapView />)
        expect(mapboxgl.Map).toHaveBeenCalled()
    })
})
