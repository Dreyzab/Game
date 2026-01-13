import { useCallback, useEffect, useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { CameraOff, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'
import type { PlayerRole, ZoneType } from '@/shared/types/survival'
import { DATAPAD_FALLBACK_THEME, DATAPAD_ROLE_THEMES } from '../../model/theme'
import { playSound } from '../../utils/sound'

interface ScanInterfaceProps {
  role: PlayerRole | null
  onClose: () => void
  onZoneDetected: (zoneId: ZoneType) => void
  isProcessing: boolean
  error: string | null
}

function isZoneType(value: string): value is ZoneType {
  return ['kitchen', 'bathroom', 'bedroom', 'corridor', 'living_room'].includes(value)
}

function parseZoneFromQr(raw: string): ZoneType | null {
  const input = raw.trim()
  if (!input) return null
  if (isZoneType(input)) return input

  try {
    const parsed = JSON.parse(input) as unknown
    if (typeof parsed === 'object' && parsed !== null) {
      const maybeZone = (parsed as any).zoneId ?? (parsed as any).zone
      if (typeof maybeZone === 'string' && isZoneType(maybeZone)) return maybeZone
    }
  } catch {
    // ignore JSON parse errors
  }

  try {
    const url = new URL(input)
    const zoneParam = url.searchParams.get('zone') ?? url.searchParams.get('zoneId')
    if (zoneParam && isZoneType(zoneParam)) return zoneParam
    const lastSeg = url.pathname.split('/').filter(Boolean).pop()
    if (lastSeg && isZoneType(lastSeg)) return lastSeg
  } catch {
    // not a URL
  }

  const tokens = input.split(/[:/]/).filter(Boolean)
  const last = tokens[tokens.length - 1]
  if (last && isZoneType(last)) return last

  return null
}

export function ScanInterface({ role, onClose, onZoneDetected, isProcessing, error }: ScanInterfaceProps) {
  const theme = role ? DATAPAD_ROLE_THEMES[role] : DATAPAD_FALLBACK_THEME
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [coords, setCoords] = useState({ lat: '00.0000', lon: '00.0000', alt: '000' })
  const [lastValue, setLastValue] = useState<string | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCoords({
        lat: (42 + Math.random()).toFixed(6),
        lon: (-71 - Math.random()).toFixed(6),
        alt: Math.floor(100 + Math.random() * 50).toString(),
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleScan = useCallback(
    (raw: string) => {
      if (!raw) return
      if (isProcessing) return
      if (lastValue === raw) return
      setLastValue(raw)

      const zone = parseZoneFromQr(raw)
      if (!zone) return

      playSound('scan_success')
      onZoneDetected(zone)
    },
    [isProcessing, lastValue, onZoneDetected]
  )

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <Scanner
            onScan={(detectedCodes) => detectedCodes[0] && handleScan(detectedCodes[0].rawValue)}
            onError={() => setHasCamera(false)}
            constraints={{ facingMode: 'environment' }}
          />
        </div>

        {hasCamera === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-gray-500 flex flex-col items-center">
              <CameraOff className="mb-2" />
              CAMERA OFFLINE
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 w-full h-1 bg-white/50 shadow-[0_0_20px_rgba(255,255,255,0.8)] z-20 survival-datapad-scanline" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className={cn('w-72 h-72 border opacity-60 relative transition-all duration-300', theme.borderColor)}>
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white" />

            <div className="absolute top-1/2 left-1/2 w-full h-px bg-white/20 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 h-full w-px bg-white/20 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
          </div>
        </div>

        <div className="absolute top-4 right-4 text-right pointer-events-none z-20">
          <div className="font-mono text-[10px] text-green-500 bg-black/40 px-2 py-1 backdrop-blur-sm border-l-2 border-green-500">
            <div className="flex justify-between w-32">
              <span>LAT:</span> <span>{coords.lat}</span>
            </div>
            <div className="flex justify-between w-32">
              <span>LON:</span> <span>{coords.lon}</span>
            </div>
            <div className="flex justify-between w-32">
              <span>ALT:</span> <span>{coords.alt}M</span>
            </div>
            <div className="flex justify-between w-32 mt-1 text-white">
              <span>SAT:</span> <span>CONNECTED</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-32 w-full text-center pointer-events-none z-20">
          <div className={cn('backdrop-blur border-y inline-flex items-center px-6 py-2 gap-3', theme.bgColor, theme.borderColor)}>
            <div className={cn('w-2 h-2 rounded-full animate-ping', theme.pingBgColor)} />
            <p className={cn('font-mono tracking-[0.2em] text-sm font-bold', theme.color)}>
              {isProcessing ? 'PROCESSING...' : 'SEARCHING SIGNAL...'}
            </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 animate-pulse">Point camera at a zone QR code</p>
          {error && <p className="text-[10px] text-red-400 mt-2">{error}</p>}
        </div>
      </div>

      <div className="bg-black p-6 border-t border-gray-800 z-30">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="w-full border border-gray-600 text-gray-400 py-4 uppercase tracking-widest hover:bg-gray-900 hover:text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <X size={20} />
          ABORT SCAN
        </button>
      </div>
    </div>
  )
}
