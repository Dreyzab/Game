
import type { Scene } from '../../model/types'

export const spiderMissionScenes: Record<string, Scene> = {
    // =====================================
    // HACKING SCENE (VENTILATION)
    // =====================================
    hacking_sequence: {
        id: 'hacking_sequence',
        background: '/images/backgrounds/hacking_terminal.jpg', // Placeholder
        characters: [],
        dialogue: [
            {
                speaker: 'Рассказчик',
                text: 'Ты бросаешься к клавиатуре. Пальцы летают по клавишам.',
            },
            {
                speaker: 'СИСТЕМА',
                text: 'ВЗЛОМ: СЛОЖНОСТЬ ВЫСОКАЯ.',
            },
            {
                speaker: 'Рассказчик',
                text: 'Код бежит перед глазами. Ты ищешь уязвимость. Вот она! Обходной путь через систему вентиляции.',
            },
        ],
        choices: [
            {
                id: 'hack_cancel_command',
                text: 'Ввести команду отмены.',
                nextScene: 'hacking_success',
                availability: {
                    skillCheck: {
                        skill: 'logic',
                        difficulty: 4, // Medium difficulty
                        successText: 'ДОСТУП РАЗРЕШЕН.',
                        failureText: 'СИСТЕМА: ОШИБКА ДОСТУПА. (Но по сюжету мы должны пройти)',
                    },
                },
                effects: {
                    xp: 20,
                },
            },
        ],
    },

    hacking_success: {
        id: 'hacking_success',
        background: '/images/backgrounds/hacking_terminal.jpg',
        characters: [],
        dialogue: [
            {
                speaker: 'СИСТЕМА',
                text: 'ДОСТУП РАЗРЕШЕН.',
            },
            {
                speaker: 'Рассказчик',
                text: 'Газ перестает поступать. Вентиляторы начинают гудеть, вытягивая отраву. Дверь щелкает и открывается.',
            },
            {
                speaker: 'Флешка',
                text: '"ЗАГРУЗКА ЗАВЕРШЕНА".',
            },
            {
                speaker: 'Рассказчик',
                text: 'Ты выдергиваешь её и выбегаешь из комнаты, пока система не передумала.',
            },
        ],
        choices: [
            {
                id: 'hacking_escape',
                text: 'Бежать на поверхность.',
                nextScene: 'rico_flash_drive_handover',
                effects: {
                    immediate: [
                        { type: 'item', data: { itemId: 'spider_flash_drive', amount: 1 } },
                    ],
                },
            },
        ],
    },

    // =====================================
    // MEETING RICO (SURFACE)
    // =====================================
    rico_flash_drive_handover: {
        id: 'rico_flash_drive_handover',
        background: '/images/backgrounds/freiburg_night_street.jpg',
        characters: [
            {
                id: 'bruno', // Still using Bruno internally as per previous rename, or maybe Rico/Bruno alias
                name: 'Рико', // User script calls him Rico here, keeping user's text
                position: 'center',
                sprite: '/images/characters/rico.png',
                emotion: { primary: 'happy', intensity: 80 },
            },
        ],
        dialogue: [
            {
                speaker: 'Рассказчик',
                text: 'На поверхности ты находишь Рико в условленном месте. Он нервно курит.',
            },
            {
                speaker: 'Рико',
                characterId: 'bruno',
                text: '— Живой! — он сияет. — Принес?',
            },
            {
                speaker: 'Рассказчик',
                text: 'Ты кидаешь ему флешку.',
            },
            {
                speaker: 'Вы',
                text: '— Держи. И больше я в канализацию ни ногой.',
            },
            {
                speaker: 'Рико',
                characterId: 'bruno',
                text: '— Договорились. — Он прячет флешку. — Ладно, долг платежом красен. Я сказал про тебя Пауку. Он ждет тебя завтра утром. В Мэрии. Иди к боковому входу, скажи пароль "Серый Кардинал".',
            },
            {
                speaker: 'Рассказчик',
                text: 'КВЕСТ ЗАВЕРШЕН: "Глаза Паука" (Часть 1). Награда: Рекомендация к Пауку. Репутация: Анархисты (Доверие).',
            },
            {
                speaker: 'Рассказчик',
                text: 'Ты идешь спать. Этот день был долгим.',
            },
        ],
        choices: [
            {
                id: 'sleep_to_day_3',
                text: 'Перейти к третьему дню.',
                nextScene: 'day_3_city_hall_arrival',
                effects: {
                    removeFlags: ['spider_flash_drive'],
                    addFlags: ['know_spider_password', 'completed_spiders_eyes_part1', 'day_3_started'],
                    immediate: [
                        { type: 'quest', data: { questId: 'spiders_eyes', action: 'complete' } },
                        { type: 'reputation', data: { factionId: 'anarchists', amount: 10 } }
                    ],
                },
            },
        ],
    },

    // =====================================
    // DAY 3: CITY HALL
    // =====================================
    day_3_city_hall_arrival: {
        id: 'day_3_city_hall_arrival',
        background: '/images/backgrounds/freiburg_city_hall.jpg',
        characters: [],
        dialogue: [
            {
                speaker: 'Рассказчик',
                text: 'ДЕНЬ ТРЕТИЙ: МЭРИЯ. Ты стоишь у бокового входа в Мэрию. Массивное здание, охраняемое FJR.',
            },
            {
                speaker: 'Охранник',
                text: '— Пароль?',
            },
        ],
        choices: [
            {
                id: 'give_password_gray_cardinal',
                text: '"Серый Кардинал".',
                nextScene: 'spider_meeting',
                availability: {
                    condition: { flag: 'know_spider_password' }
                },
            },
            {
                id: 'leave_city_hall',
                text: 'Уйти (Нет пароля).',
                nextScene: 'exit_to_map',
            },
        ],
    },

    spider_meeting: {
        id: 'spider_meeting',
        background: '/images/backgrounds/spider_office.jpg',
        characters: [
            {
                id: 'spider',
                name: 'Паук',
                position: 'center',
                sprite: '/images/characters/spider.png', // Placeholder
                emotion: { primary: 'neutral', intensity: 80 },
            },
        ],
        dialogue: [
            {
                speaker: 'Охранник',
                text: 'Он кивает и пропускает тебя.',
            },
            {
                speaker: 'Рассказчик',
                text: 'Ты идешь по длинным коридорам. Наконец, тебя заводят в кабинет без окон. За столом сидит человек в дорогом костюме. Его лицо ничего не выражает. Это Паук.',
            },
            {
                speaker: 'Паук',
                characterId: 'spider',
                text: '— Наслышан о тебе, — говорит он тихо. — Рико хвалил. Дитер хвалил. Даже Шмидт отметил. Ты быстро заводишь друзей.',
            },
            {
                speaker: 'Паук',
                characterId: 'spider',
                text: '— Мне нужны такие люди. Умные. Смелые. И... без лишних вопросов. У меня есть для тебя работа. Найдешь для меня одного человека — получишь доступ к любой информации в городе. Включая досье на твоего профессора Крюгера.',
            },
        ],
        choices: [
            {
                id: 'spider_ask_who',
                text: '"Кого нужно найти?"',
                nextScene: 'spider_task_details',
            },
            {
                id: 'spider_i_work_for_myself',
                text: '"Я работаю на себя. Что за человек?"',
                nextScene: 'spider_task_details_independent',
            },
            {
                id: 'spider_ask_krueger',
                text: '"А что не так с Крюгером?"',
                nextScene: 'spider_task_details',
            },
        ],
    },

    spider_task_details_independent: {
        id: 'spider_task_details_independent',
        background: '/images/backgrounds/spider_office.jpg',
        characters: [
            {
                id: 'spider',
                name: 'Паук',
                position: 'center',
                sprite: '/images/characters/spider.png',
                emotion: { primary: 'amused', intensity: 40 },
            },
        ],
        dialogue: [
            {
                speaker: 'Вы',
                text: '— Я работаю на себя, — отвечаешь ты осторожно. — Что за человек?',
            },
            {
                speaker: 'Паук',
                characterId: 'spider',
                text: 'Паук едва заметно улыбается.',
            },
            {
                speaker: 'Паук',
                characterId: 'spider',
                text: '— Это правильно. Независимость — ценный ресурс.',
            },
            {
                speaker: 'Паук',
                characterId: 'spider',
                text: '— Человек... скажем так, бывший сотрудник. Он украл кое-что важное. Не деньги. Информацию. О проекте "Заслон". Он скрывается где-то в районе Старых Доков. Найди его. Живым.',
            },
            {
                speaker: 'Рассказчик',
                text: 'Он протягивает папку.',
            },
            {
                speaker: 'Паук',
                characterId: 'spider',
                text: '— Здесь всё, что мы знаем.',
            },
            {
                speaker: 'Рассказчик',
                text: 'КВЕСТ ПОЛУЧЕН: "Беглец". Цель: Найти беглеца в Доках. Награда: Досье на Крюгера, доступ к ресурсам Мэрии.',
            },
            {
                speaker: 'Рассказчик',
                text: 'Ты выходишь из Мэрии. Город кажется другим. Ты больше не беженец. Ты — игрок.',
            },
            {
                speaker: 'СИСТЕМА',
                text: 'КОНЕЦ ВВОДНОЙ ЧАСТИ. Дальше — открытый мир и большая политика Фрайбурга.',
            },
        ],
        choices: [
            {
                id: 'end_intro',
                text: 'Завершить вводную часть.',
                nextScene: 'chapter_1_summary', // Or trigger a summary/credits
                effects: {
                    immediate: [
                        { type: 'quest', data: { questId: 'the_fugitive', action: 'start' } },
                        { type: 'open_map' } // Or open quest log
                    ],
                },
            },
        ],
    },

    // Need to alias the other choices to the same result for now or add their variations
    spider_task_details: {
        id: 'spider_task_details',
        background: '/images/backgrounds/spider_office.jpg',
        characters: [
            {
                id: 'spider',
                name: 'Паук',
                position: 'center',
                sprite: '/images/characters/spider.png',
                emotion: { primary: 'neutral', intensity: 60 },
            },
        ],
        dialogue: [
            {
                speaker: 'Паук',
                characterId: 'spider',
                text: '— Человек... скажем так, бывший сотрудник. Он украл кое-что важное. Не деньги. Информацию. О проекте "Заслон". Он скрывается где-то в районе Старых Доков. Найди его. Живым.',
            },
            {
                speaker: 'Рассказчик',
                text: 'КВЕСТ ПОЛУЧЕН: "Беглец".',
            },
            {
                speaker: 'СИСТЕМА',
                text: 'КОНЕЦ ВВОДНОЙ ЧАСТИ.',
            }
        ],
        choices: [
            {
                id: 'end_intro_alt',
                text: 'Завершить вводную часть.',
                nextScene: 'chapter_1_summary',
                effects: {
                    immediate: [
                        { type: 'quest', data: { questId: 'the_fugitive', action: 'start' } },
                        { type: 'open_map' }
                    ],
                },
            },
        ]
    }
}
