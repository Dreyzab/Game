const STORAGE_KEY_LAST_COOP_CODE = 'gw3_last_coop_code_v1'

export function getLastCoopRoomCode(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_LAST_COOP_CODE)
    if (!raw) return null
    const code = raw.trim().toUpperCase()
    return code.length > 0 ? code : null
  } catch {
    return null
  }
}

export function setLastCoopRoomCode(code: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY_LAST_COOP_CODE, code.trim().toUpperCase())
  } catch {
    // ignore
  }
}

export function clearLastCoopRoomCode() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY_LAST_COOP_CODE)
  } catch {
    // ignore
  }
}


