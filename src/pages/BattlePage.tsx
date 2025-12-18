import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DreyzabBattle } from '@/features/dreyzab-combat-simulator'
import { Routes } from '@/shared/lib/utils/navigation'

export default function BattlePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const returnScene = searchParams.get('returnScene')
  const defeatScene = searchParams.get('defeatScene')
  const shouldAutoReturn = Boolean(returnScene || defeatScene)

  const handleBattleEnd = useCallback(
    (result: 'victory' | 'defeat') => {
      const targetScene = result === 'victory' ? returnScene : defeatScene ?? returnScene
      if (!targetScene) return
      navigate(`${Routes.VISUAL_NOVEL}/${targetScene}`)
    },
    [defeatScene, navigate, returnScene]
  )

  return (
    <div className="relative">
      {shouldAutoReturn && (
        <button
          onClick={() => {
            const targetScene = returnScene ?? defeatScene
            navigate(targetScene ? `${Routes.VISUAL_NOVEL}/${targetScene}` : Routes.VISUAL_NOVEL)
          }}
          className="fixed top-3 right-3 z-[130] px-3 py-2 rounded-lg bg-black/70 backdrop-blur border border-zinc-800 text-zinc-200 text-xs hover:text-white transition-colors"
          type="button"
        >
          Exit
        </button>
      )}
      <DreyzabBattle onBattleEnd={shouldAutoReturn ? handleBattleEnd : undefined} />
    </div>
  )
}
