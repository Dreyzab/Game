import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { BUNKER_ROOMS, INITIAL_NPCS, INITIAL_RESOURCES, MOCK_PLAYERS } from '../model/constants'
import type { Crisis, NPC, Player, PlayerClass, Resources, Room, ScanResult } from '../model/types'
import { PLAYER_CLASS, ROOM_STATUS } from '../model/types'
import type { SurvivalState } from '@/shared/types/survival'
import { AlertBar } from './components/AlertBar'
import { BunkerVisualizer } from './components/BunkerVisualizer'
import { InfoPanel } from './components/InfoPanel'
import { ResourcePanel } from './components/ResourcePanel'
import { RoomActionPanel } from './components/RoomActionPanel'
import { RoomDetailPanel } from './components/RoomDetailPanel'
import { ScanResultModal } from './components/ScanResultModal'

function mapSurvivalRoleToPlayerClass(role: string | null): PlayerClass {
  switch (role) {
    case 'techie':
      return PLAYER_CLASS.ENGINEER
    case 'enforcer':
      return PLAYER_CLASS.SOLDIER
    case 'scout':
      return PLAYER_CLASS.SCAVENGER
    case 'face':
      return PLAYER_CLASS.MEDIC
    default:
      return PLAYER_CLASS.SCAVENGER
  }
}

function mapSessionToPlayers(session: SurvivalState | null): Player[] {
  if (!session) return MOCK_PLAYERS
  return Object.values(session.players).map((p) => ({
    id: `p${p.playerId}`,
    name: p.playerName,
    class: mapSurvivalRoleToPlayerClass(p.role),
    isInside: p.currentZone === null,
  }))
}

function mapSessionToNpcs(session: SurvivalState | null): NPC[] {
  if (!session || session.npcs.length === 0) return INITIAL_NPCS
  return session.npcs.map((npc) => ({
    id: npc.id,
    name: npc.name,
    role: `Cost ${npc.dailyCost}/day`,
    status: 'Active',
  }))
}

function mapSessionToInitialResources(session: SurvivalState | null): Resources {
  if (!session) return INITIAL_RESOURCES
  const morale = Math.min(100, Math.max(0, session.resources.morale))
  const hull = Math.min(100, Math.max(0, session.resources.defense * 10))
  return {
    ...INITIAL_RESOURCES,
    energy: morale,
    hull,
    rations: session.resources.food,
    fuel: session.resources.fuel,
    meds: session.resources.medicine,
    ammo: session.resources.defense * 10,
  }
}

export function SurvivalBunkerDashboard({ session, layout = 'full' }: { session?: SurvivalState | null; layout?: 'full' | 'map' }) {
  const [resources, setResources] = useState<Resources>(() => mapSessionToInitialResources(session ?? null))
  const [players, setPlayers] = useState<Player[]>(() => mapSessionToPlayers(session ?? null))
  const [npcs, setNpcs] = useState<NPC[]>(() => mapSessionToNpcs(session ?? null))
  const [rooms, setRooms] = useState<Room[]>(BUNKER_ROOMS)
  const [gameTime, setGameTime] = useState('18:42')

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const [crisis, setCrisis] = useState<Crisis>({
    active: false,
    title: '',
    type: 'system',
    timer: 0,
    requiredRoles: [],
    filledSlots: 0,
  })

  // Re-initialize from Survival session when sessionId changes
  useEffect(() => {
    setResources(mapSessionToInitialResources(session ?? null))
    setPlayers(mapSessionToPlayers(session ?? null))
    setNpcs(mapSessionToNpcs(session ?? null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionId])

  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime((prev) => {
        const [h, m] = prev.split(':').map(Number)
        let nm = m + 1
        let nh = h
        if (nm >= 60) {
          nm = 0
          nh = (nh + 1) % 24
        }
        return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`
      })

      if (Math.random() > 0.7) {
        setResources((prev) => ({
          ...prev,
          energy: Math.max(0, prev.energy - (Math.random() > 0.5 ? 1 : 0)),
          air: Math.max(0, prev.air - (Math.random() > 0.8 ? 1 : 0)),
        }))
      }

      if (!crisis.active && Math.random() > 0.98) {
        triggerCrisis()
      }

      if (crisis.active && crisis.timer > 0) {
        setCrisis((prev) => ({ ...prev, timer: prev.timer - 1 }))
      } else if (crisis.active && crisis.timer === 0) {
        if (crisis.title === 'RAIDER ATTACK') {
          setResources((prev) => ({
            ...prev,
            rations: Math.max(0, prev.rations - 5),
            hull: Math.max(0, prev.hull - 20),
          }))
          window.alert('RAID SUCCESSFUL! Raiders stole 5 rations and damaged hull.')
        }

        setCrisis((prev) => ({ ...prev, active: false }))
        setRooms((prev) => prev.map((r) => (r.status === ROOM_STATUS.CRITICAL ? { ...r, status: ROOM_STATUS.OK } : r)))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [crisis])

  const triggerCrisis = () => {
    const types = ['VENTILATION FAILURE', 'RAIDER ATTACK', 'HULL BREACH']
    const type = types[Math.floor(Math.random() * types.length)]

    setCrisis({
      active: true,
      title: type,
      type: 'system',
      timer: 60,
      requiredRoles: [],
      filledSlots: 0,
    })

    if (type === 'VENTILATION FAILURE') {
      setRooms((prev) => prev.map((r) => (r.id === 'workshop' ? { ...r, status: ROOM_STATUS.CRITICAL } : r)))
    }
  }

  const togglePlayerLocation = (id: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, isInside: !p.isInside } : p)))
  }

  const addResource = (type: keyof Resources) => {
    setResources((prev) => ({ ...prev, [type]: prev[type] + 1 }))
  }

  const handleRoomAction = (action: string, roomId: string) => {
    switch (action) {
      case 'repair':
        if (resources.parts >= 2) {
          setResources((prev) => ({ ...prev, parts: prev.parts - 2 }))
          setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, status: ROOM_STATUS.OK } : r)))
          const updatedRoom = rooms.find((r) => r.id === roomId)
          if (updatedRoom) setSelectedRoom({ ...updatedRoom, status: ROOM_STATUS.OK })
        } else {
          window.alert('Insufficient Parts! Need 2.')
        }
        break

      case 'boost_power':
        if (resources.fuel >= 1) {
          setResources((prev) => ({ ...prev, fuel: prev.fuel - 1, energy: Math.min(100, prev.energy + 25) }))
          window.alert('Generator boosted. Energy Output +25%')
        } else {
          window.alert('Insufficient Fuel! Need 1 Fuel Canister.')
        }
        break

      case 'harvest':
        if (resources.energy >= 5) {
          setResources((prev) => ({ ...prev, energy: prev.energy - 5, rations: prev.rations + 3 }))
          window.alert('Harvest complete. +3 Rations.')
        } else {
          window.alert('Insufficient Energy to power hydroponic lights!')
        }
        break

      case 'fabricate':
        if (resources.energy >= 15) {
          setResources((prev) => ({ ...prev, energy: prev.energy - 15, parts: prev.parts + 2 }))
          window.alert('Fabrication complete. +2 Parts.')
        } else {
          window.alert('Insufficient Energy for fabricator!')
        }
        break

      case 'synthesize':
        if (resources.energy >= 10) {
          setResources((prev) => ({ ...prev, energy: prev.energy - 10, meds: prev.meds + 1 }))
          window.alert('Synthesis complete. +1 Meds.')
        } else {
          window.alert('Insufficient Energy for centrifuge!')
        }
        break

      case 'purge_air':
        if (resources.energy >= 5) {
          setResources((prev) => ({ ...prev, energy: prev.energy - 5, air: Math.min(100, prev.air + 15) }))
          window.alert('Ventilation purge complete. Air quality restored.')
        } else {
          window.alert('Insufficient Energy for ventilation fans!')
        }
        break

      case 'scan':
        if (resources.energy >= 5) {
          setResources((prev) => ({ ...prev, energy: prev.energy - 5 }))

          const roll = Math.random()
          let result: ScanResult

          if (roll > 0.3) {
            const lootRoll = Math.random()
            let itemType = 'rations'
            let amount = 0

            if (lootRoll < 0.3) {
              itemType = 'rations'
              amount = Math.floor(Math.random() * 3) + 2
              setResources((prev) => ({ ...prev, rations: prev.rations + amount }))
            } else if (lootRoll < 0.6) {
              itemType = 'parts'
              amount = Math.floor(Math.random() * 2) + 1
              setResources((prev) => ({ ...prev, parts: prev.parts + amount }))
            } else if (lootRoll < 0.8) {
              itemType = 'fuel'
              amount = 1
              setResources((prev) => ({ ...prev, fuel: prev.fuel + amount }))
            } else if (lootRoll < 0.95) {
              itemType = 'ammo'
              amount = Math.floor(Math.random() * 5) + 2
              setResources((prev) => ({ ...prev, ammo: prev.ammo + amount }))
            } else {
              itemType = 'meds'
              amount = 1
              setResources((prev) => ({ ...prev, meds: prev.meds + amount }))
            }

            result = {
              found: true,
              message: `Sector scan complete. Recoverable resources identified at coordinates [${Math.floor(Math.random() * 99)}-${Math.floor(
                Math.random() * 99
              )}]. Recovery teams dispatched.`,
              items: [{ type: itemType, amount }],
            }
          } else {
            result = {
              found: false,
              message: 'Sector scan complete. No significant resource signatures or distress beacons detected in the immediate vicinity.',
              items: [],
            }
          }
          setScanResult(result)
        } else {
          window.alert('Insufficient Energy for radar array!')
        }
        break

      case 'defend_turrets':
        if (resources.ammo >= 5) {
          setResources((prev) => ({ ...prev, ammo: prev.ammo - 5 }))
          setCrisis((prev) => ({ ...prev, active: false }))
          window.alert('TURRETS ACTIVATED. Hostiles neutralized. Sector secure.')
        } else {
          window.alert('Insufficient Ammo! Need 5 rounds.')
        }
        break

      case 'defend_bribe':
        if (resources.rations >= 10) {
          setResources((prev) => ({ ...prev, rations: prev.rations - 10 }))
          setCrisis((prev) => ({ ...prev, active: false }))
          window.alert('TRIBUTE ACCEPTED. Raiders have withdrawn.')
        } else {
          window.alert('Insufficient Rations! Need 10 units.')
        }
        break

      default:
        console.log('Unknown action:', action)
        break
    }
  }

  const populationCount = useMemo(() => players.length + npcs.length, [players.length, npcs.length])

  if (layout === 'map') {
    return (
      <div className="h-screen w-screen bg-slate-950 overflow-hidden flex flex-col relative">
        <BunkerVisualizer rooms={rooms} players={players} isPowerOff={resources.energy <= 0} onRoomSelect={setSelectedRoom} />
        {selectedRoom && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex-none flex items-center justify-between p-4 border-b border-slate-800">
                <h2 className="text-xl font-bold uppercase tracking-wider text-cyan-500">{selectedRoom.name}</h2>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <ArrowLeft size={24} />
                </button>
              </div>
              <div className="grow overflow-y-auto grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-64 md:h-auto">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${selectedRoom.imgUrl}')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                </div>
                <div className="p-6 flex flex-col gap-6">
                  <RoomDetailPanel room={selectedRoom} players={players.filter((p) => p.isInside)} />
                  <RoomActionPanel room={selectedRoom} crisis={crisis} onAction={handleRoomAction} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans flex flex-col select-none relative">
      <div className="flex-none">
        <AlertBar crisis={crisis} />
      </div>

      <div className="grow grid grid-cols-12 h-full overflow-hidden relative">
        {scanResult && <ScanResultModal result={scanResult} onClose={() => setScanResult(null)} />}

        {selectedRoom ? (
          <>
            <div className="col-span-3 lg:col-span-3 h-full animate-in slide-in-from-left duration-500">
              <RoomActionPanel room={selectedRoom} crisis={crisis} onAction={handleRoomAction} />
            </div>

            <div className="col-span-6 lg:col-span-6 h-full relative bg-black overflow-hidden group">
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 hover:scale-105"
                style={{ backgroundImage: `url('${selectedRoom.imgUrl}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 pointer-events-none" />

              <button
                onClick={() => setSelectedRoom(null)}
                className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-slate-900/80 text-white px-4 py-2 rounded-full backdrop-blur-md hover:bg-slate-800 transition-colors border border-slate-700 group-hover:border-cyan-500/50"
              >
                <ArrowLeft size={16} />
                <span className="text-sm font-bold font-mono uppercase">Return to Bunker</span>
              </button>
            </div>

            <div className="col-span-3 lg:col-span-3 h-full animate-in slide-in-from-right duration-500">
              <RoomDetailPanel room={selectedRoom} players={players.filter((p) => p.isInside)} />
            </div>
          </>
        ) : (
          <>
            <div className="col-span-3 lg:col-span-2 h-full border-r border-slate-800">
              <ResourcePanel resources={resources} />
            </div>

            <div className="col-span-6 lg:col-span-7 h-full relative">
              <BunkerVisualizer rooms={rooms} players={players} isPowerOff={resources.energy <= 0} onRoomSelect={setSelectedRoom} />

              <div className="absolute bottom-2 right-2 opacity-20 hover:opacity-100 transition-opacity bg-black p-2 rounded z-50 text-[10px]">
                <div className="font-bold mb-1">DEV CONTROLS</div>
                <button onClick={triggerCrisis} className="bg-red-900 px-2 py-1 rounded mr-1">
                  Trigger Crisis
                </button>
                <button onClick={() => addResource('rations')} className="bg-green-900 px-2 py-1 rounded mr-1">
                  Add Ration
                </button>
                <button onClick={() => togglePlayerLocation('p3')} className="bg-blue-900 px-2 py-1 rounded">
                  Move Doc
                </button>
              </div>
            </div>

            <div className="col-span-3 lg:col-span-3 h-full border-l border-slate-800">
              <InfoPanel populationCount={populationCount} npcs={npcs} weather={{ condition: 'Acid Rain', temp: 12 }} gameTime={gameTime} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
