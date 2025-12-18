import { clsx } from 'clsx'
import { useTrinityInventoryStore } from '../../model/store'

export function ItemDetailsModal() {
  const { selectedItemId, items, templates, selectItem } = useTrinityInventoryStore()

  if (!selectedItemId) return null

  const item = items[selectedItemId]
  if (!item) {
    selectItem(null)
    return null
  }

  const template = templates[item.templateId]

  const rarityColor = {
    common: 'text-gray-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
  }[template.rarity]

  const handleClose = () => selectItem(null)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div className="bg-trinity-panel border border-trinity-border p-1 w-[400px] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50" />

        <div className="bg-black/40 p-6 flex flex-col gap-4 border border-trinity-border/30">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold font-mono text-white tracking-tighter uppercase">{template.name}</h2>
              <span className={clsx('text-xs uppercase tracking-widest font-bold', rarityColor)}>{template.rarity} ITEM</span>
            </div>
            <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors" type="button">
              [X]
            </button>
          </div>

          <div className="w-full h-40 bg-gradient-to-b from-slate-800 to-black border border-trinity-border flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <img
              src={template.image}
              alt={template.name}
              className="h-full object-contain relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-trinity-accent pl-3">{template.description}</p>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-slate-900/50 p-2 border border-trinity-border/50">
              <span className="block text-[10px] text-gray-500 uppercase">Weight</span>
              <span className="text-sm font-mono">{template.weight} kg</span>
            </div>
            <div className="bg-slate-900/50 p-2 border border-trinity-border/50">
              <span className="block text-[10px] text-gray-500 uppercase">Size</span>
              <span className="text-sm font-mono">
                {template.width}x{template.height}
              </span>
            </div>
            {template.stats &&
              Object.entries(template.stats).map(([key, value]) => (
                <div key={key} className="bg-slate-900/50 p-2 border border-trinity-border/50">
                  <span className="block text-[10px] text-gray-500 uppercase">{key}</span>
                  <span className="text-sm font-mono text-trinity-accent">{value as React.ReactNode}</span>
                </div>
              ))}
          </div>

          {item.containerId === 'equipped' && (
            <div className="mt-2 text-center text-xs text-trinity-success font-mono border border-trinity-success/30 py-1 bg-trinity-success/5">
              STATUS: EQUIPPED
            </div>
          )}
        </div>

        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-trinity-accent" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-trinity-accent" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-trinity-accent" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-trinity-accent" />
      </div>
    </div>
  )
}

