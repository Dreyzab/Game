import { useEffect, useMemo, useRef, useState } from 'react'
import { Database, Scan, Trash2, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'
import type { SurvivalPlayer, SurvivalState } from '@/shared/types/survival'
import { DATAPAD_STATUS, type DatapadInventoryItem, type DatapadStatus } from '../../model/types'
import { DATAPAD_FALLBACK_THEME, DATAPAD_ROLE_THEMES } from '../../model/theme'
import { playSound } from '../../utils/sound'
import { Button } from '../components/Button'
import { InventoryItem } from '../components/InventoryItem'

interface StandbyScreenProps {
  session: SurvivalState
  player: SurvivalPlayer
  onScanClick: () => void
  onDatabaseClick: () => void
  onStartSession?: () => void
  onTransferToBase: (templateId: string, quantity: number) => void
  isLoading: boolean
}

function formatWorldTimeMinutes(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60)
  const hh = Math.floor(normalized / 60)
  const mm = normalized % 60
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
}

function formatPhaseLabel(phase: SurvivalState['phase']): string {
  if (phase === 'start') return 'MORNING'
  if (phase === 'day') return 'DAY'
  if (phase === 'monsters') return 'NIGHT / MONSTERS'
  return String(phase)
}

function formatEta(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

function getDatapadStatus(session: SurvivalState, player: SurvivalPlayer): DatapadStatus {
  if (player.isWounded) return DATAPAD_STATUS.WOUNDED
  if (session.resources.food <= 2) return DATAPAD_STATUS.HUNGRY
  return DATAPAD_STATUS.HEALTHY
}

function mapInventory(player: SurvivalPlayer): DatapadInventoryItem[] {
  return player.inventory.items.map((i) => {
    const template = ITEM_TEMPLATES[i.templateId]
    return {
      templateId: i.templateId,
      quantity: i.quantity,
      name: template?.name ?? i.templateId,
      description: template?.description ?? '',
      kind: template?.kind ?? 'misc',
      imageUrl: template?.imageUrl,
    }
  })
}

export function StandbyScreen({
  session,
  player,
  onScanClick,
  onDatabaseClick,
  onStartSession,
  onTransferToBase,
  isLoading,
}: StandbyScreenProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [movementEtaSeconds, setMovementEtaSeconds] = useState<number | null>(null)
  const timeSyncRef = useRef<{ worldTimeMs: number; perfMs: number; timeScale: number } | null>(null)

  const theme = player.role ? DATAPAD_ROLE_THEMES[player.role] : DATAPAD_FALLBACK_THEME
  const status = useMemo(() => getDatapadStatus(session, player), [session, player])
  const inventory = useMemo(() => mapInventory(player), [player])

  // Keep a sync point to estimate world time between websocket updates
  useEffect(() => {
    const timeScaleRaw = session.timeConfig?.timeScale
    const timeScale = (typeof timeScaleRaw === 'number' && Number.isFinite(timeScaleRaw)) ? timeScaleRaw : 120
    timeSyncRef.current = { worldTimeMs: session.worldTimeMs, perfMs: performance.now(), timeScale }
  }, [session.worldTimeMs, session.timeConfig?.timeScale])

  useEffect(() => {
    const movement = player.movementState
    if (!movement?.arriveAtWorldTimeMs) {
      setMovementEtaSeconds(null)
      return
    }

    const tick = () => {
      const sync = timeSyncRef.current
      if (!sync) return
      const worldNow = sync.worldTimeMs + Math.max(0, performance.now() - sync.perfMs) * sync.timeScale
      const remainingLoreMs = Math.max(0, movement.arriveAtWorldTimeMs - worldNow)
      const remainingRealSeconds = Math.ceil((remainingLoreMs / sync.timeScale) / 1000)
      setMovementEtaSeconds(Number.isFinite(remainingRealSeconds) ? remainingRealSeconds : null)
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [player.movementState])

  let headerBorderColor = theme.borderColor
  let statusBadgeColor = theme.color
  let statusBadgeBorder = 'border-gray-700'
  let statusClass = ''

  switch (status) {
    case DATAPAD_STATUS.WOUNDED:
      headerBorderColor = 'border-red-600'
      statusBadgeColor = 'text-red-500'
      statusBadgeBorder = 'border-red-500'
      statusClass = 'status-wounded'
      break
    case DATAPAD_STATUS.HUNGRY:
      headerBorderColor = 'border-amber-500'
      statusBadgeColor = 'text-amber-500'
      statusBadgeBorder = 'border-amber-500'
      statusClass = 'status-hungry'
      break
    case DATAPAD_STATUS.HEALTHY:
      headerBorderColor = 'border-emerald-500/50'
      statusClass = 'status-healthy'
      break
  }

  const activeItem = inventory.find((i) => i.templateId === selectedTemplateId) ?? null
  const canScan = session.status === 'active'
  const canStart = session.status === 'lobby' && Boolean(onStartSession)
  const movement = player.movementState
  const movementDestination = movement?.path?.length ? movement.path[movement.path.length - 1] : null

  const handleScanClick = () => {
    if (!canScan || isLoading) return
    playSound('scan_start')
    onScanClick()
  }

  return (
    <div className="h-full flex flex-col bg-black relative transition-all duration-500">
      <header
        className={cn(
          'p-4 border-b-2 bg-black/80 backdrop-blur-sm z-10 transition-all duration-500',
          headerBorderColor,
          statusClass
        )}
      >
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold text-white tracking-widest">{player.playerName}</h1>
            <p className={cn('text-xs opacity-80 uppercase', theme.color)}>CLASS: {theme.name}</p>
            <p className="text-[10px] text-gray-600 mt-1">SESSION: {session.sessionId}</p>
            <p className="text-[10px] text-gray-600">
              DAY {session.worldDay} • {formatWorldTimeMinutes(session.worldTimeMinutes)} • {formatPhaseLabel(session.phase)}
            </p>
            {movementDestination && (
              <div className="mt-2 border border-cyan-500/30 bg-cyan-950/20 rounded px-2 py-1">
                <div className="text-[10px] text-cyan-200/80 font-mono">
                  В пути → ({movementDestination.q}, {movementDestination.r}) • До прибытия:{' '}
                  {movementEtaSeconds === null ? '…' : formatEta(movementEtaSeconds)}
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase">VITALS MONITOR</p>
            <div className={cn('text-xl font-bold border px-2 py-0.5 inline-block', statusBadgeColor, statusBadgeBorder)}>
              {status}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto pb-32 custom-scrollbar">
        <div className="mb-6">
          <h3 className="text-xs text-gray-500 mb-2 tracking-[0.2em] flex items-center">
            <span className="w-2 h-2 bg-gray-600 mr-2" />
            POCKET INVENTORY
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {inventory.map((item) => (
              <InventoryItem
                key={item.templateId}
                item={item}
                colorClass={theme.color}
                borderColorClass={theme.borderColor}
                isSelected={selectedTemplateId === item.templateId}
                onClick={() => {
                  playSound('blip')
                  setSelectedTemplateId(item.templateId)
                }}
              />
            ))}

            {Array.from({ length: Math.max(0, 4 - inventory.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square border border-gray-900 bg-gray-950 flex items-center justify-center opacity-30"
              >
                <span className="text-gray-700 text-xs">EMPTY</span>
              </div>
            ))}
          </div>
        </div>

        {session.status !== 'active' && (
          <div className="mt-2 border border-amber-500/30 bg-amber-900/10 rounded-lg p-3 text-amber-200 text-xs">
            <div>Waiting for host to start the session…</div>
            <div className="mt-2 text-[10px] text-amber-200/70 font-mono">
              hostPlayerId={String(session.hostPlayerId)} • yourPlayerId={String(player.playerId)}
            </div>
            {canStart && (
              <button
                className="mt-3 w-full border border-amber-500/40 bg-amber-950/40 text-amber-100 py-3 uppercase tracking-widest hover:bg-amber-900/40 disabled:opacity-50"
                disabled={isLoading}
                onClick={() => {
                  playSound('click')
                  onStartSession?.()
                }}
              >
                START SESSION
              </button>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-linear-to-t from-black via-black to-transparent z-20 space-y-3">
        <button
          onClick={handleScanClick}
          disabled={!canScan || isLoading}
          className={cn(
            'w-full relative group overflow-hidden border-2 bg-gray-900/80 active:bg-gray-800 transition-all duration-100 h-24 flex items-center justify-between px-6',
            theme.borderColor,
            (!canScan || isLoading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="absolute inset-0 opacity-10 flex">
            <div className="w-1/2 h-full bg-white skew-x-12 -ml-4" />
          </div>

          <div className="flex flex-col items-start z-10">
            <span className={cn('text-xs font-bold', theme.color)}>OPTICAL SENSOR</span>
            <span className="text-2xl text-white font-bold tracking-[0.2em]">SCAN QR</span>
          </div>

          <Scan className={cn(theme.color, 'animate-pulse')} size={40} strokeWidth={1.5} />
        </button>

        <Button
          variant="secondary"
          onClick={onDatabaseClick}
          disabled={isLoading}
          colorClass="text-gray-300 border-gray-700 w-full"
        >
          <div className="flex items-center justify-center space-x-2">
            <Database size={14} />
            <span>ACCESS DATABASE</span>
          </div>
        </Button>
      </div>

      {activeItem && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-crt">
          <div className="w-full max-w-sm border border-gray-600 bg-gray-900 p-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedTemplateId(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-white"
            >
              <X size={24} />
            </button>

            <h2 className={cn('text-xl font-bold mb-4 uppercase', theme.color)}>{activeItem.name}</h2>
            <p className="text-gray-300 font-mono text-sm leading-relaxed mb-8 border-l-2 border-gray-700 pl-4">
              {activeItem.description || 'No description'}
            </p>

            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="danger"
                disabled={isLoading}
                onClick={() => {
                  playSound('blip')
                  onTransferToBase(activeItem.templateId, 1)
                  setSelectedTemplateId(null)
                }}
              >
                <div className="flex flex-col items-center py-2">
                  <Trash2 className="mb-1" size={18} />
                  <span>TRANSFER TO BASE</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
