/**
 * Utility functions for managing device ID
 * Used to identify users across sessions without authentication
 */

const DEVICE_ID_KEY = 'grezwanderer_device_id'

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  // Generate a simple UUID-like string
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Get or create device ID from localStorage
 * @returns Device ID string
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    // SSR fallback
    return generateDeviceId()
  }

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    
    if (!deviceId) {
      deviceId = generateDeviceId()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    
    return deviceId
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn('Failed to access localStorage, using session device ID', error)
    return generateDeviceId()
  }
}

/**
 * Clear device ID from localStorage
 */
export function clearDeviceId(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(DEVICE_ID_KEY)
  } catch (error) {
    console.warn('Failed to clear device ID from localStorage', error)
  }
}

