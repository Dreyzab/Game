import React from 'react'
import { motion } from 'framer-motion'
import { CoopInventoryView } from '@/features/coop/inventory'
import type { CoopCampState, CoopRoleId } from '@/shared/types/coop'

export interface InventoryTabProps {
  controlledRole: CoopRoleId
  camp: CoopCampState | null
  withdrawCampItem: (templateId: string, quantity?: number) => Promise<void>
  contributeItem: (templateId: string, quantity: number) => Promise<void>
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ controlledRole, camp, withdrawCampItem, contributeItem }) => {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <CoopInventoryView
        controlledRole={controlledRole}
        camp={camp}
        withdrawCampItem={withdrawCampItem}
        contributeItem={contributeItem}
      />
    </motion.div>
  )
}

