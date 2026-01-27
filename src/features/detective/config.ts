/**
 * Configuration for Detective Mode mechanics.
 */

export const DETECTIVE_CONFIG = {
    // Movement & Physics
    MOVEMENT_SPEED: 1.4, // m/s (average walking speed)
    FALLBACK_SPEED: 0.7, // m/s (slower when 'lost' or off-road)
    ANIMATION_EASING: 'linear', // Consistent walking pace

    // Spawn
    SPAWN_LNG_LAT: [7.841861300648759, 47.997068370316526] as [number, number],

    // Directions API
    CACHE_SIZE: 50, // Max routes to keep in memory
    DEBOUNCE_MS: 300, // Prevent API spam on rapid clicks

    // Mapbox Params
    DIRECTIONS_PROFILE: 'mapbox/walking',

    // UI/Timing
    TOAST_DURATION: 3000,

    // Dossier
    MAX_RECENT_ENTRIES: 50
} as const
