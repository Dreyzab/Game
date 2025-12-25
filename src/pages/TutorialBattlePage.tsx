import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DreyzabBattle } from '@/features/dreyzab-combat-simulator'
import { BattleEquipmentOverlay } from '@/widgets/battle-equipment'
import { Routes } from '@/shared/lib/utils/navigation'

export default function TutorialBattlePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const returnScene = searchParams.get('returnScene') || 'combat_tutorial_victory'
  const defeatScene = searchParams.get('defeatScene') || 'combat_tutorial_defeat'
  const scenarioId = searchParams.get('scenarioId') || 'default'

  const handleComplete = useCallback(
    (result: 'victory' | 'defeat') => {
      const targetScene = result === 'victory' ? returnScene : defeatScene
      navigate(`${Routes.VISUAL_NOVEL}/${targetScene}`)
    },
    [navigate, returnScene, defeatScene]
  )

  const handleSkip = useCallback(() => {
    navigate(`${Routes.VISUAL_NOVEL}/${returnScene}`)
  }, [navigate, returnScene])

  return (
    <div className="relative">
      <button
        onClick={handleSkip}
        className="fixed top-3 right-3 z-[130] px-3 py-2 rounded-lg bg-black/70 backdrop-blur border border-zinc-800 text-zinc-200 text-xs hover:text-white transition-colors"
        type="button"
      >
        Skip
      </button>
      <DreyzabBattle
        onBattleEnd={handleComplete}
        scenarioId={scenarioId as any}
        renderEquipmentOverlay={(props) => <BattleEquipmentOverlay {...props} />}
      />
    </div>
  )
}
