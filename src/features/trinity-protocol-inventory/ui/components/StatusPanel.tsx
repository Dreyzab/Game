import { clsx } from 'clsx'
import { useTrinityInventoryStore } from '../../model/store'

export function StatusPanel() {
  const { getTotalWeight, equipment, items, templates } = useTrinityInventoryStore()
  const weight = getTotalWeight()
  const maxWeight = 60

  let status = 'LIGHT'
  let color = 'text-trinity-success'
  const percentage = Math.min((weight / maxWeight) * 100, 100)

  if (weight > 30) {
    status = 'NORMAL'
    color = 'text-white'
  }
  if (weight > 45) {
    status = 'HEAVY'
    color = 'text-trinity-warning'
  }
  if (weight > 55) {
    status = 'OVERLOAD'
    color = 'text-trinity-danger'
  }

  const primaryId = equipment.primary
  const primaryItem = primaryId ? items[primaryId] : null
  const primaryTemplate = primaryItem ? templates[primaryItem.templateId] : null

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="bg-trinity-panel border border-trinity-border p-4 relative overflow-hidden">
        <div className="flex justify-between items-end mb-2 relative z-10">
          <span className="text-gray-400 text-xs font-mono">WEIGHT LOAD</span>
          <span className={clsx('font-bold font-mono text-xl', color)}>
            {weight.toFixed(1)} <span className="text-sm text-gray-500">KG</span>
          </span>
        </div>

        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden relative z-10">
          <div
            className={clsx(
              'h-full transition-all duration-500',
              status === 'OVERLOAD'
                ? 'bg-trinity-danger'
                : status === 'HEAVY'
                  ? 'bg-trinity-warning'
                  : 'bg-trinity-accent'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-2 flex justify-between text-[10px] text-gray-500 font-mono relative z-10">
          <span>MOBILITY: {Math.max(100 - weight * 1.5, 10).toFixed(0)}%</span>
          <span>NOISE: {status}</span>
        </div>

        <div className="absolute -right-4 -bottom-4 text-8xl font-bold text-white/5 pointer-events-none select-none">KG</div>
      </div>

      <div className="bg-trinity-panel border border-trinity-border p-4 flex-1 flex flex-col relative">
        <h3 className="text-trinity-accent font-bold tracking-widest text-sm uppercase mb-4 border-b border-trinity-border/30 pb-2">
          TRINITY PROTOCOL
        </h3>

        {primaryTemplate ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <img src={primaryTemplate.image} className="w-16 h-8 object-cover border border-trinity-border" alt="" />
              <div>
                <div className="text-sm font-bold text-white">{primaryTemplate.name}</div>
                <div className="text-[10px] text-trinity-warning">MASTERY LEVEL III</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-900 border border-trinity-accent/40 p-2 hover:bg-slate-800 cursor-pointer transition-colors group">
                <div className="text-[10px] text-trinity-accent mb-1 group-hover:text-white">PASSIVE</div>
                <div className="text-xs font-bold">RECOIL DAMPENING</div>
              </div>
              <div className="bg-slate-900 border border-trinity-border p-2 hover:bg-slate-800 cursor-pointer transition-colors opacity-50">
                <div className="text-[10px] text-gray-500 mb-1">LOCKED</div>
                <div className="text-xs font-bold text-gray-600">RAPID RELOAD</div>
              </div>
            </div>

            <div className="mt-auto text-[10px] text-gray-500 font-mono text-center">SYNC RATE: 98.4%</div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-xs font-mono text-center">NO WEAPON <br /> DETECTED</div>
        )}

        <div className="absolute -left-4 top-1/2 -rotate-90 text-6xl font-bold text-white/5 pointer-events-none select-none whitespace-nowrap">
          SYSTEM
        </div>
      </div>
    </div>
  )
}

