import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    CharacterGroup,
    CharacterSprites,
    ChoicePanel,
    DialogueBox,
    VFXOverlay,
    PlayerStatusWidget
} from '@/entities/visual-novel/ui'
import type {
    VisualNovelChoiceView,
    VisualNovelLine,
    VisualNovelScene,
} from '@/shared/types/visualNovel'
import { FloatingText, type FloatingTextEvent } from '@/features/dreyzab-combat-simulator/index'

// Characters positioned on the left side of coupe4p.png
const LEFT_SIDE_SPEAKERS = ['bruno', 'otto', 'auto_бруно-вебер', 'auto_отто-кляйн']
// Characters positioned on the right side of coupe4p.png
const RIGHT_SIDE_SPEAKERS = ['lena', 'adele', 'adel', 'auto_адель', 'auto_лена-рихтер']

export interface VNScreenProps {
    scene: VisualNovelScene
    currentLine: VisualNovelLine | null
    choices: VisualNovelChoiceView[]
    isSceneCompleted: boolean
    isPending: boolean
    flags: Set<string> | Record<string, unknown>
    skills: Record<string, number>
    hp: number
    maxHp: number
    floatingEvents?: FloatingTextEvent[]
    onAdvance: () => void
    onChoice: (choiceId: string) => void
    onExit: () => void
    onAdviceViewed?: (payload: any) => void
    isCommitting?: boolean
}

export const VNScreen: React.FC<VNScreenProps> = ({
    scene,
    currentLine,
    choices,
    isSceneCompleted,
    isPending,
    flags,
    skills,
    hp,
    maxHp,
    floatingEvents = [],
    onAdvance,
    onChoice,
    onExit,
    onAdviceViewed,
    isCommitting,
}) => {
    // Use flags/skills somewhere if needed to avoid unused vars or suppress
    void flags
    void onAdviceViewed
    void isSceneCompleted

    // --- Background Transition Logic ---
    const [bgImage, setBgImage] = useState(scene.background)
    const [panClass, setPanClass] = useState('')
    const videoProgressLoggedRef = useRef(false)
    const videoFrameSampledRef = useRef(false)
    const isVideoBg = Boolean(bgImage && (bgImage.endsWith('.mp4') || bgImage.endsWith('.webm')))

    useEffect(() => {
        if (scene.background) {
            setBgImage(scene.background)
        }
    }, [scene.background])

    useEffect(() => {
        // #region agent log (H3)
        fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'H3',
                location: 'VNScreen.tsx:bg',
                message: 'Background resolved',
                data: {
                    sceneId: scene.id,
                    sceneBg: scene.background,
                    bgImage,
                    isVideo: Boolean(bgImage && (bgImage.endsWith('.mp4') || bgImage.endsWith('.webm'))),
                },
                timestamp: Date.now(),
            }),
        }).catch(() => { })
        // #endregion
    }, [bgImage, scene.background, scene.id])

    // Determine pan class based on image aspect ratio
    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget
        const ratio = img.naturalWidth / img.naturalHeight

        if (ratio < 1.5) {
            setPanClass('vn-bg-pan-narrow')
        } else if (ratio < 2) {
            setPanClass('vn-bg-pan-normal')
        } else if (ratio < 2.5) {
            setPanClass('vn-bg-pan-wide')
        } else {
            setPanClass('vn-bg-pan-ultrawide')
        }
    }, [])

    // Internal voices that should NOT change camera position
    const internalVoices = useMemo(() => [
        'narrator', 'рассказчик', 'hero', 'главный герой',
        'logic', 'логика', 'analysis', 'анализ', 'perception', 'восприятие',
        'empathy', 'эмпатия', 'drama', 'драма', 'gambler', 'азарт',
        'solidarity', 'солидарность', 'creativity', 'креативность',
        'knowledge', 'знания', 'внутренний голос', 'auto_'
    ], [])

    // Dynamic camera position based on speaker or scene (for coupe4p.png)
    const [lastNonInternalPosition, setLastNonInternalPosition] = useState('center center')

    const cameraPosition = useMemo(() => {
        const isCoupe = bgImage?.includes('coupe4p.png')
        if (!isCoupe) return 'center center'

        const speakerId = currentLine?.speakerId?.toLowerCase() ?? ''
        const sceneId = scene.id?.toLowerCase() ?? ''

        // Check if this is an internal voice - keep previous position
        const isInternalVoice = internalVoices.some(voice => speakerId.includes(voice))
        if (isInternalVoice && speakerId !== '') {
            return lastNonInternalPosition
        }

        // Check scene-based camera (observe/cards scenes)
        // Scenes focused on Bruno/Otto
        if (sceneId.includes('observe_bruno') || sceneId.includes('observe_otto') ||
            sceneId.includes('cards_bruno') || sceneId.includes('cards_otto')) {
            return '100% center'
        }
        // Scenes focused on Lena/Adele
        if (sceneId.includes('observe_lena') || sceneId.includes('observe_adele') ||
            sceneId.includes('cards_lena') || sceneId.includes('cards_adele')) {
            return '0% center'
        }

        // Check speaker-based camera
        // Bruno/Otto on the LEFT side of the image → show RIGHT part
        if (LEFT_SIDE_SPEAKERS.some(id => speakerId.includes(id))) {
            return '100% center'
        }
        // Lena/Adele on the RIGHT side → show LEFT part
        if (RIGHT_SIDE_SPEAKERS.some(id => speakerId.includes(id))) {
            return '0% center'
        }

        return 'center center'
    }, [bgImage, currentLine?.speakerId, scene.id, lastNonInternalPosition, internalVoices])

    // Update last non-internal position
    useEffect(() => {
        const speakerId = currentLine?.speakerId?.toLowerCase() ?? ''
        const isInternalVoice = internalVoices.some(voice => speakerId.includes(voice))
        if (!isInternalVoice && cameraPosition !== lastNonInternalPosition) {
            setLastNonInternalPosition(cameraPosition)
        }
    }, [cameraPosition, currentLine?.speakerId, lastNonInternalPosition, internalVoices])

    return (
        <div className="vn-chronicles relative w-full h-screen overflow-hidden bg-black text-white selection:bg-cyan-500/30">
            {/* Background Layer */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={bgImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 z-0"
                >
                    {bgImage && (
                        isVideoBg ? (
                            <video
                                src={bgImage}
                                autoPlay
                                loop
                                muted
                                playsInline
                                onLoadedData={() => {
                                    // #region agent log (H3)
                                    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            sessionId: 'debug-session',
                                            runId: 'run1',
                                            hypothesisId: 'H3',
                                            location: 'VNScreen.tsx:video:onLoadedData',
                                            message: 'Background video loaded',
                                            data: { src: bgImage },
                                            timestamp: Date.now(),
                                        }),
                                    }).catch(() => { })
                                    // #endregion
                                }}
                                onPlaying={(e) => {
                                    const target = e.currentTarget
                                    // #region agent log (H4)
                                    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            sessionId: 'debug-session',
                                            runId: 'run1',
                                            hypothesisId: 'H4',
                                            location: 'VNScreen.tsx:video:onPlaying',
                                            message: 'Background video is playing',
                                            data: {
                                                src: bgImage,
                                                currentTime: target.currentTime,
                                                paused: target.paused,
                                                readyState: target.readyState,
                                                videoWidth: target.videoWidth,
                                                videoHeight: target.videoHeight,
                                            },
                                            timestamp: Date.now(),
                                        }),
                                    }).catch(() => { })
                                    // #endregion
                                }}
                                onTimeUpdate={(e) => {
                                    if (videoProgressLoggedRef.current) return
                                    const target = e.currentTarget
                                    if (target.currentTime < 0.25) return
                                    videoProgressLoggedRef.current = true
                                    // #region agent log (H4)
                                    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            sessionId: 'debug-session',
                                            runId: 'run1',
                                            hypothesisId: 'H4',
                                            location: 'VNScreen.tsx:video:onTimeUpdate',
                                            message: 'Background video time progressed',
                                            data: {
                                                src: bgImage,
                                                currentTime: target.currentTime,
                                                paused: target.paused,
                                            },
                                            timestamp: Date.now(),
                                        }),
                                    }).catch(() => { })
                                    // #endregion

                                    if (videoFrameSampledRef.current) return
                                    videoFrameSampledRef.current = true
                                    try {
                                        const canvas = document.createElement('canvas')
                                        const w = 48
                                        const h = 27
                                        canvas.width = w
                                        canvas.height = h
                                        const ctx = canvas.getContext('2d', { willReadFrequently: true })
                                        if (!ctx) throw new Error('No 2D context')
                                        ctx.drawImage(target, 0, 0, w, h)
                                        const img = ctx.getImageData(0, 0, w, h).data
                                        let sum = 0
                                        let min = 255
                                        let max = 0
                                        for (let i = 0; i < img.length; i += 4) {
                                            const lum = (img[i] + img[i + 1] + img[i + 2]) / 3
                                            sum += lum
                                            if (lum < min) min = lum
                                            if (lum > max) max = lum
                                        }
                                        const avg = sum / (w * h)
                                        // #region agent log (H5)
                                        fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                sessionId: 'debug-session',
                                                runId: 'run1',
                                                hypothesisId: 'H5',
                                                location: 'VNScreen.tsx:video:frameSample',
                                                message: 'Sampled video frame luminance',
                                                data: {
                                                    src: bgImage,
                                                    currentTime: target.currentTime,
                                                    avgLum: Number(avg.toFixed(2)),
                                                    minLum: min,
                                                    maxLum: max,
                                                    size: `${w}x${h}`,
                                                },
                                                timestamp: Date.now(),
                                            }),
                                        }).catch(() => { })
                                        // #endregion
                                    } catch (err: any) {
                                        // #region agent log (H5)
                                        fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                sessionId: 'debug-session',
                                                runId: 'run1',
                                                hypothesisId: 'H5',
                                                location: 'VNScreen.tsx:video:frameSample',
                                                message: 'Failed to sample video frame luminance',
                                                data: { src: bgImage, currentTime: target.currentTime, error: String(err?.message ?? err) },
                                                timestamp: Date.now(),
                                            }),
                                        }).catch(() => { })
                                        // #endregion
                                    }
                                }}
                                onError={(e) => {
                                    const target = e.currentTarget
                                    // #region agent log (H3)
                                    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            sessionId: 'debug-session',
                                            runId: 'run1',
                                            hypothesisId: 'H3',
                                            location: 'VNScreen.tsx:video:onError',
                                            message: 'Background video failed to load',
                                            data: {
                                                src: bgImage,
                                                networkState: target.networkState,
                                                readyState: target.readyState,
                                                currentSrc: target.currentSrc,
                                            },
                                            timestamp: Date.now(),
                                        }),
                                    }).catch(() => { })
                                    // #endregion
                                }}
                                className="w-full h-full object-cover brightness-[0.85]"
                            />
                        ) : (
                            <motion.img
                                src={bgImage}
                                alt="background"
                                onLoad={handleImageLoad}
                                onError={() => {
                                    // #region agent log (H3)
                                    fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            sessionId: 'debug-session',
                                            runId: 'run1',
                                            hypothesisId: 'H3',
                                            location: 'VNScreen.tsx:img:onError',
                                            message: 'Background image failed to load',
                                            data: { src: bgImage },
                                            timestamp: Date.now(),
                                        }),
                                    }).catch(() => { })
                                    // #endregion
                                }}
                                animate={{ objectPosition: cameraPosition }}
                                transition={{ duration: 0.8, ease: 'easeInOut' }}
                                className={`w-full h-full object-cover brightness-[0.6] ${cameraPosition === 'center center' ? panClass : ''}`}
                            />
                        )
                    )}
                </motion.div>
            </AnimatePresence>

            {/* VFX Layer (Optional, can be driven by scene flags or effects) */}
            <VFXOverlay disableVignette={isVideoBg} />

            {/* Characters Layer */}
            <CharacterSprites
                characters={scene.characters || []}
                activeSpeakerId={currentLine?.speakerId || null}
            />

            {/* UI Layer */}
            <div className="absolute inset-0 z-30 flex flex-col justify-between">
                {/* Top Bar / HUD */}
                <div className="w-full p-4 flex justify-between items-start pointer-events-none">
                    {/* Left side empty for now or maybe exit button */}
                    <div className="pointer-events-auto">
                        {/* Exit button could go here */}
                    </div>

                    {/* Right side: Player Status */}
                    <div className="pointer-events-auto">
                        <PlayerStatusWidget hp={hp} maxHp={maxHp} />
                    </div>
                </div>

                {/* Center / Bottom for Dialogue */}
                <div className="w-full flex-1 flex flex-col justify-end pb-10 sm:pb-16 space-y-4">

                    {/* Floating Text (Damage/Heal numbers) */}
                    <div className="absolute inset-0 pointer-events-none z-50">
                        <FloatingText events={floatingEvents} />
                    </div>

                    {/* Character Nameplates (Group) */}
                    {currentLine?.speakerId && (
                        <CharacterGroup
                            characters={scene.characters || []}
                            activeCharacterId={currentLine.speakerId}
                        />
                    )}

                    {/* Dialogue Box */}
                    <div className="relative z-40">
                        <DialogueBox
                            speakerName={currentLine?.speakerId}
                            text={currentLine?.text}
                            stageDirection={undefined} // Could parse from text if needed
                            isPending={isPending}
                            onAdvance={onAdvance}
                            disabled={isCommitting}
                            onOpenMenu={onExit}
                        />
                    </div>

                    {/* Choices */}
                    {choices.length > 0 && (
                        <div className="relative z-50">
                            <ChoicePanel
                                choices={choices}
                                onSelect={onChoice}
                                skills={skills}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
