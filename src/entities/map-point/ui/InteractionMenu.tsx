import React from 'react'
import { Button } from '@/shared/ui/components/Button'
import type { InteractionAction, InteractionKey } from '../model/useMapPointInteraction'
import {
  ShoppingBag,
  Wrench,
  Hammer,
  ArrowUpCircle,
  Scroll,
  MessageSquare,
  Info,
  Heart,
  Sparkles,
  Archive,
} from 'lucide-react'

export interface InteractionMenuProps {
  actions: InteractionAction[]
  onSelect: (key: InteractionKey) => void
}

const iconClass = 'w-4 h-4'

function iconFor(key: InteractionKey) {
  switch (key) {
    case 'trade':
      return <ShoppingBag className={iconClass} />
    case 'repair':
      return <Wrench className={iconClass} />
    case 'crafting':
      return <Hammer className={iconClass} />
    case 'upgrade':
      return <ArrowUpCircle className={iconClass} />
    case 'quests':
      return <Scroll className={iconClass} />
    case 'dialog':
      return <MessageSquare className={iconClass} />
    case 'information':
    case 'intel':
      return <Info className={iconClass} />
    case 'heal':
      return <Heart className={iconClass} />
    case 'bless':
      return <Sparkles className={iconClass} />
    case 'storage':
      return <Archive className={iconClass} />
    default:
      return <Info className={iconClass} />
  }
}

export const InteractionMenu: React.FC<InteractionMenuProps> = ({ actions, onSelect }) => {
  if (!actions || actions.length === 0) return null

  return (
    <div className="flex gap-2 pt-2 flex-wrap">
      {actions.map((action) => (
        <Button
          key={action.key}
          size="sm"
          onClick={() => onSelect(action.key)}
          className="flex-1"
          disabled={action.disabled}
          title={action.disabled ? action.reason : undefined}
          leftIcon={iconFor(action.key)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}

export default InteractionMenu

