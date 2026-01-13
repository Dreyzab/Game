import { type NPC, type Player, PLAYER_CLASS, type Resources, type Room, ROOM_STATUS } from './types'

export const BUNKER_BG_URL = '/images/bunker.png'

export const INITIAL_RESOURCES: Resources = {
  energy: 85,
  air: 92,
  hull: 100,
  rations: 12,
  meds: 4,
  parts: 7,
  fuel: 3,
  ammo: 25,
}

export const INITIAL_NPCS: NPC[] = [
  { id: '1', name: 'Sarah J.', role: 'Mechanic', status: 'Active' },
  { id: '2', name: 'Dr. Aris', role: 'Doctor', status: 'Resting' },
  { id: '3', name: 'Rex', role: 'Security', status: 'Active', isPet: true },
  { id: '4', name: 'Old Tom', role: 'Civilian', status: 'Sick' },
]

export const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: 'Cmdr. Shepard', class: PLAYER_CLASS.SOLDIER, isInside: true },
  { id: 'p2', name: 'Fixit Felix', class: PLAYER_CLASS.ENGINEER, isInside: true },
  { id: 'p3', name: 'Doc Holliday', class: PLAYER_CLASS.MEDIC, isInside: false }, // Outside
  { id: 'p4', name: 'Stalker', class: PLAYER_CLASS.SCAVENGER, isInside: false }, // Outside
]

export const BUNKER_ROOMS: Room[] = [
  {
    id: 'monitoring',
    name: 'Monitoring',
    status: ROOM_STATUS.OK,
    top: '274px',
    left: '205px',
    imgUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'medbay',
    name: 'Medbay / Lab',
    status: ROOM_STATUS.OK,
    top: '281px',
    left: '452px',
    imgUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
  },
  {
    id: 'garden',
    name: 'Hydroponics',
    status: ROOM_STATUS.OK,
    top: 45,
    left: 50,
    imgUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'workshop',
    name: 'Workshop',
    status: ROOM_STATUS.BROKEN,
    top: '474px',
    left: '189px',
    imgUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'generator',
    name: 'Main Reactor',
    status: ROOM_STATUS.OK,
    top: '695px',
    left: '297px',
    imgUrl: 'https://images.unsplash.com/photo-1565514020125-9f5a7a72d952?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'quarters',
    name: 'Living Qtrs',
    status: ROOM_STATUS.OK,
    top: '595px',
    left: '347px',
    imgUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop',
  },
]

export const THREAT_DATA = [
  { time: '12:00', threat: 20 },
  { time: '13:00', threat: 25 },
  { time: '14:00', threat: 40 },
  { time: '15:00', threat: 30 },
  { time: '16:00', threat: 65 },
  { time: '17:00', threat: 85 }, // High threat now
  { time: '18:00', threat: 90 },
]
