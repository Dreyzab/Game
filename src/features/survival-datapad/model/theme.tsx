import type { ReactNode } from 'react'
import { Cpu, Crosshair, Eye, Shield, Users } from 'lucide-react'
import type { PlayerRole } from '@/shared/types/survival'

export interface DatapadRoleTheme {
  id: PlayerRole
  name: string
  color: string
  pingBgColor: string
  borderColor: string
  bgColor: string
  icon: ReactNode
  bonus: string
}

export const DATAPAD_ROLE_THEMES: Record<PlayerRole, DatapadRoleTheme> = {
  enforcer: {
    id: 'enforcer',
    name: 'ENFORCER',
    color: 'text-red-400',
    pingBgColor: 'bg-red-400',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-950',
    icon: <Crosshair size={48} />,
    bonus: 'COMBAT: Starts with a pistol',
  },
  scout: {
    id: 'scout',
    name: 'SCOUT',
    color: 'text-gray-200',
    pingBgColor: 'bg-gray-200',
    borderColor: 'border-gray-200',
    bgColor: 'bg-gray-800',
    icon: <Eye size={48} />,
    bonus: 'RECON: Reveals danger & loot preview',
  },
  techie: {
    id: 'techie',
    name: 'TECHIE',
    color: 'text-amber-400',
    pingBgColor: 'bg-amber-400',
    borderColor: 'border-amber-500',
    bgColor: 'bg-amber-950',
    icon: <Cpu size={48} />,
    bonus: 'TECH: Better outcomes on tech options',
  },
  face: {
    id: 'face',
    name: 'FACE',
    color: 'text-cyan-300',
    pingBgColor: 'bg-cyan-300',
    borderColor: 'border-cyan-400',
    bgColor: 'bg-cyan-950',
    icon: <Users size={48} />,
    bonus: 'SOCIAL: Better outcomes with NPCs',
  },
}

export const DATAPAD_FALLBACK_THEME: Omit<DatapadRoleTheme, 'id'> = {
  name: 'UNASSIGNED',
  color: 'text-gray-300',
  pingBgColor: 'bg-gray-500',
  borderColor: 'border-gray-600',
  bgColor: 'bg-gray-900',
  icon: <Shield size={48} />,
  bonus: 'Awaiting role assignment',
}
