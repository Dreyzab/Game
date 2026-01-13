import { useEffect, useState } from 'react'
import { Battery, Crosshair, Database, Fuel, Pill, Shield, Wind, Wrench } from 'lucide-react'
import type { Resources } from '../../model/types'

interface ResourcePanelProps {
  resources: Resources
}

function SegmentedBar({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: string
  icon: React.ReactNode
}) {
  const segments = 10
  const filled = Math.ceil((value / 100) * segments)

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1 text-cyan-100 font-mono">
        <div className="flex items-center gap-2">
          {icon}
          <span className="tracking-widest text-sm font-bold">{label}</span>
        </div>
        <span className={`${value < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>{value}%</span>
      </div>
      <div className="flex gap-1 h-4">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm transition-all duration-500 ${
              i < filled ? color : 'bg-slate-800'
            } ${i < filled && value < 30 ? 'animate-pulse' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}) {
  const [prevValue, setPrevValue] = useState(value)
  const [animate, setAnimate] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (value > prevValue) setAnimate('up')
    if (value < prevValue) setAnimate('down')
    const t = setTimeout(() => setAnimate(null), 2000)
    setPrevValue(value)
    return () => clearTimeout(t)
  }, [value, prevValue])

  return (
    <div className="bg-slate-800/50 border border-slate-700 p-3 rounded flex flex-col items-center relative overflow-hidden">
      {animate === 'up' && (
        <div className="absolute top-0 right-2 text-green-400 font-bold animate-[floatUp_1s_ease-out_forwards] pointer-events-none">
          +1
        </div>
      )}
      {animate === 'down' && (
        <div className="absolute top-0 right-2 text-red-400 font-bold animate-[floatUp_1s_ease-out_forwards] pointer-events-none">
          -1
        </div>
      )}

      <div className={`mb-1 ${color}`}>{icon}</div>
      <div className="text-2xl font-mono font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  )
}

export function ResourcePanel({ resources }: ResourcePanelProps) {
  return (
    <div className="bg-slate-900/90 border-r border-slate-700 p-6 flex flex-col h-full overflow-y-auto">
      <h2 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-6 border-b border-slate-700 pb-2">
        Systems Status
      </h2>

      <SegmentedBar
        label="ENERGY"
        value={resources.energy}
        color="bg-yellow-400"
        icon={<Battery size={16} className="text-yellow-400" />}
      />
      <SegmentedBar
        label="AIR/FLTR"
        value={resources.air}
        color="bg-cyan-400"
        icon={<Wind size={16} className="text-cyan-400" />}
      />
      <SegmentedBar
        label="HULL"
        value={resources.hull}
        color="bg-slate-200"
        icon={<Shield size={16} className="text-slate-200" />}
      />

      <div className="flex-grow" />

      <h2 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-slate-700 pb-2 mt-8">
        Stockpile
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="RATIONS" value={resources.rations} icon={<Database size={20} />} color="text-orange-400" />
        <StatCard label="MEDS" value={resources.meds} icon={<Pill size={20} />} color="text-red-400" />
        <StatCard label="PARTS" value={resources.parts} icon={<Wrench size={20} />} color="text-gray-400" />
        <StatCard label="FUEL" value={resources.fuel} icon={<Fuel size={20} />} color="text-yellow-500" />
        <StatCard label="AMMO" value={resources.ammo} icon={<Crosshair size={20} />} color="text-red-600" />
      </div>
    </div>
  )
}

