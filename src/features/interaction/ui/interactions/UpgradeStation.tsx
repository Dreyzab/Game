import React, { useMemo } from 'react'
import type { UpgradeInteraction } from '../../model/mapPointInteractions'
import { useInventoryStore } from '@/shared/stores/inventoryStore'
import { useWorkshop } from '@/shared/hooks/useWorkshop'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'

const formatCond = (cond?: number | null) => (cond === null || cond === undefined ? '—' : `${cond}%`)
const getUpgradeLevel = (stats: any) => stats?.upgradeLevel ?? 0
const calcMaxCondition = (templateId: string) => ITEM_TEMPLATES[templateId]?.baseStats.maxDurability ?? 100
const calcRepairCost = (templateId: string, condition?: number | null) => {
  const maxCond = calcMaxCondition(templateId)
  const current = condition ?? maxCond
  const missing = Math.max(0, maxCond - current)
  const scrapNeeded = missing <= 0 ? 0 : Math.max(1, Math.ceil(missing / (maxCond * 0.25)))
  return { scrapNeeded, missing, maxCond }
}
const calcUpgradeCost = (level: number) => (level + 1) * 2

interface UpgradeStationProps {
  interaction: UpgradeInteraction
  onClose?: () => void
}

export const UpgradeStation: React.FC<UpgradeStationProps> = ({ interaction, onClose }) => {
  const { items } = useInventoryStore()
  const { repair, upgrade } = useWorkshop()

  const repairableItems = useMemo(
    () => Object.values(items).filter((item) => item.condition !== null && item.condition !== undefined),
    [items]
  )

  const upgradeableItems = useMemo(
    () => Object.values(items).filter((item) => ['weapon', 'armor', 'clothing'].includes(item.kind)),
    [items]
  )

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-white/70">{interaction.subtitle}</p>
        <p className="text-xs text-white/50 mt-1">{interaction.summary}</p>
      </div>

      <div className="space-y-3">
        <div className="text-xs uppercase tracking-[0.32em] text-white/40">Ремонт</div>
        <div className="grid gap-2 md:grid-cols-2">
          {repairableItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-2"
            >
              <div>
                <div className="text-sm font-semibold text-white">{item.name}</div>
                <div className="text-xs text-white/60">Состояние: {formatCond(item.condition)}</div>
                <div className="text-[11px] text-amber-200/80">
                  Скрап: {calcRepairCost(item.templateId, item.condition).scrapNeeded}
                </div>
              </div>
              <button
                className="px-3 py-2 text-xs rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                onClick={() => repair.mutate(item.id)}
                disabled={repair.isPending}
              >
                {repair.isPending ? '...' : 'Починить'}
              </button>
            </div>
          ))}
          {repairableItems.length === 0 && (
            <div className="text-xs text-white/50">Нет предметов для ремонта</div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs uppercase tracking-[0.32em] text-white/40">Улучшения</div>
        <div className="grid gap-2 md:grid-cols-2">
          {upgradeableItems.map((item) => {
            const level = getUpgradeLevel(item.stats as any)
            const disabled = level >= 3 || upgrade.isPending
            const cost = calcUpgradeCost(level)
            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-2"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{item.name}</div>
                  <div className="text-xs text-white/60">Уровень улучшения: {level}/3</div>
                  <div className="text-[11px] text-amber-200/80">Скрап: {cost}</div>
                </div>
                <button
                  className="px-3 py-2 text-xs rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                  onClick={() => upgrade.mutate(item.id)}
                  disabled={disabled}
                >
                  {upgrade.isPending ? '...' : level >= 3 ? 'Макс' : 'Улучшить'}
                </button>
              </div>
            )
          })}
          {upgradeableItems.length === 0 && (
            <div className="text-xs text-white/50">Нет подходящих предметов</div>
          )}
        </div>
      </div>

      {(repair.error || upgrade.error) && (
        <div className="text-xs text-red-400">
          {(repair.error as any)?.message || (upgrade.error as any)?.message}
        </div>
      )}
      {(repair.data as any)?.message && (
        <div className="text-xs text-emerald-400">{(repair.data as any).message}</div>
      )}

      <button
        type="button"
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/60 hover:border-white/30"
        onClick={onClose}
      >
        Закрыть
      </button>
    </div>
  )
}

export default UpgradeStation
