import { motion, AnimatePresence } from 'framer-motion'

export interface FloatingTextEvent {
    id: string
    text: string
    color: string
    icon?: React.ReactNode
}

interface Props {
    events: FloatingTextEvent[]
}

const FloatingText = ({ events }: Props) => {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 overflow-visible">
            <AnimatePresence>
                {events.map((event) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20, scale: 0.5 }}
                        animate={{ opacity: 1, y: -40, scale: 1.2 }}
                        exit={{ opacity: 0, y: -80, scale: 0.8 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute text-2xl md:text-4xl font-black italic tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] flex items-center gap-2"
                        style={{
                            color: event.color,
                            textShadow: `0 0 10px ${event.color}`
                        }}
                    >
                        {event.icon}
                        {event.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

export default FloatingText
