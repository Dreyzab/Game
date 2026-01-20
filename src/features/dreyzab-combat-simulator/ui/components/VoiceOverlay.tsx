
import { AnimatePresence, motion } from 'framer-motion'


export interface VoiceEvent {
    id: string
    text: string
    source?: string // e.g. "The Conductor", "Inner Voice"
    duration?: number
}

interface Props {
    events: VoiceEvent[]
}

export default function VoiceOverlay({ events }: Props) {
    return (
        <div className="absolute inset-0 pointer-events-none z-[70] overflow-hidden flex items-center justify-center">
            <AnimatePresence>
                {events.map((event) => {
                    const randomX = (Math.random() - 0.5) * 60; // +/- 30% x offset
                    const randomY = (Math.random() - 0.5) * 60; // +/- 30% y offset
                    const rotation = (Math.random() - 0.5) * 10; // Slight tilt

                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: `${randomX}vw`, y: `${randomY}vh`, scale: 0.8, rotate: rotation }}
                            animate={{ opacity: [0, 1, 1, 0], scale: 1.1 }}
                            exit={{ opacity: 0, filter: 'blur(10px)' }}
                            transition={{ duration: event.duration || 4, times: [0, 0.1, 0.8, 1] }}
                            className="absolute max-w-sm text-center"
                        >
                            <div className="text-2xl md:text-3xl font-serif italic text-zinc-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] tracking-wide">
                                "{event.text}"
                            </div>
                            {event.source && (
                                <div className="text-xs text-zinc-600 font-mono mt-2 uppercase tracking-widest border-t border-zinc-800/50 pt-1 inline-block">
                                    {event.source}
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
