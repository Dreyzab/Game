import React from 'react'
import type { TrainingInteraction, TrainingSkill } from '../../model/mapPointInteractions'

interface TrainingModalProps {
  interaction: TrainingInteraction
  onClose?: () => void
}

const TrainingSkillRow: React.FC<{ skill: TrainingSkill; onStart: (skill: TrainingSkill) => void }> = ({
  skill,
  onStart,
}) => (
  <div className="flex flex-col rounded-2xl border border-white/15 bg-white/5 p-3 gap-2 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-sm font-semibold text-white/80">{skill.name}</p>
      {skill.description && <p className="text-xs text-white/55 mt-1">{skill.description}</p>}
    </div>
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/60">{skill.cost.toLocaleString('ru-RU')} кр.</span>
      <button
        type="button"
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.28em] text-white/70 hover:border-white/25 hover:bg-white/15"
        onClick={() => onStart(skill)}
      >
        Тренироваться
      </button>
    </div>
  </div>
)

export const TrainingModal: React.FC<TrainingModalProps> = ({ interaction, onClose }) => {
  const handleStartTraining = (skill: TrainingSkill) => {
    console.log('🏋️ Запуск тренировки', {
      skillId: skill.id,
      trainerId: interaction.trainerId,
      pointId: interaction.pointId,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-white/70">{interaction.subtitle}</p>
        <p className="text-xs text-white/50 mt-1">{interaction.summary}</p>
      </div>

      <div className="flex flex-col gap-3">
        {interaction.skills.map((skill) => (
          <TrainingSkillRow key={skill.id} skill={skill} onStart={handleStartTraining} />
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

export default TrainingModal

