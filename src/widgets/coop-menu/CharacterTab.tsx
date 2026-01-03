import React from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { COOP_CHARACTERS } from '@/features/coop'
import { COOP_ROLES } from '@/shared/types/coop'
import type { CoopRoleId } from '@/shared/types/coop'

export interface CharacterTabProps {
  controlledRole: CoopRoleId
}

export const CharacterTab: React.FC<CharacterTabProps> = ({ controlledRole }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Profile Card */}
      <div className="flex flex-col sm:flex-row gap-6 p-1 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="w-full sm:w-48 h-64 sm:h-auto overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <img
            src={COOP_CHARACTERS.find((c) => c.id === controlledRole)?.portraitUrl}
            className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
            alt="Portrait"
          />
        </div>
        <div className="flex-1 p-4 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-2xl font-cinzel font-bold text-white tracking-wide">
              {COOP_ROLES[controlledRole]?.nameRu ?? controlledRole}
            </h3>
            <span className="px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold tracking-widest uppercase">
              {COOP_ROLES[controlledRole]?.label}
            </span>
          </div>
          <p className="text-sm text-cyan-400/80 italic font-medium mb-4">
            {COOP_CHARACTERS.find((c) => c.id === controlledRole)?.subtitle}
          </p>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <p className="text-xs text-slate-300 leading-relaxed italic">
                {COOP_CHARACTERS.find((c) => c.id === controlledRole)?.backstory ||
                  COOP_ROLES[controlledRole]?.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Modifiers / Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(
          COOP_CHARACTERS.find((c) => c.id === controlledRole)?.voiceModifiers || {}
        ).map(([voiceId, mod]) => (
          <div
            key={voiceId}
            className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center group hover:border-cyan-500/30 transition-colors"
          >
            <span className="text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-cyan-400 transition-colors">
              {voiceId}
            </span>
            <span className="text-lg font-mono font-bold text-white">
              +{Math.round(((mod as number) - 1) * 100)}%
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex gap-4">
        <Info className="text-cyan-400 shrink-0" size={20} />
        <p className="text-xs text-slate-300 leading-relaxed">
          <span className="text-cyan-400 font-bold">Стиль игры:</span>{' '}
          {COOP_ROLES[controlledRole]?.playstyleHint}
        </p>
      </div>
    </motion.div>
  )
}

