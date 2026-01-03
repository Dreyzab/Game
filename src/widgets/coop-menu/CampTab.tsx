import React from 'react'
import { motion } from 'framer-motion'
import { Shield, ShoppingCart, Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'
import type { CoopCampState } from '@/shared/types/coop'

export interface CampTabProps {
  camp: CoopCampState
  expedition: any | null
  campShop: any | null
  shopSelectedTemplateId: string
  onSelectShopTemplateId: (templateId: string) => void
  callReinforcements: (count?: number) => Promise<void>
  buyCampItem: (templateId: string, quantity?: number) => Promise<void>
}

export const CampTab: React.FC<CampTabProps> = ({
  camp,
  expedition,
  campShop,
  shopSelectedTemplateId,
  onSelectShopTemplateId,
  callReinforcements,
  buyCampItem,
}) => {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      {/* Camp Status Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2">
          <Shield className="text-cyan-400" size={20} />
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Защита</span>
          <span className="text-xl font-mono font-bold text-white">{Number(camp.security ?? 0)}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2">
          <Users className="text-amber-400" size={20} />
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Люди</span>
          <span className="text-xl font-mono font-bold text-white">{Number(camp.operatives ?? 0)}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-[10px] font-bold text-cyan-400">
            R
          </div>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">{expedition ? 'RP' : 'Scrap'}</span>
          <span className="text-xl font-mono font-bold text-white">
            {expedition ? Number(expedition.researchPoints ?? 0) : Number((camp as any)?.inventory?.scrap ?? 0)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-emerald-500 rounded-full" />
          <h4 className="text-sm font-cinzel font-bold tracking-widest uppercase text-white">Управление ресурсами</h4>
        </div>
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Users size={18} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-white mb-1">Вызов подкрепления</div>
              <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                Увеличивает количество оперативников в лагере, что критически важно для защиты и разведки.
              </p>
              <button
                onClick={() => callReinforcements(1).catch(() => {})}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all"
              >
                Запросить команду (-25 {expedition ? 'RP' : 'scrap'})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Section */}
      {campShop?.stock?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-purple-500 rounded-full" />
            <h4 className="text-sm font-cinzel font-bold tracking-widest uppercase text-white">Снабжение лагеря</h4>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-5">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <ShoppingCart size={12} />
                <span>Доступные товары</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {campShop.stock.map((it: any) => {
                  const templateId = String(it.templateId ?? '')
                  const template = ITEM_TEMPLATES[templateId]

                  return (
                    <button
                      key={templateId}
                      onClick={() => onSelectShopTemplateId(templateId)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                        shopSelectedTemplateId === templateId
                          ? 'bg-purple-500/20 border-purple-500/40'
                          : 'bg-black/20 border-white/10 hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{template?.icon || '📦'}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{template?.name ?? it.name ?? templateId}</div>
                          <div className="text-[10px] text-slate-500">{template?.kind || 'Предмет'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/10">
                        <span className="text-[10px] font-mono font-bold text-white">{it.price}</span>
                        <span className="text-[9px] text-slate-500 uppercase">{expedition ? 'RP' : 'SCR'}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={() => buyCampItem(shopSelectedTemplateId, 1).catch(() => {})}
              disabled={!shopSelectedTemplateId}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-400 text-xs font-bold transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
            >
              <ShoppingCart size={14} />
              <span>Подтвердить закупку</span>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
