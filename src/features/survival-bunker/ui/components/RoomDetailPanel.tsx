import { Activity, ShieldAlert, User } from 'lucide-react'
import type { Player, Room } from '../../model/types'
import { ROOM_STATUS } from '../../model/types'

interface RoomDetailPanelProps {
  room: Room
  players: Player[]
}

export function RoomDetailPanel({ room, players }: RoomDetailPanelProps) {
  const isBroken = room.status !== ROOM_STATUS.OK

  return (
    <div className="bg-slate-900/95 border-l border-slate-700 p-6 flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-slate-700 pb-2">Sector Analysis</h2>
        <div className="flex items-center gap-4 mb-2">
          {isBroken ? <ShieldAlert className="text-red-500 w-8 h-8" /> : <Activity className="text-cyan-500 w-8 h-8" />}
          <div>
            <h1 className="text-2xl font-display font-bold text-white uppercase">{room.name}</h1>
            <span className="text-xs font-mono text-slate-500">ID: {room.id.toUpperCase()}_01</span>
          </div>
        </div>

        <div className="text-sm text-slate-400 italic border-l-2 border-slate-700 pl-3 mt-4 py-2 bg-slate-800/20">
          {room.id === 'generator' && 'Main power core. Keep stable to maintain life support.'}
          {room.id === 'garden' && 'Hydroponic food production. Requires constant water filtration.'}
          {room.id === 'medbay' && 'Advanced medical facilities for treating radiation sickness and wounds.'}
          {room.id === 'monitoring' && 'Central surveillance and communications hub.'}
          {room.id === 'workshop' && 'Fabrication station for tools and spare parts.'}
          {room.id === 'quarters' && 'Rest area for crew. Morale depends on comfort levels.'}
        </div>
      </div>

      <div className="flex-grow">
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-slate-700 pb-2 flex justify-between">
          <span>Active Personnel</span>
          <span className="text-cyan-500">{players.length}</span>
        </h2>

        {players.length > 0 ? (
          <div className="space-y-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded border border-slate-700">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                    p.class === 'ENGINEER'
                      ? 'bg-orange-500'
                      : p.class === 'MEDIC'
                        ? 'bg-red-500'
                        : p.class === 'SOLDIER'
                          ? 'bg-green-600'
                          : 'bg-purple-500'
                  }`}
                >
                  {p.name.substring(0, 2)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-slate-200 font-bold">{p.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{p.class}</span>
                </div>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 border border-dashed border-slate-800 rounded text-slate-600">
            <User size={24} className="mb-2 opacity-50" />
            <span className="text-xs">SECTOR EMPTY</span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800 grid grid-cols-2 gap-2">
        <div className="bg-black/30 p-2 rounded">
          <div className="text-[10px] text-slate-500">TEMP</div>
          <div className="text-lg font-mono text-white">22°C</div>
        </div>
        <div className="bg-black/30 p-2 rounded">
          <div className="text-[10px] text-slate-500">O2 LEVEL</div>
          <div className="text-lg font-mono text-white">98%</div>
        </div>
      </div>
    </div>
  )
}
