import React from 'react'
import { MapPin, Users, Scroll, Home, MessageSquare, Flag, Zap, ShoppingBag } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'

interface MapLegendProps {
  className?: string
}

function LegendMarker({
  icon,
  colorClass,
  faded = false,
  dangerLevel,
  qrRequired,
  questTarget,
}: {
  icon: React.ReactNode
  colorClass: string
  faded?: boolean
  dangerLevel?: 'medium' | 'high'
  qrRequired?: boolean
  questTarget?: boolean
}) {
  return (
    <div className="relative w-7 h-7">
      {questTarget && (
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-ping border-2 opacity-80',
            colorClass.split(' ').find((c) => c.startsWith('border-')) ?? 'border-yellow-400'
          )}
          style={{ animationDuration: '1.1s' }}
        />
      )}

      <div
        className={cn(
          'relative flex items-center justify-center w-7 h-7 rounded-full border-2 bg-gray-900/80 backdrop-blur-sm shadow-lg',
          'text-xs',
          colorClass,
          faded && 'opacity-[0.09]'
        )}
      >
        <div className="drop-shadow-sm">{icon}</div>
      </div>

      {dangerLevel && (
        <div
          className={cn(
            'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white',
            dangerLevel === 'high' ? 'bg-red-600' : 'bg-orange-500'
          )}
          title="Опасность"
        />
      )}

      {qrRequired && (
        <div
          className={cn(
            'absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-white bg-indigo-500',
            faded && 'opacity-[0.09]'
          )}
          title="Требуется QR-сканирование"
        />
      )}
    </div>
  )
}

export const MapLegend: React.FC<MapLegendProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg border border-gray-800 text-sm text-gray-300',
        className
      )}
    >
      <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Легенда</h4>

      <div className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-gray-400 mb-2">
            Точки
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<MapPin className="w-4 h-4" />}
                colorClass="border-blue-400 text-blue-400"
              />
              <span>Место / POI</span>
            </div>
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<Users className="w-4 h-4" />}
                colorClass="border-green-400 text-green-400"
              />
              <span>NPC</span>
            </div>
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<Scroll className="w-4 h-4" />}
                colorClass="border-yellow-400 text-yellow-400"
              />
              <span>Квест</span>
            </div>
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<Home className="w-4 h-4" />}
                colorClass="border-purple-400 text-purple-400"
              />
              <span>Локация</span>
            </div>
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<MessageSquare className="w-4 h-4" />}
                colorClass="border-orange-400 text-orange-400"
              />
              <span>Доска</span>
            </div>
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<Flag className="w-4 h-4" />}
                colorClass="border-cyan-400 text-cyan-400"
              />
              <span>Поселение</span>
            </div>
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<Zap className="w-4 h-4" />}
                colorClass="border-red-400 text-red-400"
              />
              <span>Аномалия</span>
            </div>
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<ShoppingBag className="w-4 h-4" />}
                colorClass="border-pink-400 text-pink-400"
              />
              <span>Торговля / магазин</span>
            </div>
            <div className="text-xs text-gray-400 leading-snug pt-1">
              Если у точки есть фракция — цвет и иконка могут меняться под фракцию/сервис.
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-gray-400 mb-2">
            Индикаторы
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<MapPin className="w-4 h-4" />}
                colorClass="border-blue-400 text-blue-400"
                qrRequired
              />
              <span>Требуется QR-сканирование</span>
            </div>
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<MapPin className="w-4 h-4" />}
                colorClass="border-blue-400 text-blue-400"
                dangerLevel="medium"
              />
              <span>Опасность: средняя</span>
            </div>
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<MapPin className="w-4 h-4" />}
                colorClass="border-blue-400 text-blue-400"
                dangerLevel="high"
              />
              <span>Опасность: высокая</span>
            </div>
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<Scroll className="w-4 h-4" />}
                colorClass="border-yellow-400 text-yellow-400"
                questTarget
              />
              <span>Цель активного квеста</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-gray-400 mb-2">
            Состояния
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <LegendMarker
                icon={<MapPin className="w-4 h-4" />}
                colorClass="border-gray-400 text-gray-500"
                faded
              />
              <span>Исследовано (сильно приглушено)</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-gray-400 mb-2">
            Слои карты
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/60" />
              <span>Безопасная зона</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/60" />
              <span>Опасная зона</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-200/10 border border-white/20" />
              <span>Туман войны</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
