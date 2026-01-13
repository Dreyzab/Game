import type { ReactNode } from 'react'
import { Activity, AlertCircle, Wrench } from 'lucide-react'
import { BUNKER_BG_URL } from '../../model/constants'
import type { Player, Room } from '../../model/types'
import { ROOM_STATUS } from '../../model/types'

interface BunkerVisualizerProps {
  rooms: Room[]
  players: Player[]
  isPowerOff: boolean
  onRoomSelect: (room: Room) => void
}

function RoomOverlay({
  room,
  isPowerOff,
  onClick,
}: {
  room: Room
  isPowerOff: boolean
  onClick: () => void
}) {
  // Determine status indicators
  let statusIcon: ReactNode = null
  let borderStyle = 'border-transparent'
  let bgStyle = 'bg-transparent'

  if (room.status === ROOM_STATUS.BROKEN) {
    statusIcon = (
      <div className="absolute -top-3 -right-3 bg-red-600 text-white p-1 rounded-full animate-bounce shadow-lg z-20">
        <Wrench size={16} />
      </div>
    )
    borderStyle = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
    bgStyle = 'bg-red-500/10'
  } else if (room.status === ROOM_STATUS.CRITICAL) {
    statusIcon = (
      <div className="absolute -top-3 -right-3 bg-red-600 text-white p-1 rounded-full animate-pulse shadow-lg z-20">
        <AlertCircle size={20} />
      </div>
    )
    borderStyle = 'border-red-600 border-4 animate-pulse'
    bgStyle = 'bg-red-600/30'
  }

  // Coordinates can be string (px) or number (percent)
  return (
    <div
      onClick={onClick}
      className={`absolute w-32 h-24 -ml-16 -mt-12 border-2 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center group hover:scale-105 hover:bg-white/5 hover:border-cyan-500/50 ${borderStyle} ${bgStyle}`}
      style={{
        top: typeof room.top === 'number' ? `${room.top}%` : room.top,
        left: typeof room.left === 'number' ? `${room.left}%` : room.left,
      }}
    >
      {statusIcon}

      <div
        className={`absolute bottom-full mb-1 text-xs font-mono font-bold bg-black/80 px-2 py-1 rounded text-white whitespace-nowrap pointer-events-none transition-opacity duration-200 ${
          room.status === ROOM_STATUS.OK ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
        }`}
      >
        {room.name}
      </div>

      {!isPowerOff && room.status === ROOM_STATUS.OK && (
        <div className="w-2 h-2 rounded-full bg-green-500 blur-[2px] absolute top-2 left-2 animate-pulse" />
      )}
    </div>
  )
}

function PlayerAvatar({ player, className }: { player: Player; className?: string }) {
  const colorMap: Record<string, string> = {
    ENGINEER: 'bg-orange-500',
    SOLDIER: 'bg-green-600',
    MEDIC: 'bg-red-500',
    SCAVENGER: 'bg-purple-500',
  }

  return (
    <div className={`flex flex-col items-center transform transition-all duration-500 hover:scale-110 cursor-pointer ${className}`}>
      <div
        className={`w-10 h-10 rounded-full border-2 border-white/50 shadow-lg flex items-center justify-center text-white font-bold text-xs ${
          colorMap[player.class]
        } relative`}
      >
        <span className="z-10">{player.name.substring(0, 2)}</span>
        <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${colorMap[player.class]}`} />
      </div>
      <span className="bg-black/80 text-white text-[10px] px-1 rounded mt-1 font-mono">{player.name}</span>
    </div>
  )
}

export function BunkerVisualizer({ rooms, players, isPowerOff, onRoomSelect }: BunkerVisualizerProps) {
  const insidePlayers = players.filter((p) => p.isInside)
  const outsidePlayers = players.filter((p) => !p.isInside)

  return (
    <div className="relative h-full w-full bg-slate-950 overflow-hidden flex flex-col">
      <div className="relative grow w-full bg-black/50 overflow-hidden group">
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ${
            isPowerOff ? 'opacity-30 grayscale' : 'opacity-90'
          }`}
          style={{ backgroundImage: `url('${BUNKER_BG_URL}')` }}
        />

        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {rooms.map((room) => (
          <RoomOverlay key={room.id} room={room} isPowerOff={isPowerOff} onClick={() => onRoomSelect(room)} />
        ))}

        <div className="absolute bottom-4 left-4 flex gap-2 p-2 bg-slate-900/60 rounded-xl backdrop-blur-sm border border-slate-700/50 min-w-[200px] items-center">
          <span className="absolute -top-3 left-2 text-[10px] font-mono text-cyan-500 bg-slate-900 px-2 uppercase tracking-widest border border-slate-700">
            Lobby
          </span>
          {insidePlayers.map((p) => (
            <PlayerAvatar key={p.id} player={p} />
          ))}
          {insidePlayers.length === 0 && <span className="text-slate-500 font-mono text-xs pl-2">NO PERSONNEL</span>}
        </div>

        {isPowerOff && (
          <div className="absolute inset-0 bg-black/60 pointer-events-none flex items-center justify-center">
            <div className="text-red-500 font-black text-6xl opacity-20 -rotate-12 border-4 border-red-500 p-8 rounded-xl uppercase">
              Power Offline
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 left-4 flex flex-col gap-4">
        <div className="bg-slate-900/80 p-4 rounded border border-yellow-700/50 backdrop-blur w-48">
          <div className="flex items-center gap-2 mb-3 border-b border-yellow-700/30 pb-2">
            <Activity className="text-yellow-500 w-4 h-4" />
            <span className="text-yellow-500 text-xs font-bold font-mono tracking-wider">OUTSIDE SIGNAL</span>
          </div>

          <div className="space-y-4">
            {outsidePlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping absolute" />
                <div className="w-2 h-2 bg-yellow-500 rounded-full relative" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-200 font-bold">{p.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">GPS: Weak...</span>
                </div>
              </div>
            ))}
            {outsidePlayers.length === 0 && <span className="text-slate-600 text-xs italic">No active away teams.</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
