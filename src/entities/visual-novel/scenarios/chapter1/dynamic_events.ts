import type { Scene } from '../../model/types'

/**
 * Динамические события и зоны поиска
 * (типизировано через общий `Scene` из `entities/visual-novel/model/types`)
 * 
 * Эти сценарии появляются контекстуально в зависимости от:
 * - Местоположения игрока
 * - Времени суток
 * - Прогресса квестов
 * - Флагов состояния мира
 * 
 * Зоны поиска награждают любопытство игрока
 */

// =====================================
// ТИПЫ ДИНАМИЧЕСКИХ СОБЫТИЙ
// =====================================

export interface DynamicEvent {
  id: string
  type: 'search_zone' | 'random_encounter' | 'timed_event' | 'ambient'
  triggers: EventTrigger[]
  probability: number // 0-100
  cooldown?: number // в минутах
  maxOccurrences?: number
  scene: Scene
}

export interface EventTrigger {
  type: 'location' | 'time' | 'flag' | 'quest' | 'reputation' | 'item'
  condition: Record<string, unknown>
}

// =====================================
// ЗОНЫ ПОИСКА - НАГРАДА ЗА ЛЮБОПЫТСТВО
// =====================================

export const searchZoneScenes: Record<string, Scene> = {
  // =====================================
  // ЗАБРОШЕННЫЙ СКЛАД (около станции)
  // =====================================

  search_abandoned_warehouse: {
    id: 'search_abandoned_warehouse',
    background: '/images/backgrounds/abandoned_warehouse.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Заброшенный склад. Пыль, ржавчина, запах сырости. Но что-то подсказывает — здесь можно найти полезное.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Автоуспех)] Следы на полу. Кто-то был здесь недавно. И оставил что-то в дальнем углу.',
        emotion: { primary: 'curious', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'search_carefully',
        text: '[ОСТОРОЖНОСТЬ] Осмотреть внимательно.',
        nextScene: 'warehouse_careful_search',
      },
      {
        id: 'search_quickly',
        text: 'Быстро осмотреть и уйти.',
        nextScene: 'warehouse_quick_search',
      },
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  warehouse_careful_search: {
    id: 'warehouse_careful_search',
    background: '/images/backgrounds/abandoned_warehouse.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы методично осматриваете помещение. Под старым брезентом — запечатанный ящик.',
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Ящик не повреждён. Либо его специально спрятали, либо просто забыли.',
        emotion: { primary: 'curious', intensity: 75 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Внутри — набор инструментов и несколько кредитов, завёрнутых в тряпку.',
      },
    ],
    choices: [
      {
        id: 'take_all',
        text: 'Забрать всё.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'basic_toolkit', amount: 1 } },
            { type: 'currency', data: { amount: 15 } },
          ],
          flags: [{ key: 'searched_warehouse', value: true }],
          xp: 10,
          narrative: 'Вы нашли набор инструментов и 15 кредитов.',
        },
      },
    ],
  },

  warehouse_quick_search: {
    id: 'warehouse_quick_search',
    background: '/images/backgrounds/abandoned_warehouse.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы быстро осматриваете склад. Находите несколько кредитов в кармане старого пальто.',
      },
    ],
    choices: [
      {
        id: 'take_credits',
        text: 'Забрать кредиты.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [{ type: 'currency', data: { amount: 5 } }],
          flags: [{ key: 'searched_warehouse', value: true }],
          xp: 5,
          narrative: 'Вы нашли 5 кредитов.',
        },
      },
    ],
  },

  // =====================================
  // ПОДВОРОТНЯ (случайный лут)
  // =====================================

  search_alley_stash: {
    id: 'search_alley_stash',
    background: '/images/backgrounds/dark_alley.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Тёмная подворотня. Мусорные баки, граффити, запах. Но в углу — что-то блестит.',
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: '(Шёпот) Это ловушка... они ждут... они хотят, чтобы ты подошёл...',
        emotion: { primary: 'worried', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'investigate',
        text: 'Подойти и посмотреть.',
        nextScene: 'alley_investigate',
      },
      {
        id: 'ignore',
        text: 'Игнорировать и уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  alley_investigate: {
    id: 'alley_investigate',
    background: '/images/backgrounds/dark_alley.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Блеск оказался монетой. Старой, довоенной. Рядом — небольшой тайник, замаскированный под кирпич.',
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Кирпич съёмный. Это чей-то схрон. Возможно, давно заброшенный.',
        emotion: { primary: 'curious', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'open_stash',
        text: 'Открыть тайник.',
        nextScene: 'alley_stash_opened',
      },
      {
        id: 'leave_alone',
        text: 'Оставить в покое. Не твоё.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'left_alley_stash', value: true }],
        },
      },
    ],
  },

  alley_stash_opened: {
    id: 'alley_stash_opened',
    background: '/images/backgrounds/dark_alley.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Внутри — аптечка, несколько патронов и записка: "Если читаешь это — значит, меня уже нет. Используй с умом."',
      },
      {
        speaker: 'ИНТУИЦИЯ',
        text: '(Тихо) ...кто-то не вернулся... кто-то не смог забрать своё...',
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'take_items',
        text: 'Забрать содержимое.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'medkit_small', amount: 1 } },
            { type: 'item', data: { itemId: 'pistol_ammo', amount: 6 } },
          ],
          flags: [{ key: 'took_alley_stash', value: true }],
          xp: 8,
          narrative: 'Вы нашли аптечку и патроны.',
        },
      },
    ],
  },

  // =====================================
  // СТАРЫЙ ФОНТАН (информация)
  // =====================================

  search_old_fountain: {
    id: 'search_old_fountain',
    background: '/images/backgrounds/old_fountain.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Старый фонтан на площади. Давно высохший, но на его основании — надписи. Старые и новые.',
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Автоуспех)] Это место встреч. Люди оставляют здесь сообщения. Закодированные и открытые.',
        emotion: { primary: 'curious', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'read_messages',
        text: 'Прочитать надписи.',
        nextScene: 'fountain_messages',
      },
      {
        id: 'leave_message',
        text: 'Оставить своё сообщение.',
        nextScene: 'fountain_leave_message',
      },
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  fountain_messages: {
    id: 'fountain_messages',
    background: '/images/backgrounds/old_fountain.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Большинство надписей — бессмыслица или признания в любви. Но несколько привлекают внимание...',
      },
      {
        speaker: 'Надпись 1',
        text: '"Синтез врёт. Эксперимент Каппа провалился. 47 мертвы. — Бывший сотрудник"',
      },
      {
        speaker: 'Надпись 2',
        text: '"Если ищешь работу — зайди в Цех 4. Спроси Рико. Скажи, что от Мышки."',
      },
      {
        speaker: 'Надпись 3',
        text: '"Шлосберг проснулся. Не ходи туда. — Друг"',
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Интересно. Информация из разных источников. Некоторые — ценные зацепки.',
        emotion: { primary: 'curious', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'remember_info',
        text: 'Запомнить информацию.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'know_synthesis_experiment', value: true },
            { key: 'know_rico_reference', value: true },
            { key: 'know_schlossberg_warning', value: true },
          ],
          xp: 15,
          narrative: 'Вы узнали несколько полезных вещей из надписей на фонтане.',
        },
      },
    ],
  },

  fountain_leave_message: {
    id: 'fountain_leave_message',
    background: '/images/backgrounds/old_fountain.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Что вы хотите написать?',
      },
    ],
    choices: [
      {
        id: 'write_warning',
        text: '"Новичкам: доверяй Гансу на станции."',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'left_fountain_message', value: true }],
          xp: 5,
        },
      },
      {
        id: 'write_joke',
        text: '"Здесь был я."',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'left_fountain_message', value: true }],
        },
      },
      {
        id: 'dont_write',
        text: 'Передумать.',
        nextScene: 'search_old_fountain',
      },
    ],
  },

  // =====================================
  // СЛОМАННЫЙ АВТОМАТ (ресурсы)
  // =====================================

  search_broken_vending: {
    id: 'search_broken_vending',
    background: '/images/backgrounds/street_corner.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Старый торговый автомат. Стекло разбито, внутренности разграблены, но... дверца сзади приоткрыта.',
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Сервисная панель. Там может быть что-то ценное — запчасти, может, даже рабочие компоненты.',
        emotion: { primary: 'excited', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'open_panel',
        text: 'Открыть сервисную панель.',
        nextScene: 'vending_panel_open',
      },
      {
        id: 'leave',
        text: 'Не трогать.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  vending_panel_open: {
    id: 'vending_panel_open',
    background: '/images/backgrounds/street_corner.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Внутри — провода, платы и... рабочий конденсатор. Артисаны заплатят за такое.',
      },
    ],
    choices: [
      {
        id: 'take_parts',
        text: 'Забрать детали.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'electronics_parts', amount: 2 } },
            { type: 'item', data: { itemId: 'capacitor', amount: 1 } },
          ],
          flags: [{ key: 'looted_vending_machine', value: true }],
          xp: 8,
          narrative: 'Вы нашли электронные детали и конденсатор.',
        },
      },
    ],
  },

  // =====================================
  // ПОДОЗРИТЕЛЬНЫЙ ЗВУК (опасность/награда)
  // =====================================

  hear_suspicious_sound: {
    id: 'hear_suspicious_sound',
    background: '/images/backgrounds/dark_street.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы слышите странный звук из-за угла. Шорох? Стон? Или что-то механическое?',
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'НЕ ХОДИ ТУДА. ЭТО ЛОВУШКА. ОНИ ЖДУТ.',
        emotion: { primary: 'worried', intensity: 85 },
      },
      {
        speaker: 'ИНТУИЦИЯ',
        text: '(Тихо) ...кому-то нужна помощь... или что-то ценное осталось без присмотра...',
        emotion: { primary: 'curious', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'investigate_cautiously',
        text: '[ОСТОРОЖНОСТЬ] Подкрасться и посмотреть.',
        nextScene: 'sound_investigate_careful',
      },
      {
        id: 'investigate_boldly',
        text: 'Смело подойти.',
        nextScene: 'sound_investigate_bold',
      },
      {
        id: 'ignore',
        text: 'Уйти в другую сторону.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  sound_investigate_careful: {
    id: 'sound_investigate_careful',
    background: '/images/backgrounds/dark_street.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы крадётесь к источнику звука. За углом — раненая собака, запутавшаяся в проводах. Рядом — её "добыча": чей-то рюкзак.',
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '[ПАРАМЕТР: ГУМАНИСТЫ/ЭМПАТИЯ (Успех)] Бедняга. Она боится, но не агрессивна. Можно помочь.',
        emotion: { primary: 'sad', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'help_dog',
        text: 'Освободить собаку.',
        nextScene: 'dog_freed',
      },
      {
        id: 'take_bag_only',
        text: 'Просто забрать рюкзак.',
        nextScene: 'bag_taken_cold',
      },
    ],
  },

  sound_investigate_bold: {
    id: 'sound_investigate_bold',
    background: '/images/backgrounds/dark_street.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы смело выходите за угол. Собака — большая, явно бродячая — скалит зубы. Она защищает что-то.',
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '(Напряжённо) Она чувствует твой страх. Или его отсутствие. Стой спокойно.',
        emotion: { primary: 'determined', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'stand_ground',
        text: '[АВТОРИТЕТ] Показать, что ты не угроза.',
        presentation: {
          color: 'bold',
          icon: '👑',
        },
        availability: {
          skillCheck: {
            skill: 'authority',
            difficulty: 8,
            successText: 'Собака успокаивается.',
            failureText: 'Собака рычит громче.',
          },
        },
        effects: {
          onSuccess: { nextScene: 'dog_calmed' },
          onFailure: { nextScene: 'dog_aggressive' },
        },
      },
      {
        id: 'back_away',
        text: 'Медленно отступить.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  dog_freed: {
    id: 'dog_freed',
    background: '/images/backgrounds/dark_street.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы осторожно распутываете провода. Собака смотрит на вас с недоверием, но позволяет помочь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Освободившись, она лижет вашу руку и убегает. Рюкзак остаётся.',
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ] Маленькая победа добра. Это важнее, чем кажется.',
        emotion: { primary: 'happy', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'take_bag',
        text: 'Осмотреть рюкзак.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'canned_food', amount: 2 } },
            { type: 'currency', data: { amount: 10 } },
          ],
          flags: [
            { key: 'helped_dog', value: true },
            { key: 'found_lost_bag', value: true },
          ],
          xp: 15,
          narrative: 'В рюкзаке — консервы и немного кредитов. И чувство, что вы сделали правильную вещь.',
        },
      },
    ],
  },

  dog_calmed: {
    id: 'dog_calmed',
    background: '/images/backgrounds/dark_street.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Собака перестаёт рычать. Она понимает, что вы не враг. Медленно отходит, позволяя вам взять рюкзак.',
      },
    ],
    choices: [
      {
        id: 'take_bag',
        text: 'Взять рюкзак.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'canned_food', amount: 2 } },
            { type: 'currency', data: { amount: 10 } },
          ],
          flags: [{ key: 'found_lost_bag', value: true }],
          xp: 10,
        },
      },
    ],
  },

  dog_aggressive: {
    id: 'dog_aggressive',
    background: '/images/backgrounds/dark_street.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Собака бросается! Вы отпрыгиваете, но она успевает порвать рукав. Царапины неглубокие, но болезненные.',
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'БЕГИ! БЕГИ! ОНА СНОВА НАПАДЁТ!',
        emotion: { primary: 'worried', intensity: 95 },
      },
    ],
    choices: [
      {
        id: 'retreat',
        text: 'Бежать.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'dog_attack_wound', value: true }],
          narrative: 'Вы получили небольшие раны. Нужно их обработать.',
        },
      },
    ],
  },

  bag_taken_cold: {
    id: 'bag_taken_cold',
    background: '/images/backgrounds/dark_street.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы хватаете рюкзак и уходите, игнорируя скулящую собаку. Практично. Но что-то неприятно скребёт внутри.',
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Выживание. Это главное. Собака справится.',
        emotion: { primary: 'neutral', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'canned_food', amount: 2 } },
            { type: 'currency', data: { amount: 10 } },
          ],
          flags: [
            { key: 'abandoned_dog', value: true },
            { key: 'found_lost_bag', value: true },
          ],
          xp: 5,
        },
      },
    ],
  },
}

// =====================================
// СЛУЧАЙНЫЕ ВСТРЕЧИ (RANDOM ENCOUNTERS)
// =====================================

export const randomEncounterScenes: Record<string, Scene> = {
  // =====================================
  // БРОДЯЧИЙ ТОРГОВЕЦ
  // =====================================

  wandering_merchant: {
    id: 'wandering_merchant',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'merchant',
        name: 'Бродячий торговец',
        position: 'center',
        sprite: '/images/npcs/wandering_merchant.jpg',
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Бродячий торговец',
        characterId: 'merchant',
        text: 'Эй, путник! Не желаешь взглянуть на мой товар? Редкие вещи, хорошие цены!',
        emotion: { primary: 'happy', intensity: 65 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Бродячие торговцы — источник редких товаров. Но цены обычно завышены.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'see_wares',
        text: '"Что у тебя есть?"',
        nextScene: 'merchant_wares',
      },
      {
        id: 'decline',
        text: '"Не сейчас."',
        nextScene: 'exit_to_map',
      },
      {
        id: 'ask_about_news',
        text: '"Какие новости с дорог?"',
        nextScene: 'merchant_news',
      },
    ],
  },

  merchant_wares: {
    id: 'merchant_wares',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'merchant',
        name: 'Бродячий торговец',
        position: 'center',
        sprite: '/images/npcs/wandering_merchant.jpg',
        emotion: { primary: 'happy', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Бродячий торговец',
        characterId: 'merchant',
        text: 'Сегодня есть: аптечки — 30 кредитов, патроны — 2 кредита за штуку, и... (Понижает голос) ...кое-что особенное.',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'buy_medkit',
        text: 'Купить аптечку (30 кредитов).',
        nextScene: 'merchant_purchase',
        availability: {
          // NOTE: TS server в проекте местами подхватывает устаревшую форму condition (только flag/notFlag).
          // Это приведение убирает excess-property check и сохраняет семантику требования по валюте.
          condition: (({ currency: 30 } as unknown) as { flag?: string; notFlag?: string; currency?: number }),
        },
        effects: {
          immediate: [
            { type: 'currency', data: { amount: -30 } },
            { type: 'item', data: { itemId: 'medkit_medium', amount: 1 } },
          ],
        },
      },
      {
        id: 'ask_special',
        text: '"Что особенное?"',
        nextScene: 'merchant_special',
      },
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  merchant_special: {
    id: 'merchant_special',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'merchant',
        name: 'Бродячий торговец',
        position: 'center',
        sprite: '/images/npcs/wandering_merchant.jpg',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Бродячий торговец',
        characterId: 'merchant',
        text: '(Озирается) Карта. Показывает безопасные маршруты между районами. Обновлённая. 50 кредитов.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Актуальная карта маршрутов — ценная вещь. Может спасти жизнь.',
        emotion: { primary: 'determined', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'buy_map',
        text: 'Купить карту (50 кредитов).',
        nextScene: 'merchant_purchase',
        availability: {
          // NOTE: см. комментарий выше (приведение для обхода устаревшего типа condition).
          condition: (({ currency: 50 } as unknown) as { flag?: string; notFlag?: string; currency?: number }),
        },
        effects: {
          immediate: [
            { type: 'currency', data: { amount: -50 } },
            { type: 'item', data: { itemId: 'safe_routes_map', amount: 1 } },
          ],
          flags: [{ key: 'has_safe_routes_map', value: true }],
        },
      },
      {
        id: 'decline_special',
        text: '"Слишком дорого."',
        nextScene: 'merchant_wares',
      },
    ],
  },

  merchant_purchase: {
    id: 'merchant_purchase',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'merchant',
        name: 'Бродячий торговец',
        position: 'center',
        sprite: '/images/npcs/wandering_merchant.jpg',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Бродячий торговец',
        characterId: 'merchant',
        text: 'Приятно иметь дело! Если увидишь меня снова — заходи. Товар меняется.',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'continue_shopping',
        text: 'Посмотреть ещё.',
        nextScene: 'merchant_wares',
      },
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  merchant_news: {
    id: 'merchant_news',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'merchant',
        name: 'Бродячий торговец',
        position: 'center',
        sprite: '/images/npcs/wandering_merchant.jpg',
        emotion: { primary: 'worried', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Бродячий торговец',
        characterId: 'merchant',
        text: '(Понижает голос) Слышал, что на севере неспокойно. FJR усилили патрули. Говорят, кто-то пробрался через периметр.',
        emotion: { primary: 'worried', intensity: 60 },
      },
      {
        speaker: 'Бродячий торговец',
        characterId: 'merchant',
        text: 'А ещё... на Шлосберге видели свечение. Яркое, как молния, но без грома. Странные времена.',
        emotion: { primary: 'worried', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'thank_for_info',
        text: 'Поблагодарить за информацию.',
        nextScene: 'wandering_merchant',
        effects: {
          flags: [
            { key: 'heard_perimeter_breach', value: true },
            { key: 'heard_schlossberg_glow', value: true },
          ],
        },
      },
    ],
  },

  // =====================================
  // ПАТРУЛЬ FJR
  // =====================================

  fjr_patrol_encounter: {
    id: 'fjr_patrol_encounter',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'patrol_leader',
        name: 'Патрульный FJR',
        position: 'center',
        sprite: '/images/npcs/fjr_patrol.jpg',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Патрульный FJR',
        characterId: 'patrol_leader',
        text: 'Стой! Проверка документов. Кто такой? Куда направляешься?',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: '(Громко) ОНИ ЗНАЮТ! ОНИ ВСЁ ЗНАЮТ! БЕГИ!',
        emotion: { primary: 'worried', intensity: 80 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '(Спокойно) Стандартная проверка. Веди себя естественно.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'cooperate',
        text: 'Показать документы и ответить честно.',
        nextScene: 'fjr_patrol_cooperate',
      },
      {
        id: 'bluff',
        text: '[ХИТРОСТЬ] Соврать о цели визита.',
        presentation: {
          color: 'skilled',
          icon: '🎭',
        },
        availability: {
          skillCheck: {
            skill: 'suggestion',
            difficulty: 9,
            successText: 'Они верят.',
            failureText: 'Что-то в твоих словах их насторожило.',
          },
        },
        effects: {
          onSuccess: { nextScene: 'fjr_patrol_bluff_success' },
          onFailure: { nextScene: 'fjr_patrol_suspicious' },
        },
      },
      {
        id: 'run',
        text: 'Бежать!',
        nextScene: 'fjr_patrol_chase',
      },
    ],
  },

  fjr_patrol_cooperate: {
    id: 'fjr_patrol_cooperate',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'patrol_leader',
        name: 'Патрульный FJR',
        position: 'center',
        sprite: '/images/npcs/fjr_patrol.jpg',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы показываете документы и отвечаете на вопросы. Патрульный внимательно изучает ваши бумаги.',
      },
      {
        speaker: 'Патрульный FJR',
        characterId: 'patrol_leader',
        text: '(Кивает) Хорошо. Всё в порядке. Будь осторожен — в восточном районе неспокойно.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'ask_about_east',
        text: '"Что происходит на востоке?"',
        nextScene: 'fjr_patrol_east_info',
      },
      {
        id: 'thank_leave',
        text: 'Поблагодарить и уйти.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'fjr_patrol_passed', value: true }],
        },
      },
    ],
  },

  fjr_patrol_bluff_success: {
    id: 'fjr_patrol_bluff_success',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'patrol_leader',
        name: 'Патрульный FJR',
        position: 'center',
        sprite: '/images/npcs/fjr_patrol.jpg',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Патрульный FJR',
        characterId: 'patrol_leader',
        text: '(Кивает) Понятно. Проходи. Но без глупостей.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'ХИТРОСТЬ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ] Они поверили. Иногда ложь — единственный путь.',
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
        effects: {
          xp: 10,
        },
      },
    ],
  },

  fjr_patrol_suspicious: {
    id: 'fjr_patrol_suspicious',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'patrol_leader',
        name: 'Патрульный FJR',
        position: 'center',
        sprite: '/images/npcs/fjr_patrol.jpg',
        emotion: { primary: 'angry', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Патрульный FJR',
        characterId: 'patrol_leader',
        text: '(Щурится) Что-то ты темнишь. Открой сумку. Медленно.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Они обыскивают вас. Ничего запрещённого не находят, но настроение испорчено.',
      },
      {
        speaker: 'Патрульный FJR',
        characterId: 'patrol_leader',
        text: 'Чисто. На этот раз. Но я тебя запомню.',
        emotion: { primary: 'angry', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'leave_quietly',
        text: 'Молча уйти.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'fjr_suspicious', value: true }],
          immediate: [{ type: 'reputation', data: { faction: 'fjr', delta: -5 } }],
        },
      },
    ],
  },

  fjr_patrol_chase: {
    id: 'fjr_patrol_chase',
    background: '/images/backgrounds/street_day.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Патрульный FJR',
        text: 'СТОЙ! СТОЯТЬ!!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вы бросаетесь бежать. За спиной — крики и топот. Петляете по переулкам...',
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'БЫСТРЕЕ! БЫСТРЕЕ! ОНИ ДОГОНЯЮТ!',
        emotion: { primary: 'worried', intensity: 95 },
      },
    ],
    choices: [
      {
        id: 'run_athletics',
        text: '[АТЛЕТИКА] Попытаться оторваться.',
        availability: {
          skillCheck: {
            skill: 'endurance',
            difficulty: 10,
            successText: 'Вы оторвались!',
            failureText: 'Они догоняют!',
          },
        },
        effects: {
          onSuccess: { nextScene: 'fjr_patrol_escaped' },
          onFailure: { nextScene: 'fjr_patrol_caught' },
        },
      },
    ],
  },

  fjr_patrol_escaped: {
    id: 'fjr_patrol_escaped',
    background: '/images/backgrounds/dark_alley.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы нырнули в узкий проход и затаились. Патруль пробежал мимо. Сердце колотится.',
      },
      {
        speaker: 'ЛОГИКА',
        text: '(Тяжело дыша) Ты сбежал от FJR. Теперь ты в их чёрном списке. Это... было глупо.',
        emotion: { primary: 'worried', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'leave',
        text: 'Осторожно уйти.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'fjr_fugitive', value: true }],
          immediate: [{ type: 'reputation', data: { faction: 'fjr', delta: -15 } }],
          xp: 15,
        },
      },
    ],
  },

  fjr_patrol_caught: {
    id: 'fjr_patrol_caught',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'patrol_leader',
        name: 'Патрульный FJR',
        position: 'center',
        sprite: '/images/npcs/fjr_patrol.jpg',
        emotion: { primary: 'angry', intensity: 80 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Они догнали вас. Удар в спину сбивает с ног.',
      },
      {
        speaker: 'Патрульный FJR',
        characterId: 'patrol_leader',
        text: 'Побегать решил?! Теперь посидишь в камере. Подумаешь о своём поведении.',
        emotion: { primary: 'angry', intensity: 85 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Вас ведут в участок. Это будет долгая ночь.',
      },
    ],
    choices: [
      {
        id: 'accept_fate',
        text: 'Смириться.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'fjr_arrested', value: true },
            { key: 'spent_night_in_jail', value: true },
          ],
          immediate: [
            { type: 'reputation', data: { faction: 'fjr', delta: -20 } },
            { type: 'currency', data: { amount: -20 } },
          ],
          narrative: 'Вы провели ночь в камере. Утром вас отпустили, но забрали 20 кредитов "за беспокойство".',
        },
      },
    ],
  },

  fjr_patrol_east_info: {
    id: 'fjr_patrol_east_info',
    background: '/images/backgrounds/street_day.jpg',
    characters: [
      {
        id: 'patrol_leader',
        name: 'Патрульный FJR',
        position: 'center',
        sprite: '/images/npcs/fjr_patrol.jpg',
        emotion: { primary: 'worried', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Патрульный FJR',
        characterId: 'patrol_leader',
        text: '(Понижает голос) Анархисты активизировались. Были стычки. Рекомендую обходить Августинерплац.',
        emotion: { primary: 'worried', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'thank',
        text: 'Поблагодарить.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'fjr_patrol_passed', value: true },
            { key: 'know_anarchist_activity', value: true },
          ],
        },
      },
    ],
  },
}

// =====================================
// ОБЪЕДИНЕНИЕ ВСЕХ ДИНАМИЧЕСКИХ СЦЕН
// =====================================

export const allDynamicScenes = {
  ...searchZoneScenes,
  ...randomEncounterScenes,
}

// =====================================
// КОНФИГУРАЦИЯ ДИНАМИЧЕСКИХ СОБЫТИЙ
// =====================================

export const DYNAMIC_EVENTS: DynamicEvent[] = [
  {
    id: 'warehouse_search',
    type: 'search_zone',
    triggers: [
      { type: 'location', condition: { near: 'station_area', radius: 200 } },
      { type: 'flag', condition: { not: 'searched_warehouse' } },
    ],
    probability: 30,
    maxOccurrences: 1,
    scene: searchZoneScenes.search_abandoned_warehouse,
  },
  {
    id: 'alley_stash',
    type: 'search_zone',
    triggers: [
      { type: 'location', condition: { zone: 'market_area' } },
      { type: 'flag', condition: { not: 'took_alley_stash' } },
    ],
    probability: 25,
    maxOccurrences: 1,
    scene: searchZoneScenes.search_alley_stash,
  },
  {
    id: 'fountain_info',
    type: 'search_zone',
    triggers: [
      { type: 'location', condition: { zone: 'central_plaza' } },
    ],
    probability: 40,
    cooldown: 60,
    scene: searchZoneScenes.search_old_fountain,
  },
  {
    id: 'wandering_merchant',
    type: 'random_encounter',
    triggers: [
      { type: 'location', condition: { zone: 'any_safe' } },
      { type: 'time', condition: { hour: { min: 8, max: 20 } } },
    ],
    probability: 15,
    cooldown: 30,
    scene: randomEncounterScenes.wandering_merchant,
  },
  {
    id: 'fjr_patrol',
    type: 'random_encounter',
    triggers: [
      { type: 'location', condition: { zone: 'fjr_territory' } },
      { type: 'flag', condition: { not: 'fjr_trusted_ally' } },
    ],
    probability: 20,
    cooldown: 15,
    scene: randomEncounterScenes.fjr_patrol_encounter,
  },
  {
    id: 'suspicious_sound',
    type: 'random_encounter',
    triggers: [
      { type: 'location', condition: { zone: 'any_neutral' } },
      { type: 'time', condition: { hour: { min: 18, max: 6 } } },
    ],
    probability: 20,
    cooldown: 45,
    scene: searchZoneScenes.hear_suspicious_sound,
  },
]




















