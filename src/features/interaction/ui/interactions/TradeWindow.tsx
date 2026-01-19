import React from 'react'
import type { TradeInteraction } from '../../model/mapPointInteractions'
import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import { useTradeSession } from '../../model/useTradeSession'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface TradeWindowProps {
  interaction: TradeInteraction
  onClose?: () => void
}

const formatCurrency = (value: number, currency: string) => `${value.toLocaleString('ru-RU')} ${currency}`

export const TradeWindow: React.FC<TradeWindowProps> = ({ interaction, onClose }) => {
  const {
    traderInventory,
    traderOffer,
    playerInventory,
    playerOffer,
    traderOfferIds, // needed for toggling checks
    playerOfferIds, // needed for toggling checks
    balance,
    error,
    isPending,
    isSuccess,
    toggleTraderItem,
    togglePlayerItem,
    executeTrade,
    getTraderPrice,
    getPlayerPrice
  } = useTradeSession({ interaction, onClose })

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-slate-900/90 text-slate-200 rounded-xl overflow-hidden border border-slate-700">

      {/* TOP THIRD: TRADER INFO & ASSORTMENT */}
      <div className="h-1/3 flex border-b border-slate-700 bg-slate-950/50">
        {/* Trader Icon/Info */}
        <div className="w-1/4 p-4 flex flex-col items-center justify-center border-r border-slate-700 bg-slate-900">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-600/50 flex items-center justify-center mb-2">
            <span className="text-2xl" role="img" aria-label="Trader Avatar">👤</span>
          </div>
          <div className="text-center">
            <div className="font-bold text-amber-500 text-sm">{interaction.npcId || 'Trader'}</div>
            <div className="text-xs text-slate-500">Торговец</div>
          </div>
        </div>

        {/* Trader Assortment */}
        <div className="w-3/4 p-2 overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 px-2" id="trader-inventory-label">Ассортимент</div>
          <div
            className="grid grid-cols-4 gap-2"
            role="list"
            aria-labelledby="trader-inventory-label"
          >
            {traderInventory.map(item => {
              const isSelected = traderOfferIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleTraderItem(item.id)}
                  aria-pressed={isSelected}
                  aria-label={`Buy ${item.name} for ${getTraderPrice(item)} ${interaction.currency}`}
                  className={cn(
                    "aspect-square w-full bg-slate-800/50 border border-slate-700 rounded-md p-2 cursor-pointer flex flex-col items-center justify-between transition-all outline-none",
                    "hover:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
                    isSelected && "border-amber-500 bg-amber-900/20"
                  )}
                >
                  <div className="text-2xl" aria-hidden="true">📦</div>
                  <div className="text-[10px] text-center truncate w-full">{item.name}</div>
                  <div className="text-xs text-amber-400">{formatCurrency(getTraderPrice(item), interaction.currency)}</div>
                </button>
              )
            })}
            {traderInventory.length === 0 && (
              <div className="col-span-4 text-center text-slate-600 text-sm py-4" aria-live="polite">
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
            <div className="text-xs text-center text-red-400/70 mb-2" id="trader-offer-label">Предложение торговца</div>
            <div className="space-y-1" role="list" aria-labelledby="trader-offer-label">
              {traderOffer.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleTraderItem(item.id)}
                  aria-label={`Remove ${item.name} from offer`}
                  className="w-full flex justify-between items-center bg-slate-800/80 p-2 rounded border border-red-900/30 cursor-pointer hover:bg-red-900/20 outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <span className="text-sm truncate">{item.name}</span>
                  <span className="text-xs text-amber-500">{formatCurrency(getTraderPrice(item), interaction.currency)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Player Offer */}
          <div className="w-1/2 p-2 overflow-y-auto bg-green-950/10">
            <div className="text-xs text-center text-green-400/70 mb-2" id="player-offer-label">Ваше предложение</div>
            <div className="space-y-1" role="list" aria-labelledby="player-offer-label">
              {playerOffer.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => togglePlayerItem(item.id)}
                  aria-label={`Remove ${ITEM_TEMPLATES[item.templateId]?.name || item.templateId} from offer`}
                  className="w-full flex justify-between items-center bg-slate-800/80 p-2 rounded border border-green-900/30 cursor-pointer hover:bg-green-900/20 outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                >
                  <span className="text-sm truncate">{ITEM_TEMPLATES[item.templateId]?.name || item.templateId}</span>
                  <span className="text-xs text-amber-500">{formatCurrency(getPlayerPrice(item), interaction.currency)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Controls */}
        <div className="h-auto min-h-14 border-y border-slate-700 bg-slate-950 flex flex-col justify-center px-4 shrink-0 py-2 gap-1">
          <div className="flex items-center justify-between">
            <div className="text-sm" aria-live="polite">
              <span className="text-slate-400">Баланс: </span>
              <span className={balance >= 0 ? 'text-green-400' : 'text-red-400'}>
                {balance > 0 ? '+' : ''}{balance} {interaction.currency}
              </span>
            </div>
            <button
              onClick={executeTrade}
              type="button"
              disabled={isPending || (traderOffer.length === 0 && playerOffer.length === 0)}
              aria-busy={isPending}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 outline-none"
            >
              {isPending ? 'ОБМЕН...' : 'ОБМЕНЯТЬ'}
            </button>
          </div>
          {error && (
            <div className="text-xs text-red-400 text-center" role="alert">
              {error}
            </div>
          )}
          {isSuccess && (
            <div className="text-xs text-green-400 text-center" role="status">
              Обмен успешно завершён!
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: PLAYER INVENTORY */}
      <div className="h-1/3 bg-slate-950/50 flex flex-col min-h-0">
        <div className="px-3 py-2 border-b border-slate-800 flex justify-between items-center">
          <span className="text-xs uppercase tracking-wider text-slate-500" id="player-inventory-label">Ваш инвентарь</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trade window"
            className="text-xs text-slate-400 hover:text-white focus-visible:underline outline-none"
          >
            Закрыть
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div
            className="grid grid-cols-5 gap-2"
            role="list"
            aria-labelledby="player-inventory-label"
          >
            {playerInventory.map(item => {
              const template = ITEM_TEMPLATES[item.templateId]
              const itemLabel = template?.name || item.templateId
              const isSelected = playerOfferIds.includes(item.id)
              const ariaLabel = item.quantity > 1 ? `${itemLabel}, x${item.quantity}` : itemLabel

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => togglePlayerItem(item.id)}
                  aria-pressed={isSelected}
                  aria-label={`Sell ${ariaLabel} for ${getPlayerPrice(item)} ${interaction.currency}`}
                  className={cn(
                    "aspect-square w-full bg-slate-800/50 border border-slate-700 rounded-md p-1 cursor-pointer flex flex-col items-center justify-center relative group transition-all outline-none",
                    "hover:border-green-500/50 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
                    isSelected && "border-green-500 bg-green-900/20"
                  )}
                >
                  <div className="text-xl" aria-hidden="true">{template?.icon || '📦'}</div>
                  {item.quantity > 1 && (
                    <span className="absolute bottom-0 right-1 text-[10px] text-slate-400">x{item.quantity}</span>
                  )}
                </button>
              )
            })}
            {playerInventory.length === 0 && (
              <div className="col-span-5 text-center text-slate-600 text-sm py-4" aria-live="polite">
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
