import React from 'react'
import { BackgroundEffects } from '../../shared/ui/components/BackgroundEffects'

export interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-background)] px-4 pb-16 pt-8">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-6xl">
        {children}
      </div>
    </div>
  )
}
