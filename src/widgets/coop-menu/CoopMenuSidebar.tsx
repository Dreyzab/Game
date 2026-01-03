import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Package, Tent, User, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils/cn'
import type { CoopCampState, CoopRoleId } from '@/shared/types/coop'
import { CampTab } from './CampTab'
import { CharacterTab } from './CharacterTab'
import { InventoryTab } from './InventoryTab'

export type CoopMenuTab = 'character' | 'inventory' | 'camp'

export interface CoopMenuSidebarProps {
  isOpen: boolean
  onClose: () => void

  activeTab: CoopMenuTab
  onTabChange: (tab: CoopMenuTab) => void

  controlledRole?: CoopRoleId
  camp: CoopCampState | null
  expedition: any | null

  campShop: any | null
  shopSelectedTemplateId: string
  onSelectShopTemplateId: (templateId: string) => void

  callReinforcements: (count?: number) => Promise<void>
  buyCampItem: (templateId: string, quantity?: number) => Promise<void>
  withdrawCampItem: (templateId: string, quantity?: number) => Promise<void>
  contributeItem: (templateId: string, quantity: number) => Promise<void>
}

export const CoopMenuSidebar: React.FC<CoopMenuSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  controlledRole,
  camp,
  expedition,
  campShop,
  shopSelectedTemplateId,
  onSelectShopTemplateId,
  callReinforcements,
  buyCampItem,
  withdrawCampItem,
  contributeItem,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          <motion.div
            className="relative w-full max-w-2xl h-[85vh] max-h-[700px] flex flex-col rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header & Tabs */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 bg-white/5">
              <div className="flex gap-4">
                <button
                  onClick={() => onTabChange('character')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                    activeTab === 'character'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  )}
                >
                  <User size={18} />
                  <span className="text-sm font-cinzel font-bold tracking-wider uppercase">Досье</span>
                </button>
                <button
                  onClick={() => onTabChange('inventory')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                    activeTab === 'inventory'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  )}
                >
                  <Package size={18} />
                  <span className="text-sm font-cinzel font-bold tracking-wider uppercase">Вещи</span>
                </button>
                {camp && (
                  <button
                    onClick={() => onTabChange('camp')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                      activeTab === 'camp'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    )}
                  >
                    <Tent size={18} />
                    <span className="text-sm font-cinzel font-bold tracking-wider uppercase">Лагерь</span>
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {activeTab === 'character' && controlledRole && <CharacterTab controlledRole={controlledRole} />}

              {activeTab === 'inventory' && controlledRole && (
                <InventoryTab
                  controlledRole={controlledRole}
                  camp={camp}
                  withdrawCampItem={withdrawCampItem}
                  contributeItem={contributeItem}
                />
              )}

              {activeTab === 'camp' && camp && (
                <CampTab
                  camp={camp}
                  expedition={expedition}
                  campShop={campShop}
                  shopSelectedTemplateId={shopSelectedTemplateId}
                  onSelectShopTemplateId={onSelectShopTemplateId}
                  callReinforcements={callReinforcements}
                  buyCampItem={buyCampItem}
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-cinzel font-bold tracking-widest uppercase text-slate-300 transition-all"
              >
                Вернуться в игру
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
