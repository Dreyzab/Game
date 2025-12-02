/**
 * =====================================================
 * TUTORIAL BATTLE PAGE
 * Страница обучающего боя
 * =====================================================
 */

import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TutorialBattle } from '@/features/combat'
import { Routes } from '@/shared/lib/utils/navigation'

export default function TutorialBattlePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Сцена, куда вернуться после боя
  const returnScene = searchParams.get('returnScene') || 'combat_tutorial_victory'
  const defeatScene = searchParams.get('defeatScene') || 'combat_tutorial_defeat'

  const handleComplete = useCallback((result: 'victory' | 'defeat') => {
    const targetScene = result === 'victory' ? returnScene : defeatScene
    navigate(`${Routes.VISUAL_NOVEL}/${targetScene}`)
  }, [navigate, returnScene, defeatScene])

  const handleSkip = useCallback(() => {
    navigate(`${Routes.VISUAL_NOVEL}/station_hub`)
  }, [navigate])

  return (
    <TutorialBattle 
      onComplete={handleComplete} 
      onSkip={handleSkip}
    />
  )
}




