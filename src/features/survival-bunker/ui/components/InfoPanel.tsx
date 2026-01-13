import { useId, useMemo, useState } from 'react'
import { AlertOctagon, Clock, CloudRain, Users } from 'lucide-react'
import { THREAT_DATA } from '../../model/constants'
import type { NPC, Weather } from '../../model/types'

interface InfoPanelProps {
  populationCount: number
  npcs: NPC[]
  weather: Weather
  gameTime: string
}

function ThreatProjectionChart() {
  const chartId = useId()
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const { points, linePath, areaPath } = useMemo(() => {
    const data = THREAT_DATA
    const n = Math.max(2, data.length)
    const pts = data.map((d, i) => ({
      x: (i / (n - 1)) * 100,
      y: 100 - Math.min(100, Math.max(0, d.threat)),
      threat: d.threat,
      time: d.time,
    }))

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const area = `M ${pts[0].x} 100 L ${pts[0].x} ${pts[0].y} ${pts
      .slice(1)
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ')} L ${pts[pts.length - 1].x} 100 Z`

    return { points: pts, linePath: line, areaPath: area }
  }, [])

  const hovered = hoverIdx !== null ? points[hoverIdx] : null

  return (
    <div className="relative w-full h-full">
      {hovered && (
        <div className="absolute top-2 right-2 bg-slate-800/90 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-slate-200">
          <div className="text-slate-400">{hovered.time}</div>
          <div className="text-red-400 font-bold">{hovered.threat}</div>
        </div>
      )}

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const n = points.length
          if (n < 2) return
          const step = 100 / (n - 1)
          const idx = Math.min(n - 1, Math.max(0, Math.round(x / step)))
          setHoverIdx(idx)
        }}
      >
        <defs>
          <linearGradient id={`threatFill-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="95%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#threatFill-${chartId})`} />
        <path d={linePath} fill="none" stroke="#ef4444" strokeWidth={1.5} />

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={0}
              y2={100}
              stroke="#ef4444"
              strokeOpacity={0.25}
              strokeWidth={0.8}
            />
            <circle cx={hovered.x} cy={hovered.y} r={1.8} fill="#ef4444" />
          </>
        )}
      </svg>
    </div>
  )
}

export function InfoPanel({ populationCount, npcs, weather, gameTime }: InfoPanelProps) {
  return (
    <div className="bg-slate-900/90 border-l border-slate-700 p-6 flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-slate-700 pb-2">Census Data</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-white">
            <Users className="w-8 h-8 mr-4 text-cyan-400" />
            <div>
              <div className="text-4xl font-mono font-bold">{populationCount}</div>
              <div className="text-xs text-slate-400">TOTAL SOULS</div>
            </div>
          </div>
          <div className="text-4xl filter grayscale opacity-80" title="Morale">
            🙂
          </div>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {npcs.map((npc) => (
            <div
              key={npc.id}
              className={`flex justify-between text-sm p-2 rounded border border-slate-800 ${
                npc.status === 'Sick' ? 'bg-yellow-900/20 text-yellow-200 border-yellow-900/50' : 'bg-slate-800/50 text-slate-300'
              }`}
            >
              <span>
                {npc.name} <span className="text-xs opacity-50">({npc.role})</span>
              </span>
              <span className={`text-xs uppercase px-2 rounded ${npc.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                {npc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-slate-700 pb-2">Environment</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 p-3 rounded border border-slate-700 flex flex-col items-center">
            <Clock className="w-6 h-6 text-cyan-400 mb-2" />
            <span className="text-xl font-mono text-white font-bold">{gameTime}</span>
            <span className="text-xs text-slate-500">LOCAL TIME</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded border border-slate-700 flex flex-col items-center">
            <CloudRain className="w-6 h-6 text-purple-400 mb-2" />
            <span className="text-sm font-mono text-white font-bold text-center">{weather.condition}</span>
            <span className="text-xs text-slate-500">WEATHER</span>
          </div>
        </div>
        <div className="mt-2 text-center text-xs text-red-400 font-mono border border-red-900/30 bg-red-900/10 p-1 rounded">
          EXPEDITION RISK: <span className="font-bold animate-pulse">HIGH</span>
        </div>
      </div>

      <div className="flex-grow flex flex-col">
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-slate-700 pb-2 flex items-center justify-between">
          <span>Threat Projection</span>
          <AlertOctagon size={14} className="text-red-500" />
        </h2>
        <div className="flex-grow w-full min-h-[150px]">
          <ThreatProjectionChart />
        </div>
      </div>
    </div>
  )
}

