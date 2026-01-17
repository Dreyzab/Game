import React, { useCallback, useEffect, useMemo, useState } from 'react'
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

    useEffect(() => {
        if (scene.background) {
            setBgImage(scene.background)
        }
    }, [scene.background])

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
                        bgImage.endsWith('.mp4') || bgImage.endsWith('.webm') ? (
                            <video
                                src={bgImage}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover brightness-[0.6]"
                            />
                        ) : (
                            <motion.img
                                src={bgImage}
                                alt="background"
                                onLoad={handleImageLoad}
                                animate={{ objectPosition: cameraPosition }}
                                transition={{ duration: 0.8, ease: 'easeInOut' }}
                                className={`w-full h-full object-cover brightness-[0.6] ${cameraPosition === 'center center' ? panClass : ''}`}
                            />
                        )
                    )}
                </motion.div>
            </AnimatePresence>

            {/* VFX Layer (Optional, can be driven by scene flags or effects) */}
            <VFXOverlay />

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
