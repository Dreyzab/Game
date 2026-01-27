import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DetectivePointState } from '@/features/detective/map/types'

export type DossierEntryType = 'profile' | 'location' | 'intel' | 'clue'

export interface DossierEntry {
  id: string
  type: DossierEntryType
  title: string
  description: string
  image?: string
  unlockedAt: number
  isRead: boolean
}

export interface EvidenceItem {
  id: string
  label: string
  description: string
  icon?: string
  source: string // Where it was found
  timestamp: number
}

interface DossierState {
  entries: DossierEntry[]
  evidence: EvidenceItem[]
  pointStates: Record<string, DetectivePointState> // Map of point ID to state
  flags: Record<string, boolean> // Investigation progress flags
  detectiveName: string | null
  isOpen: boolean

  // Actions
  setDetectiveName: (name: string) => void
  addEntry: (entry: Omit<DossierEntry, 'unlockedAt' | 'isRead'>) => void
  addEvidence: (item: Omit<EvidenceItem, 'timestamp'>) => void
  setPointState: (pointId: string, state: DetectivePointState) => void
  unlockPoint: (pointId: string) => void // Legacy/Convenience: sets to 'discovered' if not already higher
  setFlag: (flag: string, value: boolean) => void
  addFlags: (flags: Record<string, boolean | number>) => void
  markAsRead: (entryId: string) => void
  toggleOpen: () => void
  setOpen: (isOpen: boolean) => void

  // Reset for new case or debug
  resetDossier: () => void
}

type DossierDataState = Pick<
  DossierState,
  'entries' | 'evidence' | 'pointStates' | 'flags' | 'detectiveName' | 'isOpen'
>

const initialState: DossierDataState = {
  entries: [],
  evidence: [],
  pointStates: {
    'bureau_office': 'discovered',
    'hauptbahnhof': 'discovered',
    // Others are locked by default in code logic if not present, but valid to be explicit
    'munsterplatz_bank': 'locked',
    'ganter_brauerei': 'locked',
    'rathaus_archiv': 'locked',
    'basler_hof': 'locked',
    'stuhlinger_warehouse': 'locked'
  },
  flags: {},
  detectiveName: null,
  isOpen: false
}

export const useDossierStore = create<DossierState>()(
  persist(
    (set) => ({
      ...initialState,

      addEntry: (entry) => set((state) => {
        if (state.entries.some(e => e.id === entry.id)) return {}
        return {
          entries: [
            { ...entry, unlockedAt: Date.now(), isRead: false },
            ...state.entries
          ]
        }
      }),

      addEvidence: (item) => set((state) => {
        if (state.evidence.some(e => e.id === item.id)) return {}
        return {
          evidence: [
            { ...item, timestamp: Date.now() },
            ...state.evidence
          ]
        }
      }),

      setPointState: (pointId, pointState) => set((state) => ({
        pointStates: { ...state.pointStates, [pointId]: pointState }
      })),

      unlockPoint: (pointId) => set((state) => {
        // Only set to discovered if it's currently locked or undefined.
        // Don't downgrade 'active' or 'cleared'.
        const current = state.pointStates[pointId]
        if (current && current !== 'locked') return {}
        return {
          pointStates: { ...state.pointStates, [pointId]: 'discovered' }
        }
      }),

      setFlag: (flag, value) => set((state) => ({
        flags: { ...state.flags, [flag]: !!value } // Ensure boolean if treating as flag
      })),

      addFlags: (flags) => set((state) => ({
        flags: { ...state.flags, ...Object.fromEntries(Object.entries(flags).map(([k, v]) => [k, !!v])) }
      })),

      setDetectiveName: (name) => set({ detectiveName: name }),

      markAsRead: (entryId) => set((state) => ({
        entries: state.entries.map(e =>
          e.id === entryId ? { ...e, isRead: true } : e
        )
      })),

      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (isOpen) => set({ isOpen }),

      resetDossier: () => set({ ...initialState })
    }),
    {
      name: 'detective-dossier', // storage key
      storage: createJSONStorage(() => localStorage),
      // Don't persist UI state like 'isOpen' if preferred, but here we persist everything for simplicity
      // partialize: (state) => ({ ...state, isOpen: false }), 
    }
  )
)
