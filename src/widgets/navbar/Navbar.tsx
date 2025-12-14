import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Map, User, Package, Settings, Wrench, Sun, Moon, Play, Swords, Users, Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'
import { Routes } from '@/shared/lib/utils/navigation'
import { useTheme } from '@/shared/hooks/useTheme'

export interface NavbarProps {
  className?: string
}

export const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const { theme, toggle } = useTheme()

  const linkBase = 'inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs uppercase tracking-[0.24em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cyan)] focus-visible:ring-offset-2'
  const inactive = 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-cyan)] hover:bg-[color:var(--color-secondary)]'
  const active = 'text-[color:var(--color-cyan)] bg-[color:var(--color-secondary)] border border-[color:var(--color-cyan)]/50'

  return (
    <div
      className={cn(
        'fixed inset-x-0 top-0 z-50',
        'border-b border-[color:var(--color-border)] backdrop-blur-md',
        'bg-[color:var(--color-surface)]/70',
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* Left: Logo */}
          <NavLink to={Routes.HOME} className="inline-flex items-center gap-2 font-semibold">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-cyan)]" />
            <span className="text-sm tracking-wide">QR-Boost</span>
          </NavLink>

          {/* Center: Links (h-scroll on small) */}
          <nav className="flex-1 overflow-x-auto">
            <ul className="mx-auto flex w-max items-center gap-2">
              <li>
                <NavLink to={Routes.HOME} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <Home className="h-4 w-4" /> Home
                </NavLink>
              </li>
              <li>
                <NavLink to={Routes.MAP} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <Map className="h-4 w-4" /> Map
                </NavLink>
              </li>
              <li>
                <NavLink to={Routes.PVP} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <Swords className="h-4 w-4" /> PvP
                </NavLink>
              </li>
              <li>
                <NavLink to={Routes.COOP} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <Users className="h-4 w-4" /> Co-op
                </NavLink>
              </li>
              <li>
                <NavLink to={Routes.RESONANCE} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <Sparkles className="h-4 w-4" /> Resonance
                </NavLink>
              </li>
              <li>
                <NavLink to={Routes.QUESTS} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <span className="h-4 w-4 flex items-center justify-center font-bold text-[10px] border border-current rounded-sm">!</span> Quests
                </NavLink>
              </li>
              <li>
                <NavLink to={Routes.PROLOGUE} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <Play className="h-4 w-4" /> Prologue
                </NavLink>
              </li>
              <li>
                <NavLink to={Routes.CHARACTER} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <User className="h-4 w-4" /> Character
                </NavLink>
              </li>
              <li>
                <NavLink to={Routes.INVENTORY} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <Package className="h-4 w-4" /> Inventory
                </NavLink>
              </li>
              <li>
                <NavLink to={Routes.SETTINGS} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <Settings className="h-4 w-4" /> Settings
                </NavLink>
              </li>
              <li>
                <NavLink to={Routes.DEVTOOLS} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                  <Wrench className="h-4 w-4" /> DevTools
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Right: Theme toggle */}
          <button
            type="button"
            onClick={toggle}
            aria-pressed={theme === 'light'}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border',
              'border-[color:var(--color-border)] bg-[color:var(--color-surface)]',
              'px-3 py-2 text-xs uppercase tracking-[0.24em] transition',
              'hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]'
            )}
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[color:var(--color-cyan)]" />
            ) : (
              <Moon className="h-4 w-4 text-[color:var(--color-cyan)]" />
            )}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
