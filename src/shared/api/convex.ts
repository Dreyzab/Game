import { ConvexClient } from 'convex/browser'
import type { FunctionReference } from 'convex/server'

/**
 * Convex client instance
 * Get the deployment URL from environment variables
 */
const getConvexUrl = (): string | null => {
  // Try to get from environment variable
  // In production, this should be set via VITE_CONVEX_URL or similar
  const url = import.meta.env.VITE_CONVEX_URL
  
  if (!url || url.trim() === '') {
    return null
  }
  
  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn('VITE_CONVEX_URL must start with "http://" or "https://"')
    return null
  }
  
  return url
}

/**
 * Create and export Convex client instance
 * Only create if URL is provided, otherwise use placeholder functions
 */
const convexUrl = getConvexUrl()
export const convexClient = convexUrl ? new ConvexClient(convexUrl) : null

// Log warning if Convex is not configured
if (!convexUrl) {
  if (import.meta.env.DEV) {
    console.info('VITE_CONVEX_URL is not set. Using placeholder functions for Convex features.')
  }
}

/**
 * API types placeholder
 * These will be replaced with actual generated API once Convex backend is set up
 * For now, we'll define basic types compatible with Convex function references
 */
export type ConvexApi = {
  mapPoints: {
    listVisible: FunctionReference<'query', 'public', { 
      deviceId?: string
      userId?: string
      bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
      phase?: number
      limit?: number 
    }, any>
  }
  zones: {
    listActiveSafeZones: FunctionReference<'query', 'public', { 
      bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
    }, any>
    listSafeZones: FunctionReference<'query', 'public', { 
      bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
    }, any>
  }
  player: {
    ensureByDevice: FunctionReference<'mutation', 'public', { deviceId: string }, void>
    create: FunctionReference<'mutation', 'public', { deviceId: string }, string>
    get: FunctionReference<'query', 'public', { deviceId: string }, any>
    getProgress: FunctionReference<'query', 'public', { deviceId: string }, any>
  }
  quests: {
    getActive: FunctionReference<'query', 'public', { deviceId: string }, any[]>
  }
  admin: {
    register: FunctionReference<'mutation', 'public', { name: string }, void>
  }
}

/**
 * API object placeholder with function references
 * This will be replaced with actual generated API once Convex backend is configured
 * These are typed as FunctionReference but implemented as placeholders
 */
export const api = {
  mapPoints: {
    listVisible: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: ({ 
        deviceId: undefined, 
        userId: undefined,
        bbox: undefined, 
        phase: undefined,
        limit: undefined 
      } as {
        deviceId?: string
        userId?: string
        bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
        phase?: number
        limit?: number
      }),
      _returnType: {} as any
    } as ConvexApi['mapPoints']['listVisible'],
  },
  zones: {
    listActiveSafeZones: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: ({ bbox: undefined } as { 
        bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
      }),
      _returnType: [] as any[]
    } as ConvexApi['zones']['listActiveSafeZones'],
    listSafeZones: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: ({ bbox: undefined } as { 
        bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
      }),
      _returnType: [] as any[]
    } as ConvexApi['zones']['listSafeZones']
  },
  player: {
    ensureByDevice: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string },
      _returnType: undefined as unknown as void
    } as ConvexApi['player']['ensureByDevice'],
    create: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string },
      _returnType: '' as string
    } as ConvexApi['player']['create'],
    get: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string },
      _returnType: null as any
    } as ConvexApi['player']['get'],
    getProgress: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string },
      _returnType: null as any
    } as ConvexApi['player']['getProgress']
  },
  quests: {
    getActive: {
      _type: 'query' as const,
      _visibility: 'public' as const,
      _args: {} as { deviceId: string },
      _returnType: [] as any[]
    } as ConvexApi['quests']['getActive']
  },
  admin: {
    register: {
      _type: 'mutation' as const,
      _visibility: 'public' as const,
      _args: {} as { name: string },
      _returnType: undefined as unknown as void
    } as ConvexApi['admin']['register']
  }
}

/**
 * Wrapper functions for calling Convex functions
 * These will be replaced with actual Convex calls once backend is configured
 * Placeholder implementations that simulate API calls
 */
export const convexMutations = {
  player: {
    ensureByDevice: async (args: { deviceId: string }) => {
      console.log('ensureByDevice called with:', args)
      return Promise.resolve()
    },
    create: async (args: { deviceId: string }) => {
      console.log('create player called with:', args)
      return Promise.resolve('player-id')
    }
  },
  admin: {
    register: async (args: { name: string }) => {
      console.log('register admin called with:', args)
      return Promise.resolve()
    }
  }
}

export const convexQueries = {
  mapPoints: {
    listVisible: async (args: { 
      deviceId?: string
      userId?: string
      bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
      phase?: number
      limit?: number 
    }) => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('mapPoints:listVisible', args)
        } catch (e) {
          console.warn('Convex query mapPoints:listVisible failed; falling back to demo', e)
        }
      }
      console.log('mapPoints.listVisible called with:', args)
      // Demo data near Freiburg
      return {
        points: [
          {
            id: 'info_bureau',
            title: 'Информационное бюро',
            description: 'Стартовая цель после пролога. Здесь можно получить информацию о городе.',
            coordinates: { lng: 7.852, lat: 48.0 },
            type: 'poi',
            isActive: true,
            status: 'not_found',
            metadata: {
              faction: 'civilians',
              danger_level: 'low',
              category: 'information',
              isActiveQuestTarget: true // Пример цели активного квеста с пульсацией
            }
          },
          {
            id: 'safe_hub',
            title: 'Безопасная зона',
            description: 'Центральная безопасная зона Альянса',
            coordinates: { lng: 7.86, lat: 48.005 },
            type: 'location',
            isActive: true,
            status: 'not_found',
            metadata: {
              faction: 'alliance',
              danger_level: 'low'
            }
          },
          {
            id: 'market_square',
            title: 'Рыночная площадь',
            description: 'Торговая площадь с различными услугами',
            coordinates: { lng: 7.845, lat: 47.998 },
            type: 'settlement',
            isActive: true,
            status: 'not_found',
            metadata: {
              faction: 'civilians',
              danger_level: 'low',
              services: ['trade', 'repair']
            }
          },
          {
            id: 'anomaly_zone_1',
            title: 'Аномальная зона',
            description: 'Опасная аномальная зона. Требуется осторожность!',
            coordinates: { lng: 7.855, lat: 48.01 },
            type: 'anomaly',
            isActive: true,
            status: 'not_found',
            metadata: {
              danger_level: 'high'
            }
          }
        ],
        timestamp: Date.now(),
        ttlMs: 5 * 60 * 1000
      }
    }
  },
  zones: {
    listActiveSafeZones: async (args: { bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number } } = {}) => {
      if (convexClient) {
        try {
          // @ts-expect-error Allow calling by string without codegen
          return await convexClient.query('zones:listSafeZones', args)
        } catch (e) {
          console.warn('Convex query zones:listSafeZones failed; returning demo', e)
        }
      }
      console.log('zones.listSafeZones called with:', args)
      // Demo safe zones
      return [
        {
          id: 'central_safe_zone',
          name: 'Центральная безопасная зона',
          faction: 'alliance',
          isActive: true,
          polygon: [
            { lat: 47.995, lng: 7.845 },
            { lat: 47.995, lng: 7.865 },
            { lat: 48.005, lng: 7.865 },
            { lat: 48.005, lng: 7.845 },
            { lat: 47.995, lng: 7.845 }
          ]
        }
      ]
    },
    listSafeZones: async (args: { bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number } } = {}) => {
      return convexQueries.zones.listActiveSafeZones(args)
    }
  },
  player: {
    get: async (args: { deviceId: string }) => {
      console.log('get player called with:', args)
      return Promise.resolve(null)
    },
    getProgress: async (args: { deviceId: string }) => {
      console.log('get progress called with:', args)
      return Promise.resolve(null)
    }
  },
  quests: {
    getActive: async (args: { deviceId: string }) => {
      console.log('get active quests called with:', args)
      return Promise.resolve([])
    }
  }
}

