import { Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'
import { HeroSection } from '@/widgets/hero/HeroSection.tsx'
import { AuthActions } from '@/features/auth'
import { Layout } from '@/widgets/layout'
import { PlayerStatusWidget } from '@/widgets/player-status'
import { QuickActionsWidget } from '@/widgets/quick-actions'
import { ActiveQuestsWidget } from '@/widgets/active-quests'
import { SystemStatusWidget } from '@/widgets/system-status'
import { Button } from '@/shared/ui/components/Button'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { usePlayerProgress, useCreatePlayer } from '@/shared/hooks/usePlayer'
import { authenticatedClient } from '@/shared/api/client'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { getStartDestination, Routes } from '@/shared/lib/utils/navigation'
import { useAppAuth } from '@/shared/auth'

export function ModernHomePage() {
  const navigate = useNavigate()
  const { getToken, isLoaded } = useAppAuth()
  const { deviceId } = useDeviceId()
  const { progress } = usePlayerProgress()
  const { createPlayer, isCreating } = useCreatePlayer()
  const [createMsg, setCreateMsg] = useState<string | null>(null)
  const [qrSimNotice, setQrSimNotice] = useState<string | null>(null)
  const [qrSimError, setQrSimError] = useState<string | null>(null)
  const [isSimulatingQr, setSimulatingQr] = useState(false)

  const isSignedIn = progress !== null
  const hasUnallocatedSkills = progress?.skillPoints ? progress.skillPoints > 0 : false

  const handleStartGame = async () => {
    // Просто отправляем на стартовый роут согласно прогрессу
    const dest = getStartDestination(progress?.skillPoints)
    navigate(dest)
  }

  const handleCreatePlayer = async () => {
    try {
      setCreateMsg(null)
      await createPlayer()
      setCreateMsg('Игрок успешно создан!')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось создать игрока'
      setCreateMsg(`Ошибка: ${errorMessage}`)
      console.error('Error creating player:', err)
    }
  }

  const handleRegisterAdmin = async () => {
    setCreateMsg('Регистрация админа доступна через серверную консоль.')
  }

  const handleSimulateRathausQr = async () => {
    if (!isLoaded) {
      setQrSimError('Auth ещё загружается. Попробуйте через пару секунд.')
      return
    }

    if (isSimulatingQr) return

    setSimulatingQr(true)
    setQrSimNotice(null)
    setQrSimError(null)

    try {
      const token = await getToken()
      const client = authenticatedClient(token ?? undefined, deviceId)
      const { data, error } = await client.map['activate-qr'].post({
        qrData: 'gw3:point:rathaus_square',
      })
      if (error) throw error

      const payload = (data ?? {}) as any
      if (payload.success !== true) {
        const message =
          typeof payload.error === 'string' && payload.error.trim().length > 0
            ? payload.error
            : 'Не удалось активировать QR'
        setQrSimError(message)
        return
      }

      const actionsRaw = payload.actions
      const actions: any[] = Array.isArray(actionsRaw) ? actionsRaw : []
      const startVn = actions.find((action) => action?.type === 'start_vn' && typeof action.sceneId === 'string')

      if (startVn?.sceneId) {
        navigate(`${Routes.VISUAL_NOVEL}/${startVn.sceneId}`)
        return
      }

      const isOnboardingGate = payload.gated === true && payload.kind === 'onboarding'
      if (isOnboardingGate) {
        navigate(Routes.MAP)
        return
      }

      setQrSimNotice('QR активирован.')
    } catch (err) {
      console.error('[HomePage] Failed to simulate Rathaus QR', err)
      setQrSimError('Не удалось симулировать сканирование QR. Проверьте соединение с сервером.')
    } finally {
      setSimulatingQr(false)
    }
  }

  return (
    <Layout>
      <HeroSection
        title="QR-Boost"
        badge="Интерактивный дайджест QR-Boost"
      />

      <Suspense fallback={<LoadingSpinner text="Загрузка" />}>
        <div className="panel-grid mb-6">
          <div className="panel-span-12">
            <div className="glass-panel p-5 border border-white/5">
              <div className="flex flex-col gap-1">
                <Heading level={3} className="text-white">
                  Совместная игра
                </Heading>
                <Text size="sm" variant="muted">
                  Создай команду и покажи QR-код друзьям — или присоединись по коду.
                </Text>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="primary" size="lg" onClick={() => navigate(`${Routes.COOP}?mode=create`)}>
                  Совместная игра
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate(`${Routes.COOP}?mode=join`)}>
                  Присоединиться
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-grid mb-10">
          <div className="panel-span-7">
            <PlayerStatusWidget />
          </div>
          <div className="panel-span-5">
            <QuickActionsWidget />
          </div>
        </div>

        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          <button
            onClick={handleSimulateRathausQr}
            disabled={!isLoaded || isSimulatingQr}
            className="group relative px-8 py-4 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-full transition-all shadow-lg hover:shadow-emerald-500/40 uppercase tracking-widest overflow-hidden"
            title="Симулирует сканирование QR Ратушной площади и запускает онбординг"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full" />
              Simulate Rathaus QR
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </button>
        </div>

        {(qrSimNotice || qrSimError) && (
          <div className="flex justify-center mb-8">
            <div
              className={[
                'max-w-xl w-full rounded-xl border px-4 py-3 text-sm',
                qrSimError
                  ? 'bg-red-950/40 border-red-500/30 text-red-200'
                  : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-100',
              ].join(' ')}
            >
              {qrSimError ?? qrSimNotice}
            </div>
          </div>
        )}

        <div className="panel-grid">
          <div className="panel-span-7">
            <ActiveQuestsWidget />
          </div>
          <div className="panel-span-5">
            <SystemStatusWidget />
          </div>
        </div>
      </Suspense>

      {!isSignedIn && (
        <AuthActions
          onStartGame={handleStartGame}
          onCreatePlayer={handleCreatePlayer}
          onRegisterAdmin={handleRegisterAdmin}
          createMsg={createMsg}
          isCreating={isCreating}
          hasUnallocatedSkills={hasUnallocatedSkills}
        />
      )}
    </Layout>
  )
}

export default ModernHomePage
