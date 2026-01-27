import { useState } from 'react'
import { cn } from '@/shared/lib/utils/cn'
import { useDossierStore, type DossierEntry } from './store'

const DossierTab = ({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={cn(
      'px-6 py-2 font-serif text-lg transition-colors border-t-2 border-x-2 rounded-t-lg mx-1 relative top-[2px]',
      active
        ? 'bg-[#f5e6d3] border-[#8b7355] text-[#4a3b2a] z-10'
        : 'bg-[#d4c5a3] border-[#8b7355]/50 text-[#4a3b2a]/60 hover:bg-[#e0d0b0]'
    )}
    type="button"
  >
    {label}
  </button>
)

export const Dossier = () => {
  const { isOpen, toggleOpen, entries, evidence } = useDossierStore()
  const [tab, setTab] = useState<'files' | 'board'>('files')
  const [selectedEntry, setSelectedEntry] = useState<DossierEntry | null>(null)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl h-[85vh] bg-[#f5e6d3] rounded-sm shadow-2xl relative flex flex-col font-serif text-[#4a3b2a] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('/images/paper-texture.png')] mix-blend-multiply" />

        <div className="flex items-end px-8 pt-6 border-b-2 border-[#8b7355] relative z-20 bg-[#f5e6d3]/50">
          <div className="mr-8 mb-2">
            <h1 className="text-3xl font-bold tracking-widest uppercase text-[#8b7355]">Polizeiakte</h1>
            <div className="text-xs tracking-[0.2em] opacity-70">FREIBURG IM BREISGAU • 1905</div>
          </div>

          <DossierTab active={tab === 'files'} label="Akten (Files)" onClick={() => setTab('files')} />
          <DossierTab active={tab === 'board'} label="Untersuchung (Board)" onClick={() => setTab('board')} />

          <button
            onClick={toggleOpen}
            className="ml-auto mb-2 w-10 h-10 flex items-center justify-center border-2 border-[#8b7355] rounded-full hover:bg-[#8b7355] hover:text-[#f5e6d3] transition-colors font-bold text-xl"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative z-10 p-6 flex gap-6">
          {tab === 'files' ? (
            <>
              <div className="w-1/3 border-r-2 border-[#8b7355]/20 pr-4 overflow-y-auto">
                <h3 className="font-bold mb-4 uppercase text-sm tracking-wider opacity-60">Dokumente</h3>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={cn(
                      'p-4 mb-2 cursor-pointer border border-transparent hover:border-[#8b7355]/30 rounded transition-all',
                      selectedEntry?.id === entry.id ? 'bg-[#fff9f0] shadow-sm border-[#8b7355]/50' : 'bg-white/40',
                      'p-4 mb-2 cursor-pointer border border-transparent hover:border-[#8b7355]/30 rounded transition-all',
                      selectedEntry?.id === entry.id ? 'bg-[#fff9f0] shadow-sm border-[#8b7355]/50' : 'bg-white/40',
                      // Entries in store are always unlocked unless we have a separate mechanism.
                      // Store logic: addEntry adds it to the list. So all in list are unlocked.
                    )}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold">{entry.title}</span>
                      <span className="text-xs uppercase px-2 py-0.5 border border-[#4a3b2a]/20 rounded">
                        {entry.type}
                      </span>
                    </div>
                    <div className="text-xs mt-1 opacity-70 truncate">{entry.description}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-white/60 p-8 shadow-inner rotating-bg relative">
                {selectedEntry ? (
                  <div className="prose prose-stone">
                    <h2 className="font-serif text-3xl mb-6 border-b border-[#4a3b2a]/20 pb-2">{selectedEntry.title}</h2>
                    <p className="text-lg leading-relaxed">{selectedEntry.description}</p>
                    {selectedEntry.image && (
                      <img src={selectedEntry.image} alt={selectedEntry.title} className="mt-4 rounded shadow-md sepia-[.3]" />
                    )}
                    <div className="mt-8 text-xs opacity-50">
                      Unlocked: {new Date(selectedEntry.unlockedAt).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-[#8b7355]/50 italic">
                    Select a file to view details
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-[#f0e6d2] shadow-inner p-8 overflow-auto relative">
              <div className="absolute top-1/2 left-1/2 w-[600px] h-[400px] -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-[#8b7355]/30 rounded-xl flex flex-wrap gap-4 p-8 content-start">
                <div className="absolute -top-3 left-4 bg-[#f0e6d2] px-2 text-sm font-bold opacity-50 uppercase">
                  Case: Münsterplatz Heist
                </div>
                {evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="w-32 h-32 bg-white shadow-md p-2 flex flex-col gap-1 items-center justify-center text-center transform rotate-1 hover:rotate-0 transition-transform cursor-grab"
                  >
                    <div className="text-2xl">{ev.icon || '📄'}</div>
                    <div className="font-bold text-xs leading-tight">{ev.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
