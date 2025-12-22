import { treaty } from '@elysiajs/eden'
import type { App } from './app'
import { getDeviceId } from '@/shared/lib/utils/deviceId'

const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined

  if (typeof window === 'undefined') return envUrl ?? 'http://localhost:3000'

  const hostname = window.location.hostname
  const isRemoteHost = hostname !== 'localhost' && hostname !== '127.0.0.1'

  if (!envUrl) {
    if (!isRemoteHost) return 'http://localhost:3000'
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    return `${protocol}//${hostname}:3000`
  }

  try {
    const parsed = new URL(envUrl)
    const isLocalEnvHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'

    if (isRemoteHost && isLocalEnvHost) {
      const port = parsed.port?.length ? parsed.port : '3000'
      return `${parsed.protocol}//${hostname}:${port}`
    }
  } catch {
    // ignore invalid URL formats
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
