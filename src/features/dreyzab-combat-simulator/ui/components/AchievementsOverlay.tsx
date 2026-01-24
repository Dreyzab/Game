import { Trophy, X } from 'lucide-react'
import type { Achievement } from '@/entities/dreyzab-combat-simulator/model/types'

type AchievementsOverlayProps = {
    achievements: Achievement[]
    onClose: () => void
}

const AchievementsOverlay = ({ achievements, onClose }: AchievementsOverlayProps) => {
    return (
        <div className="fixed inset-0 bg-black/95 z-110 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1a1a15] border-2 border-zinc-800 w-full max-w-xl rounded-2xl flex flex-col max-h-[80vh] shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/40">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <Trophy className="text-amber-500" /> Archives
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 bg-zinc-900 rounded-lg text-zinc-500"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto grid grid-cols-1 gap-2 custom-scrollbar">
                    {achievements.map((a) => (
                        <div
                            key={a.id}
                            className={[
                                'p-3 border rounded-xl flex gap-4',
                                a.unlocked
                                    ? 'bg-amber-950/20 border-amber-900/50'
                                    : 'bg-zinc-950 border-zinc-900 opacity-40',
                            ].join(' ')}
                        >
                            <span className="text-3xl">{a.icon}</span>
                            <div>
                                <div className="font-bold text-sm text-white">{a.title}</div>
                                <div className="text-[10px] text-zinc-500 italic">{a.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default AchievementsOverlay
