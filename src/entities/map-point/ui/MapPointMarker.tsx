/**
 * @fileoverview Компонент маркера точки на карте
 * FSD: entities/map-point/ui
 * 
 * Визуальное представление точки интереса на карте
 */

import React from 'react'
import { cn } from '@/shared/lib/utils/cn'
import type { MapPoint, MapPointType, MapPointStatus } from '@/shared/types/map'
import { 
  MapPin, 
  Users, 
  Scroll, 
  Home, 
  MessageSquare, 
  Zap,
  Flag,
  ShoppingBag
} from 'lucide-react'

export interface MapPointMarkerProps {
  point: MapPoint
  isSelected?: boolean
  isHovered?: boolean
  onClick?: () => void
}

/**
 * Получить иконку для типа точки
 */
function getIconForType(type: MapPointType): React.ReactNode {
  const iconClass = 'w-4 h-4'
  
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
 * Получить цвет для типа точки
 */
function getColorForType(type: MapPointType, status?: MapPointStatus): string {
  // Если точка исследована - серая обводка
  if (status === 'researched') {
    return 'border-gray-400'
  }
  
  // Если точка открыта - более яркая обводка
  if (status === 'discovered') {
    switch (type) {
      case 'poi':
        return 'border-blue-300'
      case 'npc':
        return 'border-green-300'
      case 'quest':
        return 'border-yellow-300'
      case 'location':
        return 'border-purple-300'
      case 'board':
        return 'border-orange-300'
      case 'settlement':
        return 'border-cyan-300'
      case 'anomaly':
        return 'border-red-300'
      default:
        return 'border-blue-300'
    }
  }
  
  // Прозрачный фон, яркая обводка для видимости на темной карте
  switch (type) {
    case 'poi':
      return 'border-blue-400'
    case 'npc':
      return 'border-green-400'
    case 'quest':
      return 'border-yellow-400'
    case 'location':
      return 'border-purple-400'
    case 'board':
      return 'border-orange-400'
    case 'settlement':
      return 'border-cyan-400'
    case 'anomaly':
      return 'border-red-400'
    case 'shop':
      return 'border-pink-400'
    default:
      return 'border-blue-400'
  }
}

/**
 * Компонент маркера точки на карте
 */
export const MapPointMarker: React.FC<MapPointMarkerProps> = ({
  point,
  isSelected = false,
  isHovered = false,
  onClick,
}) => {
  const colorClass = getColorForType(point.type, point.status)
  const icon = getIconForType(point.type)

  return (
    <div
      className={cn(
        'relative flex items-center justify-center cursor-pointer transition-all duration-200',
        'transform-gpu',
        isSelected && 'scale-125 z-50',
        isHovered && !isSelected && 'scale-110 z-40'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Точка: ${point.title}`}
    >
      {/* Пульсирующий эффект ТОЛЬКО для целей активных заданий */}
      {point.metadata?.isActiveQuestTarget && (
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-60',
            colorClass
          )}
          style={{
            animationDuration: '1.5s',
          }}
        />
      )}

      {/* Основной маркер - прозрачный фон, только обводка */}
      <div
        className={cn(
          'relative flex items-center justify-center',
          'w-8 h-8 rounded-full border-2',
          'bg-transparent backdrop-blur-sm',
          'shadow-lg',
          colorClass,
          'transition-all duration-200',
          isSelected && 'ring-2 ring-white ring-opacity-75 scale-125',
          'hover:scale-110'
        )}
        style={{
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="text-white drop-shadow-lg">
          {icon}
        </div>
      </div>

      {/* Индикатор опасности */}
      {point.metadata?.danger_level && point.metadata.danger_level !== 'low' && (
        <div
          className={cn(
            'absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white',
            point.metadata.danger_level === 'high' ? 'bg-red-600' : 'bg-orange-500'
          )}
          title={`Уровень опасности: ${point.metadata.danger_level}`}
        />
      )}

      {/* Индикатор QR-кода */}
      {point.metadata?.qrRequired && (
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-indigo-500 border border-white"
          title="Требуется QR-код"
        />
      )}
    </div>
  )
}

export default MapPointMarker

