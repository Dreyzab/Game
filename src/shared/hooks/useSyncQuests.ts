import { useEffect } from 'react'
import { syncOutboxNow } from '@/shared/stores/questOutbox'

export function useSyncQuests(options: { intervalMs?: number } = {}) {
  const { intervalMs = 30000 } = options

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof window.setInterval> | null = null

    const sync = async () => {
      if (stopped) return
      try {
        await syncOutboxNow()
      } catch {
        // Ignore sync errors
      }
      if (stopped) return
    }

    const requestSync = () => {
      if (!stopped) void sync()
    }

    const onOnline = () => requestSync()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') requestSync()
    }

    requestSync()
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)

    if (intervalMs > 0) {
      timer = window.setInterval(() => {
        requestSync()
      }, intervalMs)
    }

    return () => {
      stopped = true
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
      if (timer) window.clearInterval(timer)
    }
  }, [intervalMs])
}

