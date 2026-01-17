import { cn } from '@/shared/lib/utils/cn'

export type SurvivalMode = 'datapad' | 'bunker' | 'controller' | 'map' | 'hexmap'

interface ModeConfig {
    id: SurvivalMode
    label: string
    activeClass: string
}

const MODES: ModeConfig[] = [
    { id: 'datapad', label: 'DATAPAD', activeClass: 'bg-emerald-700 border-emerald-400 text-white' },
    { id: 'map', label: 'Схема', activeClass: 'bg-blue-700 border-blue-400 text-white' },
    { id: 'hexmap', label: 'Карта', activeClass: 'bg-indigo-700 border-indigo-400 text-white' },
    { id: 'bunker', label: 'Бункер', activeClass: 'bg-cyan-700 border-cyan-400 text-white' },
    { id: 'controller', label: 'Контроллер', activeClass: 'bg-amber-700 border-amber-400 text-white' },
]

interface ModeSwitcherProps {
    mode: SurvivalMode
    onChange: (mode: SurvivalMode) => void
    className?: string
    /** Show START button when session is in lobby */
    showStart?: boolean
    /** Whether current user is allowed to start (host) */
    canStart?: boolean
    /** Called when user presses START */
    onStart?: () => void
}

/**
 * Mode switcher for Survival page.
 * Provides accessible toggle buttons for different view modes.
 */
export function ModeSwitcher({
    mode,
    onChange,
    className,
    showStart,
    canStart,
    onStart,
}: ModeSwitcherProps) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H1',
            location: 'ModeSwitcher.tsx:ModeSwitcher',
            message: 'ModeSwitcher render entry',
            data: {
                mode,
                typeof_showStart: typeof showStart,
                typeof_canStart: typeof canStart,
                typeof_onStart: typeof onStart,
            },
            timestamp: Date.now(),
        }),
    }).catch(() => { })
    // #endregion

    return (
        <div
            className={cn('fixed bottom-safe right-4 z-modal flex gap-2', className)}
            role="group"
            aria-label="Режим отображения"
        >
            {Boolean(showStart) && (
                <button
                    type="button"
                    onClick={() => onStart?.()}
                    disabled={!canStart}
                    title={canStart ? 'Запустить сессию' : 'Только хост может запустить сессию'}
                    className={cn(
                        'px-4 py-2 rounded-lg border text-sm font-bold transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                        canStart
                            ? 'bg-amber-700 border-amber-400 text-white hover:bg-amber-600'
                            : 'bg-gray-900/60 border-gray-700 text-gray-500 cursor-not-allowed'
                    )}
                >
                    START
                </button>
            )}
            {MODES.map((m) => (
                <button
                    key={m.id}
                    type="button"
                    aria-pressed={mode === m.id}
                    onClick={() => onChange(m.id)}
                    className={cn(
                        'px-4 py-2 rounded-lg border text-sm font-bold transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                        mode === m.id
                            ? m.activeClass
                            : 'bg-gray-900/60 border-gray-700 text-gray-300 hover:bg-gray-800'
                    )}
                >
                    {m.label}
                </button>
            ))}
        </div>
    )
}
