import { useCallback, useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { useNavigate } from 'react-router-dom'
import { useAppAuth } from '@/shared/auth'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/shared/lib/utils/cn'
import { authenticatedClient } from '@/shared/api/client'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { Routes } from '@/shared/lib/utils/navigation'
import { useInventoryStore } from '@/entities/inventory/model/store'

import { useHardlinkService } from '@/features/detective/lib/HardlinkService'

type QRAction = Record<string, unknown> & { type: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isQRAction(value: unknown): value is QRAction {
  return isRecord(value) && typeof value.type === 'string'
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'Неизвестная ошибка'
  }
}

export default function QRScannerPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { getToken, isLoaded } = useAppAuth()

  const { deviceId } = useDeviceId()
  const gameMode = useInventoryStore((state) => state.gameMode)
  const { parseAndExecute } = useHardlinkService()

  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastValue, setLastValue] = useState<string | null>(null)
  const [manualValue, setManualValue] = useState('')

  const applyActions = useCallback(
    async (actions: QRAction[] | undefined) => {
      if (!Array.isArray(actions) || actions.length === 0) return

      const noticeAction = actions.find((a) => a.type === 'notice')
      const noticeMessage = noticeAction?.message
      if (noticeMessage) setNotice(String(noticeMessage))

      const needsMapRefresh = actions.some((a) => a.type === 'unlock_point')
      const needsPlayerRefresh = actions.some((a) =>
        ['grant_xp', 'grant_gold', 'add_flags', 'remove_flags', 'grant_reputation'].includes(a.type)
      )
      const needsInventoryRefresh = actions.some((a) => a.type === 'grant_items')

      if (needsMapRefresh) await queryClient.invalidateQueries({ queryKey: ['mapPoints'] })
      if (needsPlayerRefresh) await queryClient.invalidateQueries({ queryKey: ['myPlayer'] })
      if (needsInventoryRefresh) await queryClient.invalidateQueries({ queryKey: ['myInventory'] })

      const startVn = actions.find((a) => a.type === 'start_vn')
      const startVnSceneId = startVn?.sceneId
      if (typeof startVnSceneId === 'string' && startVnSceneId.length > 0) {
        navigate(`${Routes.VISUAL_NOVEL}/${startVnSceneId}`)
        return
      }

      const startBattle = actions.find((a) => a.type === 'start_tutorial_battle')
      if (startBattle) {
        const qs = new URLSearchParams()
        if (typeof startBattle.returnScene === 'string' && startBattle.returnScene.length > 0) {
          qs.set('returnScene', startBattle.returnScene)
        }
        if (typeof startBattle.defeatScene === 'string' && startBattle.defeatScene.length > 0) {
          qs.set('defeatScene', startBattle.defeatScene)
        }
        const suffix = qs.toString() ? `?${qs.toString()}` : ''
        navigate(`${Routes.TUTORIAL_BATTLE}${suffix}`)
      }
    },
    [navigate, queryClient]
  )

  const handleScan = useCallback(
    async (result: string) => {
      if (!result) return
      if (isProcessing) return
      if (lastValue === result) return

      setIsProcessing(true)
      setError(null)
      setNotice(null)
      setLastValue(result)

      try {
        // DETECTIVE MODE INTERCEPTION
        const currentGameMode = useInventoryStore.getState().gameMode
        if (currentGameMode === 'detective') {
          // Use either simulated manual value or scanned result
          // Result is passed as argument to handleScan
          const execution = await parseAndExecute(result)

          if (execution.success) {
            setNotice(execution.message)
            return
          } else {
            if (result.startsWith('gw3:hardlink:')) {
              setError(execution.message)
            } else {
              setError('Evidence inadmissible. (Not a valid Hardlink)')
            }
            return
          }
        }

        // Onboarding gate: before city registration, any QR scan routes the player into onboarding flow.
        // We do this client-side for a silent UX, and keep server-side gating as a fallback.
        if (isLoaded) {
          try {
            const vnState = await queryClient.fetchQuery({
              queryKey: ['vn-state'],
              queryFn: async () => {
                const token = await getToken()
                const client = authenticatedClient(token ?? undefined, deviceId)
                const { data, error } = await client.vn.state.get()
                if (error) throw error
                return data
              },
              staleTime: 0,
            })

            const flags = (vnState as any)?.progress?.flags as Record<string, unknown> | undefined
            const isRegistered = Boolean(flags?.city_registered)
            const hasNickname = Boolean(flags?.nickname_set)

            if (!isRegistered) {
              if (!hasNickname) {
                navigate(`${Routes.VISUAL_NOVEL}/onboarding_police_intro`)
                return
              }
            }
          } catch {
            // Ignore onboarding fetch failures and let the server-side QR gate handle it.
          }
        }

        const token = await getToken()
        const client = authenticatedClient(token ?? undefined, deviceId)

        const { data, error } = await client.map['activate-qr'].post({
          qrData: result,
        })

        const payload: Record<string, unknown> = isRecord(data) ? data : {}
        const success = payload.success === true

        if (error || !success) {
          const message =
            typeof payload.error === 'string' && payload.error.trim().length > 0
              ? payload.error
              : 'Не удалось активировать QR'
          setError(message)
          return
        }

        const actionsRaw = payload.actions
        const actions: QRAction[] | undefined = Array.isArray(actionsRaw) ? actionsRaw.filter(isQRAction) : undefined
        await applyActions(actions)

        const gated = payload.gated === true && payload.kind === 'onboarding'
        if (gated) {
          const hasStartVn = Boolean(actions?.some((action) => action.type === 'start_vn'))
          if (!hasStartVn) {
            navigate(Routes.MAP)
          }
          return
        }

        // If no actions are returned, stay silent (especially for onboarding-gated scans).
      } catch (err) {
        console.error('[QRScannerPage] QR activation failed', err)
        setError('Ошибка активации QR. Проверьте соединение и попробуйте снова.')
      } finally {
        setIsProcessing(false)
      }
    },
    [applyActions, deviceId, getToken, isLoaded, isProcessing, lastValue, navigate, queryClient]
  )

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Scan QR</h1>

      <div className="w-full max-w-md aspect-square border-2 border-blue-500 rounded-lg overflow-hidden relative">
        <Scanner
          onScan={(detectedCodes) => detectedCodes[0] && handleScan(detectedCodes[0].rawValue)}
          onError={(err) => setError(getErrorMessage(err))}
        />
        <div className="absolute inset-0 border-2 border-transparent pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
        </div>
      </div>

      {notice && (
        <div className="mt-4 p-4 bg-emerald-900/40 border border-emerald-500 rounded text-emerald-100">
          {notice}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
          {error}
        </div>
      )}

      {gameMode === 'detective' && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleScan(manualValue.trim())
          }}
          className="mt-6 w-full max-w-md space-y-3"
        >
          <div className="text-xs text-zinc-400">
            Desktop симуляция (Detective Mode): вставь hardlink вручную.
          </div>
          <input
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="gw3:hardlink:fbg1905:CASE01_BRIEFING_01"
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-sm font-mono"
            disabled={isProcessing}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setManualValue('gw3:hardlink:fbg1905:CASE01_BRIEFING_01')}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono"
              disabled={isProcessing}
            >
              CASE01_BRIEFING_01
            </button>
            <button
              type="button"
              onClick={() => setManualValue('gw3:hardlink:fbg1905:CASE01_BANK_02')}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono"
              disabled={isProcessing}
            >
              CASE01_BANK_02
            </button>
            <button
              type="button"
              onClick={() => setManualValue('gw3:hardlink:fbg1905:CASE01_ARCHIVE_04')}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono"
              disabled={isProcessing}
            >
              CASE01_ARCHIVE_04
            </button>
            <button
              type="button"
              onClick={() => setManualValue('gw3:hardlink:fbg1905:TEST_BATTLE_01')}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono"
              disabled={isProcessing}
            >
              TEST_BATTLE_01
            </button>
            <button
              type="submit"
              className="ml-auto px-4 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-xs font-bold disabled:opacity-50"
              disabled={isProcessing}
            >
              Simulate
            </button>
          </div>
        </form>
      )}

      <button
        onClick={() => {
          setError(null)
          setNotice(null)
          setLastValue(null)
        }}
        className={cn('mt-4 px-6 py-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50')}
        disabled={isProcessing}
      >
        Scan again
      </button>

      <button
        onClick={() => navigate(-1)}
        className={cn('mt-8 px-6 py-2 bg-gray-700 rounded hover:bg-gray-600')}
      >
        Cancel
      </button>
    </div>
  )
}
