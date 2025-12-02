import type { Scene } from '../../../model/types'

/**
 * Сценарии для фракции Синтез
 * 
 * Ключевые NPC: Лена Рихтер, Профессор Шмидт
 * Квесты: field_medicine, emergency_patient, professor_mystery
 */

const MEDCENTER_BACKGROUND = '/images/backgrounds/synthesis_medcenter.jpg'
const GREENHOUSE_BACKGROUND = '/images/backgrounds/greenhouse.jpg'
const CAMPUS_BACKGROUND = '/images/backgrounds/synthesis_campus.jpg'
const LENA_SPRITE = '/images/npcs/lena_richter.jpg'

export const synthesisScenes: Record<string, Scene> = {
  // =====================================
  // ПЕРВАЯ ВСТРЕЧА С ЛЕНОЙ РИХТЕР
  // =====================================

  lena_introduction: {
    id: 'lena_introduction',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Медцентр "Гиппократ" пахнет антисептиком и бессонными ночами. За столом, заваленным бумагами, сидит женщина в белом халате.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Круги под глазами. Пятна крови на рукавах — не свежие. Она работает без перерыва.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '(Не поднимая головы) Если ты не истекаешь кровью, подожди. Если истекаешь — ложись на койку справа.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '(Тихо) Она устала. Очень устала. Но продолжает работать.',
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'wait_politely',
        text: 'Подождать, пока она закончит.',
        nextScene: 'lena_notices_you',
      },
      {
        id: 'introduce_self',
        text: '"Я не ранен. Хочу помочь."',
        nextScene: 'lena_help_offer',
        effects: {
          xp: 5,
        },
      },
      {
        id: 'ask_about_professor',
        text: '"Я ищу профессора Шмидта."',
        nextScene: 'lena_professor_question',
        availability: {
          condition: { flag: 'has_package' },
        },
      },
    ],
  },

  lena_notices_you: {
    id: 'lena_notices_you',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'surprised', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Проходит несколько минут. Наконец, она поднимает голову и замечает вас.',
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'О. Ты всё ещё здесь. (Трёт глаза) Извини. День выдался... как обычно. Чем могу помочь?',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'offer_help',
        text: '"На самом деле, я хотел спросить, не нужна ли вам помощь."',
        nextScene: 'lena_help_offer',
      },
      {
        id: 'ask_about_synthesis',
        text: '"Расскажите о Синтезе."',
        nextScene: 'lena_synthesis_info',
      },
      {
        id: 'medical_help',
        text: '"Мне бы подлечиться."',
        nextScene: 'lena_healing',
      },
    ],
  },

  lena_help_offer: {
    id: 'lena_help_offer',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'surprised', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '(Удивлённо поднимает бровь) Помочь? Ты серьёзно? Не просишь денег? Не пытаешься продать мне "чудо-лекарство"?',
        emotion: { primary: 'surprised', intensity: 70 },
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '[ПАРАМЕТР: ГУМАНИСТЫ/ЭМПАТИЯ (Успех)] Она привыкла к обману. Каждый день к ней приходят с корыстью. Искренность её удивляет.',
        emotion: { primary: 'sad', intensity: 55 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '(Откидывается на спинку стула) Знаешь что... Да. Есть одно дело. Если ты не боишься испачкать руки.',
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    nextScene: 'lena_field_medicine_quest',
  },

  lena_field_medicine_quest: {
    id: 'lena_field_medicine_quest',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'determined', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Мне нужны образцы из теплицы в Штадтгартене. Лекарственные травы, грибы, мутировавшие растения — всё, что может пригодиться для медицины.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Мутировавшие растения? Интересно. После катастрофы флора адаптировалась. Некоторые мутации могут иметь медицинскую ценность.',
        emotion: { primary: 'excited', intensity: 65 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Проблема в том, что теплица в опасной зоне. Твари там... активные. Последний, кого я послала, вернулся без руки.',
        emotion: { primary: 'worried', intensity: 60 },
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'Без руки?! А ты что, думал, она пошлёт тебя за ромашками?!',
        emotion: { primary: 'worried', intensity: 80 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Но я заплачу. И дам тебе базовую аптечку. Плюс научу паре приёмов первой помощи, которые могут спасти жизнь.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'accept_quest',
        text: '"Согласен. Что именно нужно собрать?"',
        nextScene: 'lena_quest_details',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'field_medicine', action: 'start' } },
          ],
          flags: [
            { key: 'field_medicine_active', value: true },
            { key: 'met_lena', value: true },
          ],
        },
      },
      {
        id: 'ask_about_danger',
        text: '"Что за твари там?"',
        nextScene: 'lena_danger_warning',
      },
      {
        id: 'decline',
        text: '"Без руки? Нет, спасибо."',
        nextScene: 'lena_decline_response',
      },
    ],
  },

  lena_danger_warning: {
    id: 'lena_danger_warning',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'worried', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Дикие собаки — точно. Мусорщики — вероятно. И... (Понижает голос) Иногда там видят что-то большее. Мы называем это "Корень".',
        emotion: { primary: 'worried', intensity: 70 },
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] "Корень" — местное название для крупных мутировавших организмов растительного происхождения. Подвижные, агрессивные, способные к регенерации.',
        emotion: { primary: 'neutral', intensity: 75 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Если увидишь — беги. Не геройствуй. Мне образцы нужны, а не ещё один труп.',
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'accept_anyway',
        text: '"Понял. Я справлюсь."',
        nextScene: 'lena_quest_details',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'field_medicine', action: 'start' } },
          ],
          flags: [
            { key: 'field_medicine_active', value: true },
            { key: 'met_lena', value: true },
          ],
        },
      },
      {
        id: 'reconsider',
        text: '"Дай подумать..."',
        nextScene: 'lena_decline_response',
      },
    ],
  },

  lena_quest_details: {
    id: 'lena_quest_details',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '(Почти улыбается) Наконец-то кто-то с яйцами. Держи список.',
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Она протягивает вам мятый листок с названиями растений и грибов.',
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Три образца — минимум. Больше — лучше. Срезай аккуратно, не повреди корни. И вот, возьми.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Она достаёт из ящика базовую аптечку и контейнер для образцов.',
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Аптечка — твоя. Контейнер верни с образцами. Удачи. Тебе понадобится.',
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'go_greenhouse',
        text: 'Отправиться к теплице.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'medkit_basic', amount: 1 } },
            { type: 'item', data: { itemId: 'sample_container', amount: 1 } },
          ],
          flags: [{ key: 'destination_greenhouse', value: true }],
          narrative: 'Теплица Штадтгартена отмечена на карте.',
        },
      },
    ],
  },

  lena_decline_response: {
    id: 'lena_decline_response',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'sad', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '(Вздыхает) Понимаю. Не все готовы рисковать. Если передумаешь — знаешь, где меня найти.',
        emotion: { primary: 'sad', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'met_lena', value: true }],
        },
      },
    ],
  },

  // =====================================
  // ТЕПЛИЦА - СБОР ОБРАЗЦОВ
  // =====================================

  greenhouse_exploration: {
    id: 'greenhouse_exploration',
    background: GREENHOUSE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Теплица Штадтгартена — буйство зелени, пробивающейся сквозь разбитые стёкла. Воздух влажный и тёплый, пахнет землёй и чем-то сладким.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Среди обычных растений — странные формы. Светящиеся грибы. Вьющиеся лозы с шипами. И... что-то движется в углу.',
        emotion: { primary: 'worried', intensity: 70 },
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Мутации впечатляют. Некоторые из этих растений не существовали до катастрофы. Эволюция на стероидах.',
        emotion: { primary: 'excited', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'careful_approach',
        text: 'Осторожно продвигаться вглубь.',
        nextScene: 'greenhouse_collection',
      },
      {
        id: 'check_movement',
        text: '[ВОСПРИЯТИЕ] Сначала проверить, что двигалось в углу. (Сложность 8)',
        presentation: {
          color: 'skill',
          icon: '👁️',
          tooltip: 'Требуется ВОСПРИЯТИЕ',
        },
        availability: {
          skillCheck: {
            skill: 'perception',
            difficulty: 8,
            successText: 'Ты видишь угрозу!',
            failureText: 'Ничего не видно...',
          },
        },
        effects: {
          onSuccess: { nextScene: 'greenhouse_threat_spotted' },
          onFailure: { nextScene: 'greenhouse_collection' },
        },
      },
    ],
  },

  greenhouse_threat_spotted: {
    id: 'greenhouse_threat_spotted',
    background: GREENHOUSE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ] Там! За сломанным стеллажом! Дикая собака. Нет... две. Они охраняют гнездо.',
        emotion: { primary: 'determined', intensity: 80 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Две одичавшие собаки с облезлой шерстью и жёлтыми глазами. Они ещё не заметили вас, но выход перекрыт.',
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Варианты: обойти по краю, отвлечь, или устранить. Гнездо — они будут защищать его яростно.',
        emotion: { primary: 'determined', intensity: 80 },
      },
    ],
    choices: [
      {
        id: 'sneak_around',
        text: '[РЕФЛЕКСЫ] Тихо обойти их. (Сложность 9)',
        presentation: {
          color: 'skill',
          icon: '🏃',
          tooltip: 'Требуется РЕФЛЕКСЫ',
        },
        availability: {
          skillCheck: {
            skill: 'reflexes',
            difficulty: 9,
            successText: 'Ты скользишь мимо как тень.',
            failureText: 'Под ногой хрустит стекло...',
          },
        },
        effects: {
          onSuccess: { nextScene: 'greenhouse_collection' },
          onFailure: { nextScene: 'greenhouse_dog_fight' },
        },
      },
      {
        id: 'distract',
        text: '[ТЕХНОФИЛ] Бросить что-то, чтобы отвлечь. (Сложность 7)',
        presentation: {
          color: 'skill',
          icon: '🔧',
          tooltip: 'Требуется ТЕХНОФИЛ',
        },
        availability: {
          skillCheck: {
            skill: 'technophile',
            difficulty: 7,
            successText: 'Отличная идея!',
            failureText: 'Они не отвлеклись...',
          },
        },
        effects: {
          onSuccess: { nextScene: 'greenhouse_distraction_success' },
          onFailure: { nextScene: 'greenhouse_dog_fight' },
        },
      },
      {
        id: 'fight_dogs',
        text: 'Атаковать первым.',
        nextScene: 'greenhouse_dog_fight',
      },
    ],
  },

  greenhouse_distraction_success: {
    id: 'greenhouse_distraction_success',
    background: GREENHOUSE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы бросаете камень в дальний угол. Собаки срываются с места, преследуя звук.',
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ] Простейшая механика отвлечения. Работает безотказно.',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    nextScene: 'greenhouse_collection',
  },

  greenhouse_dog_fight: {
    id: 'greenhouse_dog_fight',
    background: GREENHOUSE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: '[БОЕВАЯ СЦЕНА — Дикие собаки x2]',
      },
      {
        speaker: 'Рассказчик',
        text: 'Собаки бросаются на вас с рычанием. Их движения дёрганые, непредсказуемые — болезнь или мутация изменили их.',
      },
      {
        speaker: 'РЕФЛЕКСЫ',
        text: '[ПАРАМЕТР: ТЕЛО/РЕФЛЕКСЫ (Успех)] Первая целит в горло — уклоняйся! Вторая заходит сбоку!',
        emotion: { primary: 'determined', intensity: 85 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Бой жестокий, но короткий. Собаки падают. Вы тяжело дышите, но целы.',
      },
    ],
    choices: [
      {
        id: 'continue_collecting',
        text: 'Продолжить сбор образцов.',
        nextScene: 'greenhouse_collection',
        effects: {
          xp: 15,
        },
      },
    ],
  },

  greenhouse_collection: {
    id: 'greenhouse_collection',
    background: GREENHOUSE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы находите нужные растения. Светящиеся грибы у основания разрушенного стеллажа. Лекарственные травы в заросшем углу. Странный мутировавший цветок с пульсирующими лепестками.',
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Этот цветок... его клетки светятся. Биолюминесценция. Лена будет в восторге.',
        emotion: { primary: 'excited', intensity: 75 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Вы аккуратно срезаете образцы и укладываете их в контейнер. Задание почти выполнено.',
      },
    ],
    choices: [
      {
        id: 'collect_extra',
        text: '[ВОСПРИЯТИЕ] Поискать ещё образцы. (Сложность 7)',
        presentation: {
          color: 'skill',
          icon: '👁️',
          tooltip: 'Требуется ВОСПРИЯТИЕ',
        },
        availability: {
          skillCheck: {
            skill: 'perception',
            difficulty: 7,
            successText: 'Ты находишь редкий образец!',
            failureText: 'Ничего интересного больше нет.',
          },
        },
        effects: {
          onSuccess: {
            nextScene: 'greenhouse_rare_find',
          },
          onFailure: { nextScene: 'greenhouse_return' },
        },
      },
      {
        id: 'return_now',
        text: 'Вернуться к Лене.',
        nextScene: 'greenhouse_return',
      },
    ],
  },

  greenhouse_rare_find: {
    id: 'greenhouse_rare_find',
    background: GREENHOUSE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ] Подожди... Под листьями... Это же "Пепельный мох"! Редчайшая находка!',
        emotion: { primary: 'excited', intensity: 80 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Вы обнаруживаете небольшую колонию серебристого мха. Он светится слабым фосфоресцирующим светом.',
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Пепельный мох — мощное заживляющее средство. Один образец стоит целое состояние.',
        emotion: { primary: 'neutral', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'take_rare',
        text: 'Аккуратно собрать редкий образец.',
        nextScene: 'greenhouse_return',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'ash_moss_sample', amount: 1 } },
          ],
          flags: [{ key: 'found_rare_sample', value: true }],
          xp: 15,
        },
      },
    ],
  },

  greenhouse_return: {
    id: 'greenhouse_return',
    background: GREENHOUSE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Контейнер полон образцов. Пора возвращаться в медцентр.',
      },
    ],
    choices: [
      {
        id: 'return_to_lena',
        text: 'Вернуться к Лене Рихтер.',
        nextScene: 'lena_quest_complete',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'field_medicine', action: 'progress', stepId: 'explore_greenhouse' } },
          ],
        },
      },
    ],
  },

  // =====================================
  // ЗАВЕРШЕНИЕ КВЕСТА ЛЕНЫ
  // =====================================

  lena_quest_complete: {
    id: 'lena_quest_complete',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'happy', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '(Открывает контейнер) Ты вернулся. И с полным набором. Я впечатлена.',
        emotion: { primary: 'happy', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Она перебирает образцы, её глаза загораются при виде каждого.',
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Светящиеся грибы — для антисептика. Травы — для обезболивающего. А этот цветок... (Замирает) Откуда?!',
        emotion: { primary: 'surprised', intensity: 75 },
      },
    ],
    nextScene: 'lena_quest_reward',
  },

  lena_quest_reward: {
    id: 'lena_quest_reward',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Это... это может изменить всё. С этими образцами я смогу синтезировать новый антибиотик. Ты понимаешь, что это значит?',
        emotion: { primary: 'excited', intensity: 75 },
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '[ПАРАМЕТР: ГУМАНИСТЫ/ЭМПАТИЯ (Успех)] Её глаза блестят. Это не жадность — это надежда. Она видит возможность спасти жизни.',
        emotion: { primary: 'happy', intensity: 65 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Держи. Обещанная награда. И... (Достаёт улучшенную аптечку) ...это от меня лично. Ты заслужил.',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'take_reward',
        text: 'Принять награду.',
        nextScene: 'lena_future_work',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: 40 } },
            { type: 'item', data: { itemId: 'medical_kit_improved', amount: 1 } },
            { type: 'quest', data: { questId: 'field_medicine', action: 'complete' } },
            { type: 'reputation', data: { faction: 'synthesis', delta: 20 } },
          ],
          flags: [
            { key: 'synthesis_contact', value: true },
            { key: 'lena_trusted', value: true },
          ],
          xp: 30,
        },
      },
    ],
  },

  lena_future_work: {
    id: 'lena_future_work',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Послушай... У меня ещё будет работа. Синтез всегда ищет надёжных людей. И теперь я знаю, что ты надёжен.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Если услышишь что-то о профессоре Шмидте — дай знать. Он пропал три дня назад, и... это важно. Очень важно.',
        emotion: { primary: 'worried', intensity: 65 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Профессор Шмидт. То самое имя, которое было на твоей посылке. Совпадение?',
        emotion: { primary: 'determined', intensity: 85 },
      },
    ],
    choices: [
      {
        id: 'mention_package',
        text: '"У меня есть посылка для Шмидта."',
        nextScene: 'lena_professor_revelation',
        availability: {
          condition: { flag: 'has_package' },
        },
      },
      {
        id: 'ask_about_professor',
        text: '"Что случилось с профессором?"',
        nextScene: 'lena_professor_info',
      },
      {
        id: 'leave',
        text: '"Буду иметь в виду."',
        nextScene: 'exit_to_map',
      },
    ],
  },

  lena_professor_info: {
    id: 'lena_professor_info',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'worried', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '(Понижает голос) Никто не знает точно. Он работал над чем-то секретным. Даже для Синтеза — секретным.',
        emotion: { primary: 'worried', intensity: 70 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Анархисты говорят, что он к ним перебежал. FJR думают, что его похитили. Староверы шепчутся о каких-то экспериментах в крипте собора.',
        emotion: { primary: 'worried', intensity: 65 },
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Три версии, три фракции. Классический случай, когда правда скрыта между строк.',
        emotion: { primary: 'neutral', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'investigate',
        text: '"Я постараюсь выяснить."',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'know_professor_missing', value: true },
            { key: 'know_professor_location', value: true },
          ],
          narrative: 'Кабинет профессора в кампусе Синтеза отмечен на карте.',
        },
      },
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  lena_professor_revelation: {
    id: 'lena_professor_revelation',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'surprised', intensity: 80 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '(Замирает) Посылка? Для Шмидта? (Её голос становится напряжённым) Покажи.',
        emotion: { primary: 'surprised', intensity: 85 },
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'Не показывай! Она заберёт её! Она всё знает!',
        emotion: { primary: 'worried', intensity: 80 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Она может помочь найти получателя. Или она часть загадки. В любом случае — это информация.',
        emotion: { primary: 'determined', intensity: 80 },
      },
    ],
    choices: [
      {
        id: 'show_package',
        text: 'Показать посылку (не отдавать).',
        nextScene: 'lena_examines_package',
      },
      {
        id: 'refuse',
        text: '"Сначала расскажи больше о профессоре."',
        nextScene: 'lena_professor_info',
      },
    ],
  },

  lena_examines_package: {
    id: 'lena_examines_package',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'worried', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Лена внимательно осматривает печать на посылке, не прикасаясь.',
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '"Acta, non verba"... Это печать Совета Старейшин. (Бледнеет) Послушай меня внимательно. Не открывай это. Не отдавай никому, кроме самого Шмидта.',
        emotion: { primary: 'worried', intensity: 75 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Его кабинет в восточном крыле кампуса. Если он жив — он там оставил следы. Если нет... (Она не договаривает)',
        emotion: { primary: 'sad', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'go_investigate',
        text: 'Отправиться в кабинет профессора.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'know_professor_location', value: true },
            { key: 'lena_warned_about_package', value: true },
          ],
          immediate: [
            { type: 'quest', data: { questId: 'professor_mystery', action: 'start' } },
          ],
          narrative: 'Кабинет профессора Шмидта отмечен на карте.',
        },
      },
    ],
  },

  // =====================================
  // СИНТЕЗ - ОБЩАЯ ИНФОРМАЦИЯ
  // =====================================

  lena_synthesis_info: {
    id: 'lena_synthesis_info',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Синтез? (Задумывается) Мы — те, кто верит в науку. В то, что понимание мира может его спасти.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Мы изучаем мутации, аномалии, болезни. Ищем способы адаптации. Некоторые называют нас еретиками. Другие — надеждой.',
        emotion: { primary: 'determined', intensity: 65 },
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Синтез базируется на остатках университетских институтов. Их цель — понять природу катастрофы и найти способ жить в изменившемся мире.',
        emotion: { primary: 'neutral', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'ask_about_joining',
        text: '"Как присоединиться к Синтезу?"',
        nextScene: 'lena_join_synthesis',
      },
      {
        id: 'back_to_business',
        text: '"Понятно. Есть ли работа?"',
        nextScene: 'lena_help_offer',
      },
    ],
  },

  lena_join_synthesis: {
    id: 'lena_join_synthesis',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Присоединиться? Мы не армия, у нас нет формы вступления. Помогай — и ты уже часть нас. Учись — и двери откроются.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Начни с малого. Помоги мне — и я замолвлю за тебя слово.',
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    nextScene: 'lena_field_medicine_quest',
  },

  lena_healing: {
    id: 'lena_healing',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '(Осматривает вас) Что болит?',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Она быстро и профессионально обрабатывает ваши раны, если они есть.',
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Десять кредитов за базовую помощь. Пятнадцать — если что-то серьёзное.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'pay_for_healing',
        text: 'Заплатить за лечение (10 кредитов).',
        nextScene: 'lena_notices_you',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: -10 } },
          ],
          flags: [{ key: 'healed_by_lena', value: true }],
        },
      },
      {
        id: 'decline_healing',
        text: '"На самом деле, я в порядке."',
        nextScene: 'lena_notices_you',
      },
    ],
  },

  lena_professor_question: {
    id: 'lena_professor_question',
    background: MEDCENTER_BACKGROUND,
    characters: [
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'center',
        sprite: LENA_SPRITE,
        emotion: { primary: 'surprised', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: '(Резко поднимает голову) Шмидт? Ты знаешь его? Откуда?',
        emotion: { primary: 'surprised', intensity: 75 },
      },
    ],
    nextScene: 'lena_professor_revelation',
  },
}







