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
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/shared/ui/components/Button'
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
 * Получить иконку для типа точки
 */
function getIconForType(type: string): React.ReactNode {
  const iconClass = 'w-5 h-5'
  
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
 * Компонент попапа точки на карте
 */
export const MapPointPopup: React.FC<MapPointPopupProps> = ({
  point,
  onClose,
  onNavigate,
  onInteract,
  onScanQR,
  onActionSelect,
}) => {
  const icon = getIconForType(point.type)
  const typeLabel = getTypeLabel(point.type)
  const statusLabel = getStatusLabel(point.status)
  const dangerLevel = point.metadata?.danger_level
  const dangerColor = getDangerColor(dangerLevel)
  const hasSceneBinding = Array.isArray(point.metadata?.sceneBindings) && point.metadata.sceneBindings.length > 0
  const { actions } = useMapPointInteraction(point)

  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden max-w-sm">
      {/* Заголовок */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-white">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold">{point.title}</h3>
              <p className="text-xs text-blue-100 opacity-90">{typeLabel}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Закрыть"
            >
              ✕
            </button>
          )}
        </div>

        {actions && actions.length > 0 && (
          <InteractionMenu
            actions={actions}
            onSelect={(key) => {
              if (onActionSelect) {
                onActionSelect(key)
              } else {
                onInteract?.()
              }
            }}
          />
        )}
      </div>

      {/* Контент */}
      <div className="p-4 space-y-3">
        {/* Описание */}
        <p className="text-sm text-gray-300">{point.description}</p>

        {/* Статус */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Статус:</span>
          <span
            className={cn(
              'font-medium',
              point.status === 'researched' && 'text-gray-400',
              point.status === 'discovered' && 'text-green-400',
              point.status === 'not_found' && 'text-yellow-400'
            )}
          >
            {statusLabel}
          </span>
        </div>

        {/* Уровень опасности */}
        {dangerLevel && (
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-gray-400">Опасность:</span>
            <span className={cn('font-medium', dangerColor)}>
              {dangerLevel === 'high' && 'Высокая'}
              {dangerLevel === 'medium' && 'Средняя'}
              {dangerLevel === 'low' && 'Низкая'}
            </span>
          </div>
        )}

        {/* Фракция */}
        {point.metadata?.faction && (
          <div className="flex items-center gap-2 text-sm">
            <Flag className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400">Фракция:</span>
            <span className="font-medium text-blue-300">
              {point.metadata.faction}
            </span>
          </div>
        )}

        {/* Расстояние */}
        {point.distance !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400">Расстояние:</span>
            <span className="font-medium text-purple-300">
              {point.distance < 1
                ? `${Math.round(point.distance * 1000)} м`
                : `${point.distance.toFixed(1)} км`}
            </span>
          </div>
        )}

        {/* QR-код подсказка */}
        {point.metadata?.qrHint && (
          <div className="bg-indigo-900 bg-opacity-50 p-2 rounded text-xs text-indigo-200">
            <div className="flex items-center gap-1 mb-1">
              <QrCode className="w-3 h-3" />
              <span className="font-medium">QR-код:</span>
            </div>
            <p>{point.metadata.qrHint}</p>
          </div>
        )}

        {/* Действия */}
        <div className="flex gap-2 pt-2">
          {onNavigate && (
            <Button
              size="sm"
              variant="outline"
              onClick={onNavigate}
              className="flex-1"
            >
              <Navigation className="w-4 h-4 mr-1" />
              Навигация
            </Button>
          )}

          {point.metadata?.qrRequired && onScanQR && (
            <Button
              size="sm"
              onClick={onScanQR}
              className="flex-1"
            >
              <QrCode className="w-4 h-4 mr-1" />
              Сканировать
            </Button>
          )}

          {onInteract && actions && actions.length === 0 && (
            <Button
              size="sm"
              onClick={onInteract}
              className="flex-1"
              disabled={!hasSceneBinding}
              title={!hasSceneBinding ? 'Сцена пока недоступна' : undefined}
            >
              Взаимодействовать
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MapPointPopup

