import React from 'react'
import type { UpgradeInteraction, UpgradeOption } from '../../model/mapPointInteractions'

interface UpgradeStationProps {
  interaction: UpgradeInteraction
  onClose?: () => void
}

const UpgradeCard: React.FC<{ option: UpgradeOption; onApply: (option: UpgradeOption) => void }> = ({
  option,
  onApply,
}) => (
  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold text-white">{option.title}</h4>
      <span className="text-xs text-white/60">{option.cost.toLocaleString('ru-RU')} кр.</span>
    </div>
    {option.description && <p className="text-xs text-white/60">{option.description}</p>}
    <button
      type="button"
      className="mt-auto rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.32em] text-white/70 hover:border-white/25 hover:bg-white/15"
      onClick={() => onApply(option)}
    >
      Улучшить
    </button>
  </div>
)

export const UpgradeStation: React.FC<UpgradeStationProps> = ({ interaction, onClose }) => {
  const handleApplyUpgrade = (option: UpgradeOption) => {
    console.log('🛠️ Применение улучшения', {
      optionId: option.id,
      itemId: option.itemId,
      pointId: interaction.pointId,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-white/70">{interaction.subtitle}</p>
        <p className="text-xs text-white/50 mt-1">{interaction.summary}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {interaction.options.map((option) => (
          <UpgradeCard key={option.id} option={option} onApply={handleApplyUpgrade} />
        ))}
      </div>

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

