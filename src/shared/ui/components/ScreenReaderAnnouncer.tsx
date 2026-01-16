import { useEffect, useState, useRef } from 'react'

interface ScreenReaderAnnouncerProps {
    message: string | null
}

/**
 * Visually hidden component that announces messages to screen readers.
 * Uses aria-live="polite" to avoid interrupting current speech.
 */
export function ScreenReaderAnnouncer({ message }: ScreenReaderAnnouncerProps) {
    const [announcement, setAnnouncement] = useState('')
    const prevMessageRef = useRef<string | null>(null)

    useEffect(() => {
        if (message && message !== prevMessageRef.current) {
            setAnnouncement(message)
            prevMessageRef.current = message
        }
    }, [message])

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
            }}
        >
            {announcement}
        </div>
    )
}
