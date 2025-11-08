import { useMemo } from 'react'
import { getDeviceId } from '@/shared/lib/utils/deviceId'

export function useDeviceId() {
  const deviceId = useMemo(() => getDeviceId(), [])
  return { deviceId }
}

