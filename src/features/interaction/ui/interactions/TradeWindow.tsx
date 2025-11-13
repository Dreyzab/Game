import React, { useMemo, useState } from 'react'
import type { TradeInteraction, TradeItem } from '../../model/mapPointInteractions'

interface TradeWindowProps {
  interaction: TradeInteraction
  onClose?: () => void
}

const formatCurrency = (value: number, currency: string) => `${value.toLocaleString('ru-RU')} ${currency}`

const deriveInitialItem = (items: TradeItem[]): TradeItem | null => (items.length > 0 ? items[0] : null)

export const TradeWindow: React.FC<TradeWindowProps> = ({ interaction, onClose }) => {
  const [selectedItem, setSelectedItem] = useState<TradeItem | null>(() =>
    deriveInitialItem(interaction.inventory)
  )
  const [quantity, setQuantity] = useState<number>(1)

  const totalPrice = useMemo(() => {
    if (!selectedItem) {
      return 0
    }
    return selectedItem.price * quantity
  }, [quantity, selectedItem])

  const handlePurchase = () => {
    if (!selectedItem) return
    console.log('🛒 Покупка предмета', {
      itemId: selectedItem.id,
      quantity,
      pointId: interaction.pointId,
    })
    setQuantity(1)
  }

  const handleSell = () => {
    if (!selectedItem) return
    console.log('💰 Продажа предмета', {
      itemId: selectedItem.id,
      quantity,
      pointId: interaction.pointId,
    })
    setQuantity(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-white/70">{interaction.subtitle}</p>
        <p className="text-xs text-white/50 mt-1">{interaction.summary}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <h3 className="text-sm font-semibold text-white/70 mb-2">Предложения</h3>
          <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {interaction.inventory.map((item) => (
              <li
                key={item.id}
                className={`rounded-xl border p-3 transition ${
                  selectedItem?.id === item.id
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                }`}
                onClick={() => {
                  setSelectedItem(item)
                  setQuantity(1)
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/90">{item.name}</span>
                  <span className="text-xs text-white/60">
                    {formatCurrency(item.price, interaction.currency)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-white/40">
                  <span>В наличии: {item.quantity}</span>
                  {item.description && <span>{item.description}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">
              {interaction.npcId ?? 'Торговец'}
            </p>
            <p className="text-base font-semibold text-white">
              Сделка и расчёт
            </p>
          </div>

          <label className="flex flex-col gap-1 text-sm text-white/70">
            Количество
            <input
              type="number"
              min={1}
              max={selectedItem?.quantity ?? 99}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value) || 1)}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-white/40 focus:outline-none"
            />
          </label>

          <div className="rounded-xl bg-black/40 px-3 py-2 text-sm text-white/80">
            Итоговая стоимость:{' '}
            <span className="font-semibold">
              {formatCurrency(totalPrice, interaction.currency)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/80 transition hover:bg-white/20"
              onClick={handlePurchase}
              disabled={!selectedItem}
            >
              Купить
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-lime-400/30 bg-lime-500/20 px-3 py-2 text-sm text-lime-200 transition hover:bg-lime-500/30 disabled:opacity-40"
              onClick={handleSell}
              disabled={!selectedItem}
            >
              Продать
            </button>
          </div>

          <button
            type="button"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/60 hover:border-white/30"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

export default TradeWindow

