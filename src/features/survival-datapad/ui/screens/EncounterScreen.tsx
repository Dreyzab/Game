import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Info, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'
import type { EventOption, PlayerRole, SurvivalEvent } from '@/shared/types/survival'
import { DATAPAD_FALLBACK_THEME, DATAPAD_ROLE_THEMES } from '../../model/theme'
import { playSound } from '../../utils/sound'
import { Button } from '../components/Button'

type EncounterPhase = 'INTRO' | 'PROCESSING' | 'RESULT'

interface EncounterResult {
  success: boolean
  message: string
}

interface EncounterScreenProps {
  event: SurvivalEvent
  playerRole: PlayerRole | null
  playerInventory: Array<{ templateId: string; quantity: number }>
  isLoading: boolean
  onSelectOption: (optionId: string) => Promise<EncounterResult | null>
  onClose: () => void
}

function hasItem(playerInventory: Array<{ templateId: string; quantity: number }>, templateId: string): boolean {
  return playerInventory.some((i) => i.templateId === templateId && i.quantity > 0)
}

function formatCost(cost: EventOption['cost']): string | null {
  if (!cost) return null
  const parts = Object.entries(cost)
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .map(([k, v]) => {
      const amount = String(v)
      switch (k) {
        case 'food':
          return `${amount}F`
        case 'fuel':
          return `${amount}FU`
        case 'medicine':
          return `${amount}M`
        case 'defense':
          return `${amount}D`
        case 'morale':
          return `${amount}MO`
        default:
          return `${amount}${k.toUpperCase()}`
      }
    })
  return parts.length > 0 ? parts.join(' ') : null
}

export function EncounterScreen({
  event,
  playerRole,
  playerInventory,
  isLoading,
  onSelectOption,
  onClose,
}: EncounterScreenProps) {
  const [phase, setPhase] = useState<EncounterPhase>('INTRO')
  const [displayedText, setDisplayedText] = useState('')
  const [result, setResult] = useState<EncounterResult | null>(null)
  const [viewingItemId, setViewingItemId] = useState<string | null>(null)

  const textIndex = useRef(0)
  const theme = playerRole ? DATAPAD_ROLE_THEMES[playerRole] : DATAPAD_FALLBACK_THEME

  const targetText = useMemo(() => {
    if (phase === 'RESULT' && result) return result.message
    return event.text
  }, [event.text, phase, result])

  useEffect(() => {
    setDisplayedText('')
    textIndex.current = 0

    const intervalId = setInterval(() => {
      if (textIndex.current < targetText.length) {
        setDisplayedText((prev) => prev + targetText.charAt(textIndex.current))
        textIndex.current += 1
      } else {
        clearInterval(intervalId)
      }
    }, 18)

    return () => clearInterval(intervalId)
  }, [targetText])

  const handleOptionClick = async (optionId: string) => {
    playSound('click')
    setPhase('PROCESSING')

    const data = await onSelectOption(optionId)
    if (!data) {
      setPhase('INTRO')
      return
    }

    setResult(data)
    setPhase('RESULT')
  }

  const finishEncounter = () => {
    playSound('click')
    onClose()
  }

  const viewingItem = viewingItemId ? ITEM_TEMPLATES[viewingItemId] : null

  const requiredItems = useMemo(() => {
    const itemIds = event.options
      .map((o) => o.requiredItem)
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
    return Array.from(new Set(itemIds))
  }, [event.options])

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden font-mono animate-crt">
      <div className="absolute inset-0 pointer-events-none opacity-15 survival-datapad-scanline-overlay" />

      <header className="p-4 border-b border-gray-800 bg-black/80 backdrop-blur-sm z-10 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 tracking-widest">ENCOUNTER</p>
            <h2 className="text-xl font-bold tracking-widest">{event.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white" disabled={isLoading}>
            <X />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5 pb-40 custom-scrollbar relative">
        {event.imageUrl && (
          <div className="mb-5 border border-gray-800 bg-gray-950 overflow-hidden">
            <img src={event.imageUrl} alt={event.title} className="w-full h-48 object-cover opacity-80" />
          </div>
        )}

        <div className="border-l-2 border-gray-700 pl-4">
          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{displayedText}</p>
          {phase === 'PROCESSING' && <p className="text-gray-500 mt-3 animate-pulse">PROCESSING...</p>}
        </div>

        {phase === 'INTRO' && requiredItems.length > 0 && (
          <div className="mt-6 border border-gray-800 bg-gray-950/60 p-4">
            <p className="text-xs text-gray-400 tracking-widest mb-3">REQUIRED ITEMS</p>
            <div className="flex flex-wrap gap-2">
              {requiredItems.map((itemId) => (
                <button
                  key={itemId}
                  onClick={() => {
                    playSound('blip')
                    setViewingItemId(itemId)
                  }}
                  className={cn(
                    'px-3 py-2 border rounded text-xs flex items-center gap-2',
                    hasItem(playerInventory, itemId) ? 'border-emerald-500/40 text-emerald-200' : 'border-gray-700 text-gray-400'
                  )}
                >
                  <Info size={14} />
                  {ITEM_TEMPLATES[itemId]?.name ?? itemId}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent z-20 space-y-3">
        {phase === 'INTRO' &&
          event.options.map((option) => {
            const needsRole = Boolean(option.requiredRole && option.requiredRole !== playerRole)
            const needsItem = Boolean(option.requiredItem && !hasItem(playerInventory, option.requiredItem))
            const disabled = isLoading || needsRole || needsItem
            const costText = formatCost(option.cost)

            return (
              <Button
                key={option.id}
                variant="primary"
                disabled={disabled}
                className={cn('w-full flex flex-col items-stretch px-5 py-4 border border-gray-700 bg-gray-950/60 text-left')}
                colorClass={cn(theme.color, theme.borderColor)}
                onClick={() => handleOptionClick(option.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-gray-100">{option.text}</span>
                  {costText && <span className="text-[10px] text-amber-300 whitespace-nowrap">{costText}</span>}
                </div>
                {needsRole && (
                  <span className="text-[10px] text-yellow-400 mt-2">Requires role: {option.requiredRole}</span>
                )}
                {needsItem && <span className="text-[10px] text-red-400 mt-2">Requires item: {option.requiredItem}</span>}
              </Button>
            )
          })}

        {phase === 'RESULT' && (
          <Button
            variant="primary"
            className={cn(
              'w-full h-16 text-xl border-2',
              result?.success ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'
            )}
            onClick={finishEncounter}
          >
            CONTINUE <ArrowRight className="inline-block ml-2" />
          </Button>
        )}
      </div>

      {viewingItem && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-crt">
          <div className="w-full max-w-sm border border-gray-600 bg-gray-900 p-6 relative shadow-2xl">
            <button
              onClick={() => {
                playSound('click')
                setViewingItemId(null)
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-white"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center mb-6 pt-4">
              <div
                className={cn(
                  'p-4 rounded-full mb-4 border shadow-[0_0_15px_rgba(255,255,255,0.05)]',
                  theme.bgColor,
                  theme.borderColor
                )}
              >
                <Info />
              </div>
              <h2 className={cn('text-xl font-bold uppercase text-center tracking-widest', theme.color)}>{viewingItem.name}</h2>
            </div>

            <p className="text-gray-300 font-mono text-sm leading-relaxed mb-8 border-l-2 border-gray-700 pl-4">
              {viewingItem.description}
            </p>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                playSound('click')
                setViewingItemId(null)
              }}
            >
              CLOSE INFO
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
