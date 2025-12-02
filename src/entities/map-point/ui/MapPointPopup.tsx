/**
 * @fileoverview Компонент попапа точки на карте
 * FSD: entities/map-point/ui
 * 
 * Отображает информацию о точке интереса в попапе
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
  Navigation,
  QrCode,
  AlertTriangle,
  Shield,
  Hammer,
  Leaf,
  Skull,
  Coins,
  Book,
  Sprout,
  Heart,
  Wrench,
  ShoppingBag
} from 'lucide-react'
import { useMapPointInteraction } from '@/features/interaction/model/useMapPointInteraction'
import type { InteractionKey } from '@/features/interaction/model/useMapPointInteraction'
import { InteractionMenu } from '@/features/interaction/ui/InteractionMenu'

export interface MapPointPopupProps {
  point: MapPoint
  onClose?: () => void
  onNavigate?: () => void
  onInteract?: () => void
  onScanQR?: () => void
  onActionSelect?: (action: InteractionKey) => void
}

/**
 * Получить иконку для типа точки и метаданным
 */
function getIconForPoint(point: MapPoint): React.ReactNode {
  const iconClass = 'w-5 h-5'
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

  // Service specific icons
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
 * Получить название типа точки
 */
function getTypeLabel(type: string): string {
  switch (type) {
    case 'poi':
      return 'Точка интереса'
    case 'npc':
      return 'Персонаж'
    case 'quest':
      return 'Квест'
    case 'location':
      return 'Локация'
    case 'board':
      return 'Доска объявлений'
    case 'settlement':
      return 'Поселение'
    case 'anomaly':
      return 'Аномалия'
    case 'shop':
      return 'Торговец'
    default:
      return 'Неизвестно'
  }
}

/**
 * Получить название статуса
 */
function getStatusLabel(status?: string): string {
  switch (status) {
    case 'discovered':
      return 'Обнаружено'
    case 'researched':
      return 'Исследовано'
    case 'not_found':
    default:
      return 'Не обнаружено'
  }
}

/**
 * Получить цвет для уровня опасности
 */
function getDangerColor(level?: string): string {
  switch (level) {
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-orange-500'
    case 'low':
    default:
      return 'text-green-500'
  }
}

/**
 * Получить цвет фона заголовка по фракции
 */
function getHeaderGradient(faction?: string): string {
  switch (faction) {
    case 'fjr':
      return 'from-blue-900 to-blue-700'
    case 'artisans':
      return 'from-orange-800 to-orange-600'
    case 'synthesis':
      return 'from-emerald-800 to-emerald-600'
    case 'anarchists':
      return 'from-red-900 to-red-700'
    case 'traders':
      return 'from-purple-900 to-purple-700'
    case 'old_believers':
      return 'from-amber-800 to-amber-600'
    case 'farmers':
      return 'from-lime-900 to-lime-700'
    default:
      return 'from-blue-600 to-purple-600'
  }
}

/**
 * Компонент попапа точки на карте
 */
const stopMouseEventPropagation: React.MouseEventHandler<HTMLDivElement> = (event) => {
  event.stopPropagation()
}

export const MapPointPopup: React.FC<MapPointPopupProps> = ({
  point,
  onClose,
  onNavigate,
  onInteract,
  onScanQR,
  onActionSelect,
}) => {
  const icon = getIconForPoint(point)
  const typeLabel = getTypeLabel(point.type)
  const statusLabel = getStatusLabel(point.status)
  const dangerLevel = point.metadata?.danger_level
  const showScanQR = point.metadata?.qrRequired === true
  const dangerColor = getDangerColor(dangerLevel)
  const hasSceneBinding = Array.isArray(point.metadata?.sceneBindings) && point.metadata.sceneBindings.length > 0
  const { actions } = useMapPointInteraction(point)
  const headerGradient = getHeaderGradient(point.metadata?.faction)

  return (
    <div
      className="bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden max-w-sm border border-gray-700"
      onClick={stopMouseEventPropagation}
      onMouseDown={stopMouseEventPropagation}
      onMouseUp={stopMouseEventPropagation}
    >
      <div className={cn("bg-linear-to-r p-4", headerGradient)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-white drop-shadow-md">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">{point.title}</h3>
              <p className="text-xs text-white/80 opacity-90">{typeLabel}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Закрыть"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-300">{point.description}</p>

        <div className="flex flex-wrap gap-y-2 gap-x-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Статус:</span>
            <span className={cn(
              "font-medium",
              point.status === 'researched' && 'text-gray-400',
              point.status === 'discovered' && 'text-green-400',
              point.status === 'not_found' && 'text-yellow-400'
            )}>{statusLabel}</span>
          </div>

          {dangerLevel && (
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-gray-400">Опасность:</span>
              <span className={cn("font-medium", dangerColor)}>
                {dangerLevel === 'high' && 'Высокая'}
                {dangerLevel === 'medium' && 'Средняя'}
                {dangerLevel === 'low' && 'Низкая'}
              </span>
            </div>
          )}

          {point.metadata?.faction && (
            <div className="flex items-center gap-2 text-sm w-full">
              <Flag className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400">Фракция:</span>
              <span className="font-medium text-blue-300 capitalize">{point.metadata.faction.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 flex-wrap">
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="btn btn--outline btn--sm flex-1 flex items-center justify-center min-w-[100px]"
            >
              <Navigation className="w-4 h-4 mr-1" />
              Навигация
            </button>
          )}

          {onInteract && (!actions || actions.length === 0) && (
            <button
              onClick={onInteract}
              className="btn btn--primary btn--sm flex-1 min-w-[120px]"
              disabled={!hasSceneBinding || (point.distance !== undefined && point.distance > 0.05) || (showScanQR && !point.metadata?.isUnlocked)}
              title={
                !hasSceneBinding
                  ? "Сцена пока недоступна"
                  : (point.distance !== undefined && point.distance > 0.05)
                    ? "Слишком далеко (>50м)"
                    : (showScanQR && !point.metadata?.isUnlocked)
                      ? "Требуется сканирование QR"
                      : undefined
              }
            >
              Взаимодействовать
            </button>
          )}

          {showScanQR && onScanQR && (
            <button
              onClick={onScanQR}
              className="btn btn--outline btn--sm flex-1 flex items-center justify-center border-purple-500 text-purple-400 hover:bg-purple-500/10 min-w-[100px]"
              disabled={point.distance !== undefined && point.distance > 0.05}
              title={(point.distance !== undefined && point.distance > 0.05) ? "Подойдите ближе для сканирования" : undefined}
            >
              <QrCode className="w-4 h-4 mr-1" />
              Scan QR
            </button>
          )}

          {actions && actions.length > 0 && (
            <div className="w-full">
              <InteractionMenu
                actions={actions}
                onSelect={(key) => {
                  if (point.distance !== undefined && point.distance > 0.05) {
                    // Prevent interaction if too far
                    return
                  }
                  if (onActionSelect) {
                    onActionSelect(key)
                  } else {
                    onInteract?.()
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MapPointPopup
