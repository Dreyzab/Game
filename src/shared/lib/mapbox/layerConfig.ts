/**
 * Mapbox Layer Z-Order Configuration
 * 
 * Defines the rendering order for all map layers.
 * Higher values render on top of lower values.
 */

export const MAPBOX_LAYER_Z_ORDER = {
    // Base layers (bottom)
    HEX_INTERACTION: 90,
    HEX_FILL: 100,
    // Icons should render above fog so "unique locations" remain visible
    HEX_BIOME_ICONS: 420,
    HEX_BORDER: 200,

    // Highlights
    HEX_PATH: 300,
    HEX_SELECTED: 310,

    // Movement route (server-authoritative)
    PLAYER_ROUTE_GLOW: 575,
    PLAYER_ROUTE: 580,
    PLAYER_ROUTE_ACTIVE_GLOW: 585,
    PLAYER_ROUTE_ACTIVE: 590,

    // Fog of war
    FOG_EXPLORED: 400,
    FOG_UNEXPLORED: 410,

    // Bunker markers
    BUNKER_GLOW_OUTER: 500,
    BUNKER_GLOW_INNER: 510,
    BUNKER_MARKER: 520,

    // Player markers (top)
    PLAYER_GLOW: 600,
    PLAYER_MARKER: 610,
} as const

// Explicit union to keep TS/ESLint caches in sync when adding new ids.
export type MapboxLayerId =
    | keyof typeof MAPBOX_LAYER_Z_ORDER
    | 'PLAYER_ROUTE_GLOW'
    | 'PLAYER_ROUTE'
    | 'PLAYER_ROUTE_ACTIVE_GLOW'
    | 'PLAYER_ROUTE_ACTIVE'

/**
 * Get all layer IDs sorted by z-order (ascending)
 */
export const getSortedLayerIds = (): MapboxLayerId[] => {
    return (Object.keys(MAPBOX_LAYER_Z_ORDER) as MapboxLayerId[]).sort(
        (a, b) => MAPBOX_LAYER_Z_ORDER[a] - MAPBOX_LAYER_Z_ORDER[b]
    )
}
