import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home,
  Map,
  User,
  Package,
  Settings,
  Wrench,
  Sun,
  Moon,
  Play,
  Swords,
  Users,
  Sparkles,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'
import { Routes } from '@/shared/lib/utils/navigation'
import { useTheme } from '@/shared/hooks/useTheme'

export interface NavbarProps {
  className?: string
}

export const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const mobileMenuId = React.useId()

  const linkBase = 'inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs uppercase tracking-[0.24em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cyan)] focus-visible:ring-offset-2'
  const inactive = 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-cyan)] hover:bg-[color:var(--color-secondary)]'
  const active = 'text-[color:var(--color-cyan)] bg-[color:var(--color-secondary)] border border-[color:var(--color-cyan)]/50'

  const drawerLinkBase =
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cyan)] focus-visible:ring-offset-2'
  const drawerInactive =
    'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-secondary-hover)]'
  const drawerActive =
    'text-[color:var(--color-cyan)] bg-[color:var(--color-secondary)] border border-[color:var(--color-cyan)]/40 shadow-[0_10px_30px_rgba(0,0,0,0.25)]'

  const navItems = React.useMemo(
    () => [
      { to: Routes.HOME, label: 'Home', icon: (className: string) => <Home className={className} /> },
      { to: Routes.MAP, label: 'Map', icon: (className: string) => <Map className={className} /> },
      { to: Routes.PVP, label: 'PvP', icon: (className: string) => <Swords className={className} /> },
      { to: Routes.COOP, label: 'Co-op', icon: (className: string) => <Users className={className} /> },
      { to: Routes.RESONANCE, label: 'Resonance', icon: (className: string) => <Sparkles className={className} /> },
      {
        to: Routes.QUESTS,
        label: 'Quests',
        icon: (className: string) => (
          <span
            className={cn(
              'inline-flex items-center justify-center font-bold leading-none border border-current rounded-sm text-[10px]',
              className
            )}
          >
            !
          </span>
        ),
      },
      { to: Routes.PROLOGUE, label: 'Prologue', icon: (className: string) => <Play className={className} /> },
      { to: Routes.CHARACTER, label: 'Character', icon: (className: string) => <User className={className} /> },
      { to: Routes.INVENTORY, label: 'Inventory', icon: (className: string) => <Package className={className} /> },
      { to: Routes.SETTINGS, label: 'Settings', icon: (className: string) => <Settings className={className} /> },
      { to: Routes.DEVTOOLS, label: 'DevTools', icon: (className: string) => <Wrench className={className} /> },
    ],
    []
  )

  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  React.useEffect(() => {
    if (!isMobileMenuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileMenuOpen])

  React.useEffect(() => {
    if (!isMobileMenuOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isMobileMenuOpen])

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(min-width: 640px)')

    const handleChange = () => {
      if (mq.matches) setIsMobileMenuOpen(false)
    }

    handleChange()
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        'border-b border-[color:var(--color-border)] backdrop-blur-md',
        'bg-[color:var(--color-surface)]/70',
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center gap-3">
          {/* Left: Logo */}
          <NavLink to={Routes.HOME} className="inline-flex items-center gap-2 font-semibold">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-cyan)]" />
            <span className="text-sm tracking-wide">QR-Boost</span>
          </NavLink>

          {/* Center: Links (hidden on phones) */}
          <nav className="max-sm:hidden flex-1 overflow-x-auto" aria-label="Primary">
            <ul className="mx-auto flex w-max items-center gap-2">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => cn(linkBase, isActive ? active : inactive)}>
                    {item.icon('h-4 w-4')} {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right: Actions */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-pressed={theme === 'light'}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border',
                'border-[color:var(--color-border)] bg-[color:var(--color-surface)]',
                'px-3 py-2 text-xs uppercase tracking-[0.24em] transition',
                'hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cyan)] focus-visible:ring-offset-2'
              )}
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-[color:var(--color-cyan)]" />
              ) : (
                <Moon className="h-4 w-4 text-[color:var(--color-cyan)]" />
              )}
              <span className="max-sm:hidden">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-expanded={isMobileMenuOpen}
              aria-controls={mobileMenuId}
              aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              className={cn(
                'sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border transition',
                'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-secondary)]',
                'hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cyan)] focus-visible:ring-offset-2',
                isMobileMenuOpen && 'border-[color:var(--color-cyan)]/60 text-[color:var(--color-cyan)]'
              )}
              title={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              key="nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="sm:hidden fixed left-0 right-0 top-14 bottom-0 z-40 bg-black/35 backdrop-blur-[2px]"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              key="nav-panel"
              id={mobileMenuId}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'sm:hidden fixed left-0 right-0 top-14 z-50',
                'max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain',
                'border-b border-[color:var(--color-border)]',
                'bg-[color:var(--color-surface)]/95 backdrop-blur-xl',
                'shadow-[0_20px_60px_rgba(0,0,0,0.55)]'
              )}
            >
              <div className="mx-auto max-w-6xl px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-text-secondary)]">
                    Navigation
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.24em] transition',
                      'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-secondary)]',
                      'hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-cyan)] focus-visible:ring-offset-2'
                    )}
                    title="Close navigation"
                  >
                    <X className="h-4 w-4" />
                    <span>Close</span>
                  </button>
                </div>

                <nav aria-label="Mobile primary">
                  <ul className="grid grid-cols-2 gap-2">
                    {navItems.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            cn(drawerLinkBase, isActive ? drawerActive : drawerInactive)
                          }
                        >
                          {item.icon('h-5 w-5')}
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
