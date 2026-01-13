import { AlertTriangle, Box, Radar, X } from 'lucide-react'
import type { ScanResult } from '../../model/types'

interface ScanResultModalProps {
  result: ScanResult
  onClose: () => void
}

export function ScanResultModal({ result, onClose }: ScanResultModalProps) {
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-cyan-500/50 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(transparent_0%,rgba(6,182,212,0.5)_50%,transparent_100%)] bg-[length:100%_200%] animate-scan" />

        <div className="bg-cyan-950/50 p-4 border-b border-cyan-500/30 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Radar className="text-cyan-400 animate-[spin_4s_linear_infinite]" />
            <h2 className="text-cyan-400 font-display text-xl tracking-widest uppercase">Sector Scan Analysis</h2>
          </div>
          <button onClick={onClose} className="text-cyan-600 hover:text-cyan-300 transition-colors">
            <X />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center text-center relative z-10">
          {result.found ? (
            <div className="mb-6 animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-cyan-900/30 rounded-full border border-cyan-500 flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-cyan-500/20" />
                <div className="absolute inset-0 rounded-full border border-cyan-500/50 animate-[spin_3s_linear_infinite_reverse]" />
                <Box size={48} className="text-cyan-300 relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-widest">SIGNAL DETECTED</h3>
              <p className="text-slate-400 font-mono text-sm leading-relaxed">{result.message}</p>
            </div>
          ) : (
            <div className="mb-6 animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-slate-800/50 rounded-full border border-slate-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={48} className="text-slate-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-400 mb-2 tracking-widest">NO SIGNAL</h3>
              <p className="text-slate-500 font-mono text-sm leading-relaxed">{result.message}</p>
            </div>
          )}

          {result.found && result.items.length > 0 && (
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded p-4 mb-6">
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-3 text-left border-b border-slate-800 pb-1">Manifest</div>
              <div className="space-y-2">
                {result.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-cyan-900/10 p-2 rounded border border-cyan-900/30">
                    <span className="text-cyan-300 font-mono font-bold uppercase">{item.type}</span>
                    <span className="text-white font-mono font-bold tracking-widest">+{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 px-8 rounded w-full transition-all uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  )
}

