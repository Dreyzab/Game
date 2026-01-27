import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
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
import { Routes } from '@/shared/lib/utils/navigation'
import { useAppAuth } from '@/shared/auth'
import { clearLastCoopRoomCode, getLastCoopRoomCode } from '@/features/coop'
import { useInventoryStore } from '@/entities/inventory/model/store'
import { useDossierStore, SCENE_IDS } from '@/features/detective'
import { DETECTIVE_MAP_STYLE } from '@/shared/config/mapStyles'
import { useTranslation } from 'react-i18next'

// Lazy load onboarding
const OnboardingModal = React.lazy(() => import('@/features/detective').then(m => ({ default: m.OnboardingModal })))
const MapPreloader = React.lazy(() => import('@/shared/ui/MapPreloader'))

const AVAILABLE_LANGUAGES = ['ru', 'en', 'de'] as const

export function ModernHomePage() {
  const navigate = useNavigate()
  const { getToken, isLoaded } = useAppAuth()
  const { t, i18n } = useTranslation(['home', 'common'])
  const { deviceId } = useDeviceId()
  const { progress } = usePlayerProgress()
  const { createPlayer, isCreating } = useCreatePlayer()
  const [createMsg, setCreateMsg] = useState<string | null>(null)
  const [qrSimNotice, setQrSimNotice] = useState<string | null>(null)
  const [qrSimError, setQrSimError] = useState<string | null>(null)
  const [isSimulatingQr, setSimulatingQr] = useState(false)
  const [showDetectiveOnboarding, setShowDetectiveOnboarding] = useState(false)
  const [preloadDetectiveMap, setPreloadDetectiveMap] = useState(false)
  const detectiveName = useDossierStore((state) => state.detectiveName)
  const setDetectiveName = useDossierStore((state) => state.setDetectiveName)
  const currentLanguage = (
    (i18n.resolvedLanguage ?? i18n.language ?? 'ru').split('-')[0] as typeof AVAILABLE_LANGUAGES[number]
  )
  const changeLanguage = (lng: typeof AVAILABLE_LANGUAGES[number]) => {
    if (lng === currentLanguage) return
    i18n.changeLanguage(lng)
  }

  const handleStartDetective = useCallback((continueMode = false) => {
    setPreloadDetectiveMap(true)
    // If continueMode or name already exists, skip onboarding
    if (continueMode || detectiveName) {
      console.log('Starting investigation (Continue)...')
      // #region agent log (debug)
      fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'src/pages/HomePage.tsx:handleStartDetective', message: 'navigate_to_map_direct', data: { continueMode, hasDetectiveName: Boolean(detectiveName), nextRoute: Routes.MAP }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H0' }) }).catch(() => { });
      // #endregion agent log (debug)
      useInventoryStore.getState().setGameMode('detective')
      navigate(Routes.MAP)
      return
    }

    // Otherwise show onboarding
    // #region agent log (debug)
    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'src/pages/HomePage.tsx:handleStartDetective', message: 'open_detective_onboarding', data: { continueMode, hasDetectiveName: Boolean(detectiveName) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H0' }) }).catch(() => { });
    // #endregion agent log (debug)
    setShowDetectiveOnboarding(true)
  }, [navigate, detectiveName])

  const handleOnboardingComplete = useCallback((name: string) => {
    setDetectiveName(name)
    setShowDetectiveOnboarding(false)
    // #region agent log (debug)
    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'src/pages/HomePage.tsx:handleOnboardingComplete', message: 'navigate_to_vn_briefing', data: { nameLength: typeof name === 'string' ? name.length : null, nextRoute: `${Routes.VISUAL_NOVEL}/${SCENE_IDS.BRIEFING}` }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'pre-fix', hypothesisId: 'H0' }) }).catch(() => { });
    // #endregion agent log (debug)
    useInventoryStore.getState().setGameMode('detective')
    // Start the investigation with the Briefing scene directly
    navigate(`${Routes.VISUAL_NOVEL}/${SCENE_IDS.BRIEFING}`)
  }, [navigate, setDetectiveName])

  const [coopRoomStatus, setCoopRoomStatus] = useState<'idle' | 'loading' | 'active' | 'waiting' | 'missing'>('idle')
  const [coopRoomCode, setCoopRoomCode] = useState<string | null>(() => getLastCoopRoomCode())

  const isSignedIn = progress !== null
  // const hasUnallocatedSkills = progress?.skillPoints ? progress.skillPoints > 0 : false

  const hasKnownCoopRoom = useMemo(() => Boolean(coopRoomCode), [coopRoomCode])
  const canStartNewCoop = coopRoomStatus === 'active' || coopRoomStatus === 'waiting'
  const coopStatusLabel = useMemo(() => {
    if (coopRoomStatus === 'loading') return t('coop.statuses.checking')
    if (coopRoomStatus === 'active') return t('coop.statuses.active')
    if (coopRoomStatus === 'waiting') return t('coop.statuses.waiting')
    return ''
  }, [coopRoomStatus, t])

  const refreshCoopRoomStatus = useCallback(async () => {
    const code = getLastCoopRoomCode()
    setCoopRoomCode(code)
    if (!code) {
      setCoopRoomStatus('missing')
      return
    }

    setCoopRoomStatus('loading')
    try {
      const client = authenticatedClient() as any
      const { data, error } = await client.coop.rooms[code].get()
      if (error) throw error
      const room = (data as any)?.room
      const status = String(room?.status ?? '')
      if (status === 'active') setCoopRoomStatus('active')
      else if (status === 'waiting') setCoopRoomStatus('waiting')
      else setCoopRoomStatus('missing')
    } catch {
      setCoopRoomStatus('missing')
    }
  }, [])

  useEffect(() => {
    refreshCoopRoomStatus().catch(() => {
      // ignore
    })
  }, [refreshCoopRoomStatus])

  const handleStartGame = async () => {
    // Просто отправляем на стартовый роут согласно прогрессу
    // const dest = getStartDestination(progress?.skillPoints)
    // navigate(dest)
    navigate(`${Routes.VISUAL_NOVEL}/prologue_coupe_start`)
  }

  const handleCreatePlayer = async () => {
    try {
      setCreateMsg(null)
      await createPlayer()
      setCreateMsg(t('auth.createSuccess'))
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.createFailure')
      setCreateMsg(t('auth.createError', { error: errorMessage }))
      console.error('Error creating player:', err)
    }
  }

  const handleRegisterAdmin = async () => {
    setCreateMsg(t('auth.registerAdminNotice'))
  }

  const handleStartNewCoop = useCallback(async () => {
    // best-effort: leave previous room (if still exists), then auto-create a new one
    const code = getLastCoopRoomCode()
    try {
      const token = await getToken()
      const client = authenticatedClient(token ?? undefined, deviceId) as any
      if (code) {
        await client.coop.rooms[code].leave.post()
      }
    } catch {
      // ignore — we still proceed to create a new room
    } finally {
      clearLastCoopRoomCode()
      setCoopRoomCode(null)
      setCoopRoomStatus('missing')
      navigate(`${Routes.COOP}?mode=create&autocreate=1`)
    }
  }, [deviceId, getToken, navigate])

  const handleSimulateRathausQr = async () => {
    if (!isLoaded) {
      setQrSimError(t('qr.authLoading'))
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
            : t('qr.activationFailed')
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

      setQrSimNotice(t('qr.notice'))
    } catch (err) {
      console.error('[HomePage] Failed to simulate Rathaus QR', err)
      setQrSimError(t('qr.simulateFailed'))
    } finally {
      setSimulatingQr(false)
    }
  }

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 hidden sm:inline">
          {t('languageSwitcher.label')}
        </span>
        {AVAILABLE_LANGUAGES.map((lng) => {
          const isActive = currentLanguage === lng
          return (
            <button
              key={lng}
              type="button"
              onClick={() => changeLanguage(lng)}
              className={`rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] transition ${
                isActive
                  ? 'border-cyan-400 bg-cyan-500/10 text-cyan-100'
                  : 'border-white/20 text-slate-400 hover:border-white/40 hover:text-white'
              }`}
            >
              {lng.toUpperCase()}
            </button>
          )
        })}
      </div>

      <HeroSection
        title={t('hero.title')}
        badge={t('hero.badge')}
      />

      <Suspense fallback={<LoadingSpinner text={t('loading', { ns: 'common' })} />}>
        <div className="panel-grid mb-6">
          <div className="panel-span-12">
            <div className="glass-panel p-5 border border-white/5">
              <div className="flex flex-col gap-1">
                <Heading level={3} className="text-white">
                  {t('coop.title')}
                </Heading>
                <Text size="sm" variant="muted">
                  {t('coop.description')}
                </Text>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="primary" size="lg" onClick={() => navigate(`${Routes.COOP}?mode=create`)}>
                  {t('coop.start')}
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate(`${Routes.COOP}?mode=join`)}>
                  {t('coop.join')}
                </Button>
                {canStartNewCoop && (
                  <Button variant="secondary" size="lg" onClick={handleStartNewCoop}>
                    {t('coop.restart')}
                  </Button>
                )}
              </div>

              {hasKnownCoopRoom && (
                <div className="mt-3 text-xs text-slate-400 flex items-center justify-between gap-3">
                  <span>
                    {t('coop.lastRoomLabel')} <span className="font-mono text-slate-200">{coopRoomCode}</span>
                    {coopStatusLabel && ` ${coopStatusLabel}`}
                  </span>
                  <button
                    className="underline hover:text-slate-200"
                    onClick={() => refreshCoopRoomStatus()}
                    type="button"
                  >
                    {t('coop.refresh')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SURVIVAL MODE PANEL */}
          <div className="panel-span-12">
            <div className="glass-panel p-5 border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-transparent">
              <div className="flex flex-col gap-1">
                <Heading level={3} className="text-amber-400">
                  {t('survival.title')}
                </Heading>
                <Text size="sm" variant="muted">
                  {t('survival.description')}
                </Text>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-500"
                  onClick={() => navigate('/survival/player?mode=create')}
                >
                  {t('survival.createRoom')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-900/30"
                  onClick={() => navigate('/survival/player?mode=join')}
                >
                  {t('survival.join')}
                </Button>
              </div>
            </div>
          </div>

          {/* DETECTIVE MODE PANEL */}
          <div className="panel-span-12">
            <div className="glass-panel p-5 border border-slate-500/30 bg-gradient-to-br from-slate-900/60 to-transparent relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {/* Decorative Icon or Text */}
                <span className="text-6xl font-serif">1905</span>
              </div>

              <div className="flex flex-col gap-1 relative z-10">
                <Heading level={3} className="text-slate-200 font-serif tracking-wider">
                  {t('detective.title')}
                </Heading>
                <Text size="sm" variant="muted" className="font-serif italic">
                  {t('detective.subtitle')}
                </Text>
              </div>

              <div className="mt-4 flex gap-3 relative z-10">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-slate-700 hover:bg-slate-600 font-serif border border-slate-500/50"
                  onClick={() => handleStartDetective()}
                >
                  {t('detective.openCase')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent hover:bg-slate-800/50 font-serif border border-slate-600 text-slate-400"
                  onClick={() => handleStartDetective(true)}
                  title={t('detective.testTooltip')}
                >
                  {t('detective.continue')}
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
            title={t('qr.simulateTooltip')}
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full" />
              {t('qr.simulateButton')}
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
        />
      )}

      {/* Detective Onboarding Modal */}
      {showDetectiveOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal
            onComplete={handleOnboardingComplete}
            onCancel={() => {
              setShowDetectiveOnboarding(false)
              setPreloadDetectiveMap(false)
            }}
          />
        </Suspense>
      )}
      {preloadDetectiveMap && (
        <Suspense fallback={null}>
          <MapPreloader style={DETECTIVE_MAP_STYLE} />
        </Suspense>
      )}
    </Layout>
  )
}

export default ModernHomePage
