import { Backpack, Trophy } from 'lucide-react'

type BattleHUDProps = {
    turnCount: number
    onShowEquipment: () => void
    onShowAchievements: () => void
}

const BattleHUD = ({ turnCount, onShowEquipment, onShowAchievements }: BattleHUDProps) => {
    return (
        <div className="relative z-50 pt-2 px-4 flex justify-between items-start pointer-events-none dreyzab-top-hud">
            <div className="flex items-center gap-2 pointer-events-auto mt-2">
                <button
                    onClick={onShowEquipment}
                    className="p-2 bg-black/40 backdrop-blur-md border border-white/10 text-zinc-400 rounded-full hover:text-blue-400 transition-colors shadow-xl"
                    title="Equipment"
                    type="button"
                >
                    <Backpack size={16} />
                </button>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 flex items-center gap-2 shadow-xl">
                    <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">Round</span>
                    <span className="text-amber-500 font-mono font-black text-xs">{turnCount}</span>
                </div>
            </div>

            <div className="flex gap-2 pointer-events-auto mt-2">
                <button
                    onClick={onShowAchievements}
                    className="p-2 bg-black/40 backdrop-blur-md border border-white/10 text-zinc-400 rounded-full hover:text-amber-500 transition-colors shadow-xl"
                    type="button"
                >
                    <Trophy size={16} />
                </button>
            </div>
        </div>
    )
}

export default BattleHUD
