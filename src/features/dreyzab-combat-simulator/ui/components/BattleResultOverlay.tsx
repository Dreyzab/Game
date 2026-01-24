import type { BattleSession } from '@/entities/dreyzab-combat-simulator/model/types'

type BattleResultOverlayProps = {
    phase: BattleSession['phase']
    onReset: () => void
}

const BattleResultOverlay = ({ phase, onReset }: BattleResultOverlayProps) => {
    if (phase !== 'VICTORY' && phase !== 'DEFEAT') return null

    if (phase === 'VICTORY') {
        return (
            <div className="fixed inset-0 bg-green-950/80 backdrop-blur-xl z-120 flex flex-col items-center justify-center p-8">
                <div className="text-5xl md:text-9xl font-black text-green-500 uppercase tracking-tighter drop-shadow-2xl">
                    Victory
                </div>
                <button
                    onClick={onReset}
                    className="mt-8 px-8 py-3 bg-black border-2 border-green-600 text-green-500 font-black rounded-full hover:bg-green-600 hover:text-black transition-all"
                    type="button"
                >
                    RE-DEPLOY
                </button>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-red-950/80 backdrop-blur-xl z-120 flex flex-col items-center justify-center p-8">
            <div className="text-5xl md:text-9xl font-black text-red-600 uppercase tracking-tighter glitch-text">
                Lost
            </div>
            <button
                onClick={onReset}
                className="mt-8 px-8 py-3 bg-black border-2 border-red-600 text-red-500 font-black rounded-full hover:bg-red-600 hover:text-black transition-all"
                type="button"
            >
                RESTORE LINK
            </button>
        </div>
    )
}

export default BattleResultOverlay
