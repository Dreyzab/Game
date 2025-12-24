import React, { useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { BackgroundEffects } from '../../shared/ui/components/BackgroundEffects'
import { Button } from '@/shared/ui/components/Button'
import { usePlayerProgress } from '@/shared/hooks/usePlayer'
import { getStartDestination, Routes } from '@/shared/lib/utils/navigation'

export interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { progress } = usePlayerProgress()

  const isHome = location.pathname === Routes.HOME

  const handleStartGame = useCallback(() => {
    navigate(getStartDestination(progress?.skillPoints))
  }, [navigate, progress?.skillPoints])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-background)] px-4 pb-16 pt-8">
      {createPortal(
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
          <BackgroundEffects />
        </div>,
        document.body
      )}
      <div className="relative z-10 mx-auto max-w-6xl">
        {isHome && (
          <div className="flex justify-center sm:justify-end mb-8">
            <Button
              variant="secondary"
              size="md"
              uppercase
              tracking="0.32em"
              onClick={handleStartGame}
              title="Начать игру"
            >
              <span className="h-2 w-2 rounded-full bg-[color:var(--color-cyan)]" />
              Начать игру
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
