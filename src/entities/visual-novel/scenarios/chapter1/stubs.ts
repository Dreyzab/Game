
import type { Scene } from '../../model/types'

export const stubScenes: Record<string, Scene> = {
    chapter1_day2_start: {
        id: 'chapter1_day2_start',
        background: '/images/backgrounds/station.png',
        music: '/music/ambience_station.mp3',
        dialogue: [
            {
                text: '[WIP] This scene (Day 2 Start) is under construction.',
                speaker: 'System'
            }
        ],
        characters: [],
        nextScene: 'chapter_1_summary'
    },
    schwabentor_arrival: {
        id: 'schwabentor_arrival',
        background: '/images/backgrounds/street_day.jpg',
        music: '/music/ambience_city.mp3',
        dialogue: [
            {
                text: '[WIP] Arrival at Schwabentor Gate. Scene pending.',
                speaker: 'System'
            }
        ],
        characters: [],
        nextScene: 'chapter_1_summary'
    },
    karapuz_square_meeting: {
        id: 'karapuz_square_meeting',
        background: '/images/backgrounds/street_day.jpg',
        music: '/music/ambience_city.mp3',
        dialogue: [
            {
                text: '[WIP] Meeting at Karapuz Square. Scene pending.',
                speaker: 'System'
            }
        ],
        characters: [],
        nextScene: 'chapter_1_summary'
    },
    university_campus_arrival: {
        id: 'university_campus_arrival',
        background: '/images/backgrounds/street_day.jpg',
        music: '/music/ambience_city.mp3',
        dialogue: [
            {
                text: '[WIP] Arrival at University Campus. Scene pending.',
                speaker: 'System'
            }
        ],
        characters: [],
        nextScene: 'chapter_1_summary'
    },
    chapter_1_summary: {
        id: 'chapter_1_summary',
        background: '/images/backgrounds/station.png',
        music: '/music/ambience_station.mp3',
        dialogue: [
            {
                text: '[WIP] Chapter 1 Summary/End. Integration pending.',
                speaker: 'System'
            }
        ],
        characters: [],
        choices: [
            { id: 'end_demo_choice', text: 'End Demo', nextScene: 'END' }
        ]
    }
}

