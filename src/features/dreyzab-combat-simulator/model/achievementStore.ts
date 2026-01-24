import type { Achievement } from '@/entities/dreyzab-combat-simulator/model/types'

const ACHIEVEMENTS_STORAGE_KEY = 'dreyzab_achievements'

const INITIAL_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_win',
        title: 'First Drop',
        description: 'Complete your first successful mission.',
        icon: 'Ç?YZÇ©',
        unlocked: false,
    },
    {
        id: 'no_damage',
        title: 'Untouchable',
        description: 'Win a battle without taking any damage.',
        icon: 'Ç?Y>¶ðƒ?ûÇú?',
        unlocked: false,
    },
    {
        id: 'tactical_genius',
        title: 'Tactical Genius',
        description: 'Perform 3 attacks in a single turn.',
        icon: 'Ç?YÇæÇ¨',
        unlocked: false,
    },
    {
        id: 'survivor',
        title: 'Last Breath',
        description: 'Win a battle with less than 10% HP remaining.',
        icon: 'Ç?Y¶÷Çú',
        unlocked: false,
    },
    {
        id: 'scorpion_slayer',
        title: 'Scorpion Slayer',
        description: 'Neutralize a Rail Scorpion.',
        icon: "Ç?YÇ?'",
        unlocked: false,
    },
]

export const readAchievements = (): Achievement[] => {
    const saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY)
    if (!saved) return INITIAL_ACHIEVEMENTS
    try {
        const parsed = JSON.parse(saved) as unknown
        if (!Array.isArray(parsed)) return INITIAL_ACHIEVEMENTS
        return parsed as Achievement[]
    } catch {
        return INITIAL_ACHIEVEMENTS
    }
}

export const writeAchievements = (value: Achievement[]) => {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(value))
}
