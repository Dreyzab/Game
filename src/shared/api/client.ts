import { treaty } from '@elysiajs/eden'
import type { App } from './app'
import { getDeviceId } from '@/shared/lib/utils/deviceId'

const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined

  if (import.meta.env.DEV) {
    console.log('[API] Runtime Environment: DEVELOPMENT')
    console.log('[API] VITE_API_URL from env:', envUrl)
  }

  // 1. Strict Production Mode: Must have VITE_API_URL
  if (import.meta.env.PROD) {
    if (!envUrl) {
      console.error('[API] VITE_API_URL is missing in PRODUCTION! Requests will fail.')
      return ''
    }

    // Ensure HTTPS for production URLs unless it's a local address (unlikely in prod build)
    const isLocal = envUrl.includes('localhost') || envUrl.includes('127.0.0.1')
    if (envUrl.startsWith('http://') && !isLocal) {
      const httpsUrl = envUrl.replace('http://', 'https://')
      console.log(`[API] Production URL forced to HTTPS: ${httpsUrl}`)
      return httpsUrl
    }

    console.log(`[API] Production API URL: ${envUrl}`)
    return envUrl
  }

  // 2. SSR fallback
  if (typeof window === 'undefined') return envUrl ?? 'http://localhost:3000'

  const hostname = window.location.hostname
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

  // 3. Development / LAN Mode
  if (!envUrl) {
    if (isLocalhost) return 'http://localhost:3000'
    console.error('[API] VITE_API_URL missing on remote host. API calls will likely fail.')
    return ''
  }

  return envUrl
}

// Direct connection to the backend (runtime-resolved for LAN device testing)
const BASE_URL = resolveBaseUrl()
export const API_BASE_URL = BASE_URL

const buildHeaders = (token?: string, deviceId?: string) => {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (deviceId) headers['x-device-id'] = deviceId
  return headers
}

export const client = treaty<App>(BASE_URL)
export type ApiClient = typeof client

// Helper to inject Auth token and optional device id (guest mode)
export const authenticatedClient = (token?: string, deviceId?: string): ApiClient =>
  treaty<App>(BASE_URL, {
    headers: buildHeaders(token, deviceId ?? getDeviceId()),
  })
