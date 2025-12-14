import { treaty } from '@elysiajs/eden'
import type { App } from './app'
import { getDeviceId } from '@/shared/lib/utils/deviceId'

// Direct connection to the backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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
