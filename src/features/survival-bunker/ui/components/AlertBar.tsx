import { AlertTriangle, Radio, Wrench } from 'lucide-react'
import type { Crisis } from '../../model/types'

interface AlertBarProps {
  crisis: Crisis
}

export function AlertBar({ crisis }: AlertBarProps) {
  if (crisis.active) {
    return (
      <div className="h-16 w-full bg-red-600 flex items-center justify-between px-6 shadow-lg shadow-red-900/50 animate-pulse z-50">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-white animate-bounce" />
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white tracking-widest uppercase">WARNING: {crisis.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 bg-black/30 px-4 py-1 rounded">
            <span className="text-white font-bold text-sm uppercase mr-2">Needs:</span>
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 border-2 border-white rounded flex items-center justify-center ${
                  i < crisis.filledSlots ? 'bg-green-500 text-black' : 'bg-black/50 text-white/50'
                }`}
              >
                <Wrench size={16} />
              </div>
            ))}
          </div>

          <div className="text-4xl font-mono font-bold text-white bg-black/20 px-4 rounded">
            00:{crisis.timer.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-16 w-full bg-slate-900 border-b border-slate-700 flex items-center overflow-hidden relative">
      <div className="bg-slate-800 h-full px-4 flex items-center z-10 border-r border-slate-700">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2" />
        <span className="text-green-500 font-mono font-bold tracking-wider">OS:ONLINE</span>
      </div>

      <div className="absolute whitespace-nowrap animate-[marquee_20s_linear_infinite] flex items-center text-cyan-500/80 font-mono text-lg left-40">
        <span className="mx-8">
          <Radio className="inline w-4 h-4 mb-1 mr-2" /> External sensors operational.
        </span>
        <span className="mx-8">/// Radiation levels stabilizing in Sector 7.</span>
        <span className="mx-8">/// Water filtration system operating at 98% efficiency.</span>
        <span className="mx-8">/// Reminder: Ration distribution at 19:00.</span>
        <span className="mx-8">/// Patrol team Beta report to airlock.</span>
      </div>
    </div>
  )
}

