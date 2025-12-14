import React from 'react'
import { cn } from '@/shared/lib/utils/cn'

// Кооп-лобби - ожидает подключения к /coop API
export const CoopLobby: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="max-w-xl text-center space-y-4">
        <div className="text-4xl">🛰️</div>
        <div className="text-2xl font-bold">Локальный кооп временно недоступен</div>
        <div className="text-gray-400">
          После миграции на Bun API вернём создание комнат, QR и роли BODY/MIND/SOCIAL.
        </div>
      </div>
    </div>
  )
}

// Для совместимости с прежним API
export const RoomLobby = ({ roomCode }: { roomCode: string }) => (
  <div className={cn('min-h-screen bg-gray-950 text-white flex items-center justify-center p-6')}>
    <div className="text-center space-y-3">
      <div className="text-4xl">⏸️</div>
      <div className="text-xl font-bold">Комната {roomCode}</div>
      <div className="text-gray-400">Функционал будет восстановлен после миграции.</div>
    </div>
  </div>
)
