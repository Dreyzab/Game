import {
  Activity,
  BadgeDollarSign,
  Crosshair,
  FlaskConical,
  Hammer,
  Radar,
  ShieldAlert,
  Sprout,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react'
import type { Crisis, Room } from '../../model/types'
import { ROOM_STATUS } from '../../model/types'

interface RoomActionPanelProps {
  room: Room
  crisis: Crisis
  onAction: (action: string, roomId: string) => void
}

export function RoomActionPanel({ room, crisis, onAction }: RoomActionPanelProps) {
  const isBroken = room.status !== ROOM_STATUS.OK
  const isRaiderAttack = crisis.active && crisis.title === 'RAIDER ATTACK'

  const getRoomAction = (id: string) => {
    switch (id) {
      case 'generator':
        return {
          id: 'boost_power',
          label: 'EMERGENCY BOOST',
          cost: '-1 FUEL / +25 ENERGY',
          icon: Zap,
          color: 'bg-yellow-600 hover:bg-yellow-500',
        }
      case 'garden':
        return {
          id: 'harvest',
          label: 'HARVEST CROPS',
          cost: '-5 ENERGY / +3 RATIONS',
          icon: Sprout,
          color: 'bg-green-600 hover:bg-green-500',
        }
      case 'workshop':
        return {
          id: 'fabricate',
          label: 'FABRICATE PARTS',
          cost: '-15 ENERGY / +2 PARTS',
          icon: Hammer,
          color: 'bg-orange-600 hover:bg-orange-500',
        }
      case 'medbay':
        return {
          id: 'synthesize',
          label: 'SYNTHESIZE MEDS',
          cost: '-10 ENERGY / +1 MEDS',
          icon: FlaskConical,
          color: 'bg-blue-600 hover:bg-blue-500',
        }
      case 'monitoring':
        if (isRaiderAttack) {
          return {
            id: 'defend_menu',
            label: 'DEFENSE PROTOCOLS',
            cost: 'CRITICAL ALERT',
            icon: ShieldAlert,
            color: 'bg-red-600 hover:bg-red-500',
          }
        }
        return {
          id: 'scan',
          label: 'DEEP SECTOR SCAN',
          cost: '-5 ENERGY / LOOT CHANCE',
          icon: Radar,
          color: 'bg-cyan-600 hover:bg-cyan-500',
        }
      case 'quarters':
        return {
          id: 'purge_air',
          label: 'VENTILATION PURGE',
          cost: '-5 ENERGY / +15 AIR',
          icon: Wind,
          color: 'bg-slate-600 hover:bg-slate-500',
        }
      default:
        return {
          id: 'inspect',
          label: 'RUN DIAGNOSTICS',
          cost: 'NO COST',
          icon: Activity,
          color: 'bg-slate-700 hover:bg-slate-600',
        }
    }
  }

  const action = getRoomAction(room.id)
  const ActionIcon = action.icon

  return (
    <div className="bg-slate-900/95 border-r border-slate-700 p-6 flex flex-col h-full overflow-y-auto">
      <h2 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-6 border-b border-slate-700 pb-2">
        Command Interface
      </h2>

      <div className="flex-grow flex flex-col justify-center gap-6">
        <div
          className={`p-4 rounded border flex flex-col items-center text-center ${
            isBroken || isRaiderAttack ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-green-900/20 border-green-500 text-green-500'
          }`}
        >
          <div className="text-4xl font-bold mb-2">{isBroken ? 'OFFLINE' : isRaiderAttack && room.id === 'monitoring' ? 'ALERT' : 'ONLINE'}</div>
          <div className="text-xs uppercase tracking-widest text-slate-400">System Integrity</div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Primary Protocol</h3>

          {isBroken ? (
            <button
              onClick={() => onAction('repair', room.id)}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-6 rounded transition-all animate-pulse border border-red-400/30 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              <Wrench size={24} />
              <div className="flex flex-col items-start leading-none">
                <span className="text-lg">REPAIR SYSTEM</span>
                <span className="text-[10px] opacity-70 mt-1">COST: 2 PARTS</span>
              </div>
            </button>
          ) : isRaiderAttack && room.id === 'monitoring' ? (
            <div className="space-y-3">
              <button
                onClick={() => onAction('defend_turrets', room.id)}
                className="w-full flex flex-col items-center justify-center px-6 bg-red-600 hover:bg-red-500 text-white font-bold py-6 rounded transition-all border border-red-400/50 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              >
                <Crosshair size={32} className="mb-2" />
                <span className="tracking-wider text-lg">ACTIVATE TURRETS</span>
                <span className="text-[10px] bg-black/30 px-2 py-1 rounded font-mono border border-white/20 mt-2">-5 AMMO</span>
              </button>

              <button
                onClick={() => onAction('defend_bribe', room.id)}
                className="w-full flex flex-col items-center justify-center px-6 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded transition-all border border-yellow-400/30"
              >
                <div className="flex items-center gap-2">
                  <BadgeDollarSign size={20} />
                  <span className="tracking-wider">PAY TRIBUTE</span>
                </div>
                <span className="text-[10px] bg-black/30 px-2 py-1 rounded font-mono border border-white/20 mt-1">-10 RATIONS</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAction(action.id, room.id)}
              className={`w-full flex flex-col items-center justify-center px-6 ${action.color} text-white font-bold py-8 rounded transition-all border border-white/10 group shadow-lg`}
            >
              <ActionIcon size={32} className="mb-2 group-hover:scale-110 transition-transform" />
              <span className="tracking-wider text-lg">{action.label}</span>
              <span className="text-[10px] bg-black/30 px-2 py-1 rounded font-mono border border-white/20 mt-2">{action.cost}</span>
            </button>
          )}
        </div>

        <div className="mt-4 p-4 bg-slate-800/50 rounded border border-slate-700">
          <h4 className="text-cyan-400 text-xs font-mono mb-2">/// PROTOCOL NOTES</h4>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            {isRaiderAttack && room.id === 'monitoring'
              ? 'THREAT DETECTED. Immediate defensive action required. Unauthorized entry imminent.'
              : 'Authorization level required for operation. Ensure safety protocols are engaged before initiating sequence.'}
          </p>
        </div>
      </div>
    </div>
  )
}
