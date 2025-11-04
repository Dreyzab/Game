import { Suspense } from 'react'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'
import { HeroSection } from '@/widgets/hero/HeroSection.tsx'
import { AuthActions } from '@/features/auth'
import { Layout } from '@/widgets/layout'

export function ModernHomePage() {
  // Mock data for demo - in real app this would come from hooks
  const isSignedIn = false

  const handleStartGame = () => {
    console.log('Start game clicked')
  }

  const handleCreatePlayer = () => {
    console.log('Create player clicked')
  }

  const handleRegisterAdmin = () => {
    console.log('Register admin clicked')
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
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold mb-4">Player Status</h3>
              <p className="text-sm text-muted">Player status widget placeholder</p>
            </div>
            </div>
            <div className="panel-span-5">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <p className="text-sm text-muted">Quick actions widget placeholder</p>
            </div>
            </div>
          </div>

          <div className="panel-grid">
            <div className="panel-span-7">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold mb-4">Active Quests</h3>
              <p className="text-sm text-muted">Active quests widget placeholder</p>
            </div>
            </div>
            <div className="panel-span-5">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold mb-4">System Status</h3>
              <p className="text-sm text-muted">System status widget placeholder</p>
            </div>
            </div>
          </div>
        </Suspense>

        {!isSignedIn && (
        <AuthActions
          onStartGame={handleStartGame}
          onCreatePlayer={handleCreatePlayer}
          onRegisterAdmin={handleRegisterAdmin}
          createMsg={null}
          isCreating={false}
          hasUnallocatedSkills={false}
        />
      )}
    </Layout>
  )
}

export default ModernHomePage
