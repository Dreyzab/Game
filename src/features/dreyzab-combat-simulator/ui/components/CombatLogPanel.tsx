import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'

type CombatLogPanelProps = {
    logs: string[]
    turnCount: number
}

export default function CombatLogPanel({ logs, turnCount }: CombatLogPanelProps) {
    const logEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    return (
        <div className="hidden lg:flex absolute bottom-4 left-4 w-64 h-40 bg-black/60 backdrop-blur-md border border-zinc-800 p-2 z-30 flex-col rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1 text-[8px] text-zinc-500 mb-1 border-b border-zinc-800 font-bold uppercase pb-1">
                <Terminal size={10} /> Logic_Stream
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] text-zinc-400 space-y-1">
                {logs.slice().reverse().map((log, i) => (
                    <div
                        key={`${turnCount}-${i}`}
                        className={log.includes('strike') || log.includes('DMG') ? 'text-red-400' : 'text-zinc-400'}
                    >
                        &gt; {log}
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>
        </div>
    )
}
