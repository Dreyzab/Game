export const ROOM_STATUS = {
  OK: 'OK',
  BROKEN: 'BROKEN',
  CRITICAL: 'CRITICAL', // Fire or Intrusion
} as const

export type RoomStatus = (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS]

export const PLAYER_CLASS = {
  ENGINEER: 'ENGINEER',
  SOLDIER: 'SOLDIER',
  MEDIC: 'MEDIC',
  SCAVENGER: 'SCAVENGER',
} as const

export type PlayerClass = (typeof PLAYER_CLASS)[keyof typeof PLAYER_CLASS]

export interface Player {
  id: string
  name: string
  class: PlayerClass
  isInside: boolean // True = in Lobby/Room, False = Outside
}

export interface Resources {
  energy: number // 0-100
  air: number // 0-100
  hull: number // 0-100
  rations: number
  meds: number
  parts: number
  fuel: number
  ammo: number
}

export interface NPC {
  id: string
  name: string
  role: string
  status: 'Active' | 'Sick' | 'Injured' | 'Resting'
  isPet?: boolean
}

export interface Crisis {
  active: boolean
  title: string
  type: 'system' | 'raid' | 'biohazard'
  timer: number // seconds
  requiredRoles: PlayerClass[]
  filledSlots: number
}

export interface Room {
  id: string
  name: string
  status: RoomStatus
  top: number | string // Percentage or px
  left: number | string // Percentage or px
  imgUrl: string
}

export interface Weather {
  condition: 'Clear' | 'Acid Rain' | 'Fog' | 'Radiation Storm'
  temp: number
}

export interface ScanResult {
  found: boolean
  message: string
  items: { type: string; amount: number }[]
}
