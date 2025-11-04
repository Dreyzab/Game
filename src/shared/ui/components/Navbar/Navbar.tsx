import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../lib/utils/cn'
import { Menu, X, Map, Settings, User, Home } from 'lucide-react'

interface NavItem {
  label: string
  href?: string
  icon?: React.ReactNode
  onClick?: () => void
  active?: boolean
}

export interface NavbarProps {
  brand?: {
    name: string
    logo?: React.ReactNode
    href?: string
  }
  items?: NavItem[]
  rightItems?: NavItem[]
  className?: string
  variant?: 'default' | 'glass' | 'solid'
  size?: 'sm' | 'md' | 'lg'
}

export const Navbar: React.FC<NavbarProps> = ({
  brand,
  items = [],
  rightItems = [],
  className,
  variant = 'glass',
  size = 'md',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navbarClasses = cn(
    'fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-sm',
    {
      'bg-surface/80 border-border': variant === 'glass',
      'bg-surface border-border': variant === 'default',
      'bg-surface border-border shadow-lg': variant === 'solid',
    },
    {
      'h-12': size === 'sm',
      'h-14': size === 'md',
      'h-16': size === 'lg',
    },
    className
  )

  const NavLink: React.FC<{ item: NavItem; mobile?: boolean }> = ({ item, mobile = false }) => {
    const linkClasses = cn(
      'relative inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
      'hover:bg-secondary active:bg-secondary-active',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      {
        'text-text-secondary hover:text-text': !item.active,
        'text-primary bg-secondary': item.active,
        'w-full justify-start': mobile,
        'text-xs': size === 'sm',
        'text-sm': size === 'md',
        'text-base': size === 'lg',
      }
    )

    const content = (
      <>
        {item.icon}
        <span className={mobile ? 'flex-1' : ''}>{item.label}</span>
        {item.active && (
          <motion.div
            layoutId="navbar-indicator"
            className="absolute inset-0 bg-primary/10 rounded-md -z-10"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
      </>
    )

    if (item.onClick) {
      return (
        <button onClick={item.onClick} className={linkClasses}>
          {content}
        </button>
      )
    }

    return (
      <a href={item.href || '#'} className={linkClasses}>
        {content}
      </a>
    )
  }

  const defaultItems: NavItem[] = [
    { label: 'Главная', icon: <Home className="h-4 w-4" />, href: '/' },
    { label: 'Карта', icon: <Map className="h-4 w-4" />, href: '/map', active: true },
    { label: 'Настройки', icon: <Settings className="h-4 w-4" />, href: '/settings' },
  ]

  const defaultRightItems: NavItem[] = [
    { label: 'Профиль', icon: <User className="h-4 w-4" />, href: '/profile' },
  ]

  const navItems = items.length > 0 ? items : defaultItems
  const navRightItems = rightItems.length > 0 ? rightItems : defaultRightItems

  return (
    <>
      <nav className={navbarClasses}>
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Brand */}
            <div className="flex items-center">
              {brand?.logo}
              {brand?.name && (
                <a
                  href={brand.href || '/'}
                  className="font-bold text-text hover:text-primary transition-colors"
                >
                  {brand.name}
                </a>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item, index) => (
                <NavLink key={index} item={item} />
              ))}
            </div>

            {/* Desktop Right Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navRightItems.map((item, index) => (
                <NavLink key={index} item={item} />
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-secondary active:bg-secondary-active transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-14 left-0 right-0 bg-surface border-b border-border shadow-lg z-40"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item, index) => (
                <NavLink key={index} item={item} mobile />
              ))}
              <div className="border-t border-border my-4" />
              {navRightItems.map((item, index) => (
                <NavLink key={index} item={item} mobile />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className={cn('invisible', size === 'sm' && 'h-12', size === 'md' && 'h-14', size === 'lg' && 'h-16')} />
    </>
  )
}
