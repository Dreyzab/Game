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
import { usePlayerProgress, useCreatePlayer } from '@/shared/hooks/usePlayer'
import { convexMutations } from '@/shared/api/convex'
import { getDeviceId } from '@/shared/lib/utils/deviceId'
import { getStartDestination } from '@/shared/lib/utils/navigation'

export function ModernHomePage() {
  const navigate = useNavigate()
  const { progress } = usePlayerProgress()
  const { createPlayer, isCreating } = useCreatePlayer()
  const [createMsg, setCreateMsg] = useState<string | null>(null)

  // Определяем, зарегистрирован ли игрок
  const isSignedIn = progress !== null

  // Проверяем наличие нераспределенных очков навыков
  const hasUnallocatedSkills = progress?.skillPoints ? progress.skillPoints > 0 : false

  const handleStartGame = async () => {
    const deviceId = getDeviceId()
    
    try {
      // Убеждаемся, что игрок существует
      if (deviceId) {
        await convexMutations.player.ensureByDevice({ deviceId })
      }
    } catch (e) {
      console.warn('ensureByDevice before prologue failed; proceeding anyway', e)
    } 

    // Определяем маршрут на основе наличия очков навыков
    const dest = getStartDestination(progress?.skillPoints)
    navigate(dest)
  }

  const handleCreatePlayer = async () => {
    try {
      setCreateMsg(null)
      await createPlayer()
      setCreateMsg('Игрок успешно создан!')
      // Обновляем страницу для загрузки данных нового игрока
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось создать игрока'
      setCreateMsg(`Ошибка: ${errorMessage}`)
      console.error('Error creating player:', err)
    }
  }

  const handleRegisterAdmin = async () => {
    try {
      await convexMutations.admin.register({ name: 'Admin' })
      setCreateMsg('Админ успешно зарегистрирован')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось зарегистрировать админа'
      setCreateMsg(`Ошибка: ${errorMessage}`)
      console.error('Error registering admin:', err)
    }
  }

  return (
    <Layout>
      <HeroSection
        title="QR-Boost"
        badge="Интерактивный дайджест QR-Boost"
      />

      <Suspense fallback={<LoadingSpinner text="Загрузка" />}>
        <div className="panel-grid mb-10">
          <div className="panel-span-7">
            <PlayerStatusWidget />
          </div>
          <div className="panel-span-5">
            <QuickActionsWidget />
          </div>
        </div>

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
