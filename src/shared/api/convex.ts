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

