import { useCallback, useState } from 'react'
import type { SurvivalEvent, SurvivalPlayer, SurvivalState, ZoneType } from '@/shared/types/survival'
import { playSound } from '../utils/sound'
import { EncounterScreen } from './screens/EncounterScreen'
import { ScanInterface } from './screens/ScanInterface'
import { StandbyScreen } from './screens/StandbyScreen'

type Overlay = 'none' | 'scan' | 'database'

export interface ResolveResult {
  success: boolean
  message: string
}

export interface SurvivalDatapadProps {
  session: SurvivalState
  player: SurvivalPlayer
  activeEvent: SurvivalEvent | null
  isLoading: boolean
  error: string | null
  message: string | null
  onEnterZone: (zoneId: ZoneType) => Promise<void> | void
  onResolveOption: (optionId: string) => Promise<ResolveResult | null>
  onTransferToBase: (templateId: string, quantity: number) => void
  onStartSession?: () => void
  onCloseEvent?: () => void
}

export function SurvivalDatapad({
  session,
  player,
  activeEvent,
  isLoading,
  error,
  message,
  onEnterZone,
  onResolveOption,
  onTransferToBase,
  onStartSession,
  onCloseEvent,
}: SurvivalDatapadProps) {
  const [overlay, setOverlay] = useState<Overlay>('none')

  const closeOverlay = useCallback(() => setOverlay('none'), [])

  const handleZoneDetected = useCallback(
    async (zoneId: ZoneType) => {
      await onEnterZone(zoneId)
      setOverlay('none')
    },
    [onEnterZone]
  )

  return (
    <div className="survival-datapad h-screen w-screen bg-black text-white overflow-hidden relative font-display">
      <div className="survival-datapad-scanline-overlay absolute inset-0 pointer-events-none" />

      {message && (
        <div className="absolute top-3 left-3 right-3 z-[60] border border-emerald-500/40 bg-emerald-900/40 text-emerald-100 px-3 py-2 text-xs">
          {message}
        </div>
      )}

      {activeEvent ? (
        <EncounterScreen
          event={activeEvent}
          playerRole={player.role}
          playerInventory={player.inventory.items}
          isLoading={isLoading}
          onSelectOption={onResolveOption}
          onClose={() => {
            playSound('click')
            onCloseEvent?.()
          }}
        />
      ) : (
        <StandbyScreen
          session={session}
          player={player}
          onScanClick={() => setOverlay('scan')}
          onDatabaseClick={() => setOverlay('database')}
          onStartSession={onStartSession}
          onTransferToBase={onTransferToBase}
          isLoading={isLoading}
        />
      )}

      {overlay === 'scan' && (
        <ScanInterface
          role={player.role}
          onClose={closeOverlay}
          onZoneDetected={handleZoneDetected}
          isProcessing={isLoading}
          error={error}
        />
      )}

      {overlay === 'database' && (
        <div className="absolute inset-0 bg-black/95 z-50 p-6 flex flex-col animate-crt">
          <h2 className="text-2xl font-bold border-b border-gray-700 pb-4 mb-4 text-white">DATABASE</h2>
          <div className="flex-1 overflow-y-auto text-gray-300 space-y-4 custom-scrollbar">
            <div className="border border-gray-800 p-4">
              <h3 className="text-white font-bold mb-2">SESSION</h3>
              <p className="text-sm">ID: {session.sessionId}</p>
              <p className="text-sm">STATUS: {session.status.toUpperCase()}</p>
            </div>
            <div className="border border-gray-800 p-4">
              <h3 className="text-white font-bold mb-2">MISSION</h3>
              <p className="text-sm">Explore zones, collect loot, and keep the base alive.</p>
            </div>
          </div>
          <button
            className="mt-4 border border-gray-600 text-gray-300 py-4 uppercase tracking-widest hover:bg-gray-900 hover:text-white"
            onClick={() => {
              playSound('click')
              setOverlay('none')
            }}
          >
            CLOSE DATABASE
          </button>
        </div>
      )}
    </div>
  )
}
