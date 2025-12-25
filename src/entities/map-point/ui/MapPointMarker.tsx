/**
 * @fileoverview Маркер точки на карте
 * FSD: entities/map-point/ui
 *
 * Отрисовывает иконку точки с учётом типа, статуса
 * и выделения активных квестовых целей.
 */

import React from 'react'
import { cn } from '@/shared/lib/utils/cn'
import type { MapPoint } from '@/shared/types/map'
import {
  MapPin,
  Users,
  Scroll,
  Home,
  MessageSquare,
  Zap,
  Flag,
  ShoppingBag,
  Shield,
  Hammer,
  Leaf,
  Skull,
  Coins,
  Book,
  Sprout,
  Heart,
  Wrench,
} from 'lucide-react'

export interface MapPointMarkerProps {
  point: MapPoint
  isSelected?: boolean
  isHovered?: boolean
  onClick?: () => void
}

/**
 * Подбор иконки по типу точки и метаданным
 */
function getIconForPoint(point: MapPoint): React.ReactNode {
  const iconClass = 'w-4 h-4'
  const { type, metadata } = point

  // Faction specific icons
  if (metadata?.faction) {
    switch (metadata.faction) {
      case 'fjr':
        return <Shield className={iconClass} />
      case 'artisans':
        return <Hammer className={iconClass} />
      case 'synthesis':
        return <Leaf className={iconClass} />
      case 'anarchists':
        return <Skull className={iconClass} />
      case 'traders':
        return <Coins className={iconClass} />
      case 'old_believers':
        return <Book className={iconClass} />
      case 'farmers':
        return <Sprout className={iconClass} />
    }
  }

  // Service specific icons (override type if specific service is primary)
  if (metadata?.services && Array.isArray(metadata.services)) {
    if (metadata.services.includes('medical') || metadata.services.includes('heal')) {
      return <Heart className={iconClass} />
    }
    if (metadata.services.includes('crafting') || metadata.services.includes('repair')) {
      return <Wrench className={iconClass} />
    }
  }

  switch (type) {
    case 'poi':
      return <MapPin className={iconClass} />
    case 'npc':
      return <Users className={iconClass} />
    case 'quest':
      return <Scroll className={iconClass} />
    case 'location':
      return <Home className={iconClass} />
    case 'board':
      return <MessageSquare className={iconClass} />
    case 'settlement':
      return <Flag className={iconClass} />
    case 'anomaly':
      return <Zap className={iconClass} />
    case 'shop':
      return <ShoppingBag className={iconClass} />
    default:
      return <MapPin className={iconClass} />
  }
}

/**
 * Цвет рамки по типу, статусу и фракции
 */
function getColorClass(point: MapPoint): string {
  const { type, status, metadata } = point

  // Исследованная точка — приглушённый серый (если не фракционная база, которую хочется видеть ярко)
  if (status === 'researched' && type !== 'settlement') {
    return 'border-gray-400 text-gray-500'
  }

  // Faction colors (Intensity and Shades system)
  if (metadata?.faction) {
    switch (metadata.faction) {
      case 'fjr': // Saturated, "military" shades (Deep Blue/Navy)
        return 'border-blue-800 bg-blue-900/20 text-blue-400'
      case 'artisans': // Practical, slightly dusty colors (Burnt Orange/Rust)
        return 'border-orange-700 bg-orange-900/20 text-orange-500'
      case 'synthesis': // Sterile clean, bright shades (Bright Emerald/Teal)
        return 'border-emerald-500 bg-emerald-900/20 text-emerald-400'
      case 'anarchists': // Faded, worn, "street" colors (Desaturated Red/Grey)
        return 'border-red-800 bg-red-900/20 text-red-400'
      case 'traders': // Rich, saturated, "expensive" shades (Purple/Gold)
        return 'border-purple-600 bg-purple-900/20 text-yellow-400'
      case 'old_believers': // Traditional liturgical colors (Amber/Black)
        return 'border-amber-600 bg-amber-900/20 text-amber-200'
      case 'farmers': // Natural, muted earthy tones (Olive/Brown)
        return 'border-lime-800 bg-lime-900/20 text-lime-400'
    }
  }

  // Открытая точка — более мягкие цвета
  if (status === 'discovered') {
    switch (type) {
      case 'poi':
        return 'border-blue-300 text-blue-300'
      case 'npc':
        return 'border-green-300 text-green-300'
      case 'quest':
        return 'border-yellow-300 text-yellow-300'
      case 'location':
        return 'border-purple-300 text-purple-300'
      case 'board':
        return 'border-orange-300 text-orange-300'
      case 'settlement':
        return 'border-cyan-300 text-cyan-300'
      case 'anomaly':
        return 'border-red-300 text-red-300'
      default:
        return 'border-blue-300 text-blue-300'
    }
  }

  // Базовые цвета для неоткрытых точек (или активных)
  switch (type) {
    case 'poi':
      return 'border-blue-400 text-blue-400'
    case 'npc':
      return 'border-green-400 text-green-400'
    case 'quest':
      return 'border-yellow-400 text-yellow-400'
    case 'location':
      return 'border-purple-400 text-purple-400'
    case 'board':
      return 'border-orange-400 text-orange-400'
    case 'settlement':
      return 'border-cyan-400 text-cyan-400'
    case 'anomaly':
      return 'border-red-400 text-red-400'
    case 'shop':
      return 'border-pink-400 text-pink-400'
    default:
      return 'border-blue-400 text-blue-400'
  }
}

/**
 * Маркер точки на карте
 */
export const MapPointMarker: React.FC<MapPointMarkerProps> = ({
  point,
  isSelected = false,
  isHovered = false,
  onClick,
}) => {
  const colorClass = getColorClass(point)
  const shouldFade = point.status === 'researched' && point.type !== 'settlement' && !isSelected
  const isQuestTarget = Boolean(point.metadata?.isActiveQuestTarget)
  const isGlobalObjective = Boolean(point.metadata?.isGlobalObjective)
  const isObjective = isQuestTarget || isGlobalObjective
  const icon = getIconForPoint(point)

  return (
    <div
      className={cn(
        'relative flex items-center justify-center cursor-pointer transition-all duration-200',
        'shrink-0', // Prevent squeezing
        '!p-0 !m-0', // Override global styles
        'transform-gpu',
        shouldFade && 'opacity-[0.3]',
        isSelected && 'scale-125 z-50',
        isHovered && !isSelected && 'scale-110 z-40'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Точка: ${point.title}`}
      style={{
        width: '32px',
        height: '32px',
      }}
    >
      {/* Пульсирующее кольцо для целей квестов */}
      {isObjective && (
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-ping',
            isGlobalObjective ? 'opacity-40' : 'opacity-80',
            // Extract border color for ping if possible, or default to yellow/red
            'border-2',
            colorClass.split(' ').find(c => c.startsWith('border-')) || 'border-yellow-400'
          )}
          style={{
            animationDuration: isGlobalObjective ? '2.2s' : '1.1s',
          }}
        />
      )}

      {/* Основной круг маркера */}
      <div
        className={cn(
          'relative flex items-center justify-center',
          'w-full h-full rounded-full border-2', // w-full h-full instead of w-8 h-8
          'bg-gray-900/80 backdrop-blur-sm', // Default dark bg
          'shadow-lg',
          colorClass,
          'transition-all duration-200',
          isSelected && 'ring-2 ring-white ring-opacity-75',
          'hover:scale-110'
        )}
      >
        <div className="drop-shadow-lg">{icon}</div>
      </div>

      {/* Индикатор опасности */}
      {point.metadata?.danger_level && point.metadata.danger_level !== 'low' && (
        <div
          className={cn(
            'absolute w-3 h-3 rounded-full border border-white',
            point.metadata.danger_level === 'high' ? 'bg-red-600' : 'bg-orange-500'
          )}
          style={{ top: '-3px', right: '-3px' }}
          title={`Уровень опасности: ${point.metadata.danger_level}`}
        />
      )}

      {/* Индикатор необходимости QR */}
      {point.metadata?.qrRequired && (
        <div
          className="absolute w-3 h-3 rounded-full bg-indigo-500 border border-white"
          style={{ bottom: '-3px', right: '-3px' }}
          title="Требуется QR-сканирование"
        />
      )}
    </div>
  )
}

export default MapPointMarker
