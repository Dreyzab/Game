import React, { useMemo, useState } from 'react'
import type { TradeInteraction, TradeItem } from '../../model/mapPointInteractions'
import { useInventoryStore } from '@/shared/stores/inventoryStore'
import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import type { ItemState } from '@/entities/item/model/types'

interface TradeWindowProps {
  interaction: TradeInteraction
  onClose?: () => void
}

const formatCurrency = (value: number, currency: string) => `${value.toLocaleString('ru-RU')} ${currency}`

const getPrice = (item: ItemState | TradeItem): number => {
  if ('price' in item) return (item as TradeItem).price

  const template = ITEM_TEMPLATES[(item as ItemState).templateId]
  if (!template) return 10

  const rarityMultipliers: Record<string, number> = {
    common: 1,
    uncommon: 2.5,
    rare: 6,
    epic: 15,
    legendary: 50
  }

  // Base price calculation
  let basePrice = 50
  if (template.kind === 'weapon') basePrice = 150
  if (template.kind === 'armor') basePrice = 120
  if (template.kind === 'artifact') basePrice = 500

  return Math.floor(basePrice * (rarityMultipliers[template.rarity] || 1))
}

export const TradeWindow: React.FC<TradeWindowProps> = ({ interaction, onClose }) => {
  const { items: playerItemsMap } = useInventoryStore()
  const playerItems = useMemo(() => Object.values(playerItemsMap), [playerItemsMap])

  // State for items currently on the trading table
  const [traderOfferIds, setTraderOfferIds] = useState<string[]>([])
  const [playerOfferIds, setPlayerOfferIds] = useState<string[]>([])

  // Derived lists
  const traderInventory = useMemo(() =>
    interaction.inventory.filter(item => !traderOfferIds.includes(item.id)),
    [interaction.inventory, traderOfferIds])

  const traderOffer = useMemo(() =>
    interaction.inventory.filter(item => traderOfferIds.includes(item.id)),
    [interaction.inventory, traderOfferIds])

  const playerInventory = useMemo(() =>
    playerItems.filter(item => !playerOfferIds.includes(item.id)),
    [playerItems, playerOfferIds])

  const playerOffer = useMemo(() =>
    playerItems.filter(item => playerOfferIds.includes(item.id)),
    [playerItems, playerOfferIds])

  // Totals
  const traderTotal = useMemo(() =>
    traderOffer.reduce((sum, item) => sum + getPrice(item), 0),
    [traderOffer])

  const playerTotal = useMemo(() =>
    playerOffer.reduce((sum, item) => sum + getPrice(item), 0),
    [playerOffer])

  const balance = playerTotal - traderTotal

  // Handlers
  const toggleTraderItem = (id: string) => {
    setTraderOfferIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const togglePlayerItem = (id: string) => {
    setPlayerOfferIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleTrade = () => {
    console.log('🤝 Trade executed', {
      traderOffer,
      playerOffer,
      balance
    })
    // Reset offers after trade (mock)
    setTraderOfferIds([])
    setPlayerOfferIds([])
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-slate-900/90 text-slate-200 rounded-xl overflow-hidden border border-slate-700">

      {/* TOP THIRD: TRADER INFO & ASSORTMENT */}
      <div className="h-1/3 flex border-b border-slate-700 bg-slate-950/50">
        {/* Trader Icon/Info */}
        <div className="w-1/4 p-4 flex flex-col items-center justify-center border-r border-slate-700 bg-slate-900">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-600/50 flex items-center justify-center mb-2">
            <span className="text-2xl">👤</span>
          </div>
          <div className="text-center">
            <div className="font-bold text-amber-500 text-sm">{interaction.npcId || 'Trader'}</div>
            <div className="text-xs text-slate-500">Торговец</div>
          </div>
        </div>

        {/* Trader Assortment */}
        <div className="w-3/4 p-2 overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 px-2">Ассортимент</div>
          <div className="grid grid-cols-4 gap-2">
            {traderInventory.map(item => (
              <div
                key={item.id}
                onClick={() => toggleTraderItem(item.id)}
                className="aspect-square bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 rounded-md p-2 cursor-pointer flex flex-col items-center justify-between transition-all"
              >
                <div className="text-2xl">📦</div>
                <div className="text-[10px] text-center truncate w-full">{item.name}</div>
                <div className="text-xs text-amber-400">{formatCurrency(item.price, interaction.currency)}</div>
              </div>
            ))}
            {traderInventory.length === 0 && (
              <div className="col-span-4 text-center text-slate-600 text-sm py-4">
                Пусто
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MIDDLE: EXCHANGE AREA */}
      <div className="flex-1 flex flex-col bg-slate-900">
        <div className="flex-1 flex min-h-0">
          {/* Trader Offer */}
          <div className="w-1/2 border-r border-slate-700 p-2 overflow-y-auto bg-red-950/10">
            <div className="text-xs text-center text-red-400/70 mb-2">Предложение торговца</div>
            <div className="space-y-1">
              {traderOffer.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleTraderItem(item.id)}
                  className="flex justify-between items-center bg-slate-800/80 p-2 rounded border border-red-900/30 cursor-pointer hover:bg-red-900/20"
                >
                  <span className="text-sm truncate">{item.name}</span>
                  <span className="text-xs text-amber-500">{formatCurrency(item.price, interaction.currency)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Player Offer */}
          <div className="w-1/2 p-2 overflow-y-auto bg-green-950/10">
            <div className="text-xs text-center text-green-400/70 mb-2">Ваше предложение</div>
            <div className="space-y-1">
              {playerOffer.map(item => (
                <div
                  key={item.id}
                  onClick={() => togglePlayerItem(item.id)}
                  className="flex justify-between items-center bg-slate-800/80 p-2 rounded border border-green-900/30 cursor-pointer hover:bg-green-900/20"
                >
                  <span className="text-sm truncate">{ITEM_TEMPLATES[item.templateId]?.name || item.templateId}</span>
                  <span className="text-xs text-amber-500">{formatCurrency(getPrice(item), interaction.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Controls */}
        <div className="h-14 border-y border-slate-700 bg-slate-950 flex items-center justify-between px-4 shrink-0">
          <div className="text-sm">
            <span className="text-slate-400">Баланс: </span>
            <span className={balance >= 0 ? 'text-green-400' : 'text-red-400'}>
              {balance > 0 ? '+' : ''}{balance} {interaction.currency}
            </span>
          </div>
          <button
            onClick={handleTrade}
            disabled={traderOffer.length === 0 && playerOffer.length === 0}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
          >
            ОБМЕНЯТЬ
          </button>
        </div>
      </div>

      {/* BOTTOM: PLAYER INVENTORY */}
      <div className="h-1/3 bg-slate-950/50 flex flex-col min-h-0">
        <div className="px-3 py-2 border-b border-slate-800 flex justify-between items-center">
          <span className="text-xs uppercase tracking-wider text-slate-500">Ваш инвентарь</span>
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">Закрыть</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-5 gap-2">
            {playerInventory.map(item => {
              const template = ITEM_TEMPLATES[item.templateId]
              return (
                <div
                  key={item.id}
                  onClick={() => togglePlayerItem(item.id)}
                  className="aspect-square bg-slate-800/50 border border-slate-700 hover:border-green-500/50 rounded-md p-1 cursor-pointer flex flex-col items-center justify-center relative group"
                >
                  <div className="text-xl">{template?.icon || '📦'}</div>
                  {item.quantity > 1 && (
                    <span className="absolute bottom-0 right-1 text-[10px] text-slate-400">x{item.quantity}</span>
                  )}
                </div>
              )
            })}
            {playerInventory.length === 0 && (
              <div className="col-span-5 text-center text-slate-600 text-sm py-4">
                Инвентарь пуст
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradeWindow
