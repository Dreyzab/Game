import type { Scene } from '../../../model/types'

/**
 * Сценарии для фракции FJR (Фрайбургский Жилищный Резерв)
 * 
 * Ключевые NPC: Ганс, Сержант Крюгер, Командант Хольц
 * Квесты: baptism_by_fire, fjr_training
 */

const FJR_HQ_BACKGROUND = '/images/backgrounds/fjr_headquarters.jpg'
const STADTGARTEN_BACKGROUND = '/images/backgrounds/stadtgarten.jpg'
const KRUGER_SPRITE = '/images/npcs/kruger.jpg'
const HANS_SPRITE = '/images/npcs/craftsman.jpg'

export const fjrScenes: Record<string, Scene> = {
  // =====================================
  // ДОСКА ОБЪЯВЛЕНИЙ FJR
  // =====================================

  fjr_bulletin_board_dialog: {
    id: 'fjr_bulletin_board_dialog',
    background: FJR_HQ_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Доска объявлений FJR увешана листками с заданиями. Большинство помечены красным — срочно.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Один листок выделяется. "ПАТРУЛЬНОЕ ЗАДАНИЕ — ШТАДТГАРТЕН. РЕКРУТЫ ПРИВЕТСТВУЮТСЯ. ОПЛАТА: 50 КРЕДИТОВ + РЕПУТАЦИЯ."',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Внизу приписка: "Явиться к сержанту Крюгеру для инструктажа."',
      },
    ],
    choices: [
      {
        id: 'take_patrol_quest',
        text: 'Взять задание на патрулирование.',
        nextScene: 'fjr_quest_accepted',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'baptism_by_fire', action: 'start' } },
          ],
          flags: [
            { key: 'fjr_board_quest_taken', value: true },
            { key: 'need_meet_kruger', value: true },
          ],
        },
      },
      {
        id: 'look_other_quests',
        text: 'Посмотреть другие задания.',
        nextScene: 'fjr_other_quests',
      },
      {
        id: 'leave_board',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  fjr_quest_accepted: {
    id: 'fjr_quest_accepted',
    background: FJR_HQ_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы срываете листок с доски. Несколько солдат поблизости бросают на вас оценивающие взгляды.',
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Боевое крещение. Классический тест для новичков. Либо докажешь свою ценность, либо станешь статистикой.',
        emotion: { primary: 'determined', intensity: 80 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Теперь нужно найти сержанта Крюгера. Судя по карте, его брифинг-точка находится у входа в Штадтгартен.',
      },
    ],
    choices: [
      {
        id: 'go_to_kruger',
        text: 'Отправиться к сержанту Крюгеру.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'destination_kruger', value: true }],
          narrative: 'Брифинг-точка Крюгера отмечена на карте.',
        },
      },
    ],
  },

  fjr_other_quests: {
    id: 'fjr_other_quests',
    background: FJR_HQ_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Другие задания выглядят сложнее. "Охрана конвоя — опыт обязателен." "Зачистка аномалии — только группы." "Разведка периметра — минимум 20 репутации FJR."',
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Как обычно. Хочешь что-то стоящее — сначала докажи, что ты не полный ноль.',
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'back_to_board',
        text: 'Вернуться к простому заданию.',
        nextScene: 'fjr_bulletin_board_dialog',
      },
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  // =====================================
  // СЕРЖАНТ КРЮГЕР - ПЕРВАЯ ВСТРЕЧА
  // =====================================

  kruger_first_meeting: {
    id: 'kruger_first_meeting',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'angry', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'У входа в парк стоит массивная фигура в форме FJR. Шрам пересекает его лицо от виска до подбородка.',
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '(Рычит) Ещё один. Показывай листок.',
        emotion: { primary: 'angry', intensity: 75 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Вы протягиваете задание. Крюгер скользит по нему взглядом.',
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Патрульное. Ага. Знаешь, что это значит, мясо?',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '(Едва слышно) Он пытается запугать тебя. Не поддавайся.',
        emotion: { primary: 'determined', intensity: 45 },
      },
    ],
    choices: [
      {
        id: 'stay_silent',
        text: 'Молча ждать продолжения.',
        nextScene: 'kruger_briefing',
      },
      {
        id: 'answer_honestly',
        text: '"Патрулирование территории. Зачистка угроз."',
        nextScene: 'kruger_impressed',
        effects: {
          xp: 5,
        },
      },
      {
        id: 'challenge_kruger',
        text: '[АВТОРИТЕТ] "Хватит игр. Давай инструктаж." (Сложность 12)',
        presentation: {
          color: 'bold',
          icon: '👑',
          tooltip: 'Требуется АВТОРИТЕТ — очень сложно',
        },
        availability: {
          skillCheck: {
            skill: 'authority',
            difficulty: 12,
            successText: 'Крюгер ухмыляется...',
            failureText: 'Он смотрит на тебя как на таракана.',
          },
        },
        effects: {
          onSuccess: { nextScene: 'kruger_respect' },
          onFailure: { nextScene: 'kruger_annoyed' },
        },
      },
    ],
  },

  kruger_impressed: {
    id: 'kruger_impressed',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '(Поднимает бровь) Смотри-ка. Не совсем тупой. Ладно, слушай внимательно.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    nextScene: 'kruger_briefing',
  },

  kruger_respect: {
    id: 'kruger_respect',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '(Неожиданно усмехается) Ха! Характер есть. Это хорошо. Здесь выживают только те, кто не боится показать зубы.',
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ] Он тебя запомнил. В хорошем смысле.',
        emotion: { primary: 'determined', intensity: 75 },
      },
    ],
    nextScene: 'kruger_briefing',
  },

  kruger_annoyed: {
    id: 'kruger_annoyed',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'angry', intensity: 80 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '(Ледяным голосом) Ты что-то сказал, мясо? Нет? Вот и молчи.',
        emotion: { primary: 'angry', intensity: 85 },
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '[ПРОВАЛ] Позор. Ты звучал как писклявый котёнок.',
        emotion: { primary: 'sad', intensity: 40 },
      },
    ],
    nextScene: 'kruger_briefing',
  },

  kruger_briefing: {
    id: 'kruger_briefing',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'determined', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Слушай сюда. Штадтгартен — наша буферная зона. Раньше был парком. Теперь — рассадник всякой дряни.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Твоя задача: пройти маршрут от входа до разрушенной беседки. Отмечать аномалии. Уничтожать мелких тварей. Не сдохнуть.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Простой маршрут. Но "мелкие твари" — понятие растяжимое. Он явно что-то недоговаривает.',
        emotion: { primary: 'determined', intensity: 80 },
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Оружие есть? Покажи.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'show_weapon',
        text: 'Показать своё оружие.',
        nextScene: 'kruger_weapon_check',
        availability: {
          condition: { flag: 'has_weapon' },
        },
      },
      {
        id: 'no_weapon',
        text: '"Только мультитул."',
        nextScene: 'kruger_give_weapon',
      },
      {
        id: 'ask_about_dangers',
        text: '"Что за твари там водятся?"',
        nextScene: 'kruger_danger_info',
      },
    ],
  },

  kruger_give_weapon: {
    id: 'kruger_give_weapon',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'angry', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '(Сплёвывает) Мультитул. Охуеть. Собрался тварей отвёрткой колоть?',
        emotion: { primary: 'angry', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Он лезет в ящик у своих ног и достаёт потёртую дубинку.',
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Держи. Вернёшь после патруля. Целым. Вместе с собой.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'take_baton',
        text: 'Взять дубинку.',
        nextScene: 'kruger_patrol_start',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'fjr_baton', amount: 1 } },
          ],
          flags: [{ key: 'borrowed_kruger_weapon', value: true }],
        },
      },
    ],
  },

  kruger_weapon_check: {
    id: 'kruger_weapon_check',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '(Осматривает) Сойдёт. По крайней мере, не голыми руками пойдёшь.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    nextScene: 'kruger_patrol_start',
  },

  kruger_danger_info: {
    id: 'kruger_danger_info',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Мусорщики. Мелкие, но стаями нападают. Дикие собаки — одичавшие, заражённые. И изредка... кое-что покрупнее.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Мусорщики — мутировавшие грызуны. Опасны числом. Дикие собаки — агрессивны, но предсказуемы. "Покрупнее" — вероятно, случайный монстр из аномалии.',
        emotion: { primary: 'neutral', intensity: 75 },
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Если увидишь что-то больше себя — беги. Это не трусость, это здравый смысл.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'ready_to_go',
        text: '"Понял. Я готов."',
        nextScene: 'kruger_patrol_start',
      },
    ],
  },

  kruger_patrol_start: {
    id: 'kruger_patrol_start',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Последнее. Не геройствуй. Мне не нужен труп, мне нужен отчёт.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Я буду ждать здесь. У тебя час. Не вернёшься — пошлю группу собирать то, что от тебя останется.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: '(Шипит) Час! Всего час! А что, если там ловушка? Что, если он специально посылает тебя на смерть?!',
        emotion: { primary: 'worried', intensity: 75 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Нет смысла убивать рекрутов. Он проверяет твою полезность. Стандартная процедура.',
        emotion: { primary: 'determined', intensity: 80 },
      },
    ],
    choices: [
      {
        id: 'begin_patrol',
        text: 'Войти в Штадтгартен.',
        nextScene: 'stadtgarten_entrance',
        effects: {
          flags: [
            { key: 'patrol_started', value: true },
            { key: 'met_kruger', value: true },
          ],
          immediate: [
            { type: 'quest', data: { questId: 'baptism_by_fire', action: 'progress', stepId: 'briefing_with_kruger' } },
          ],
        },
      },
    ],
  },

  // =====================================
  // ПАТРУЛИРОВАНИЕ ШТАДТГАРТЕНА
  // =====================================

  stadtgarten_entrance: {
    id: 'stadtgarten_entrance',
    background: STADTGARTEN_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Штадтгартен встречает вас тишиной. Но это не мирная тишина парка — это напряжённое молчание, полное скрытой угрозы.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Заросшие дорожки. Опрокинутые скамейки. Следы когтей на коре деревьев. Здесь что-то живёт.',
        emotion: { primary: 'neutral', intensity: 75 },
      },
      {
        speaker: 'ИНТУИЦИЯ',
        text: '(Шёпот) ...не один... они следят... из кустов...',
        emotion: { primary: 'worried', intensity: 40 },
      },
    ],
    choices: [
      {
        id: 'proceed_carefully',
        text: 'Осторожно продвигаться по маршруту.',
        nextScene: 'stadtgarten_first_encounter',
      },
      {
        id: 'scout_area',
        text: '[ВОСПРИЯТИЕ] Внимательно осмотреть окрестности. (Сложность 7)',
        presentation: {
          color: 'skill',
          icon: '👁️',
          tooltip: 'Требуется ВОСПРИЯТИЕ',
        },
        availability: {
          skillCheck: {
            skill: 'perception',
            difficulty: 7,
            successText: 'Ты замечаешь движение в кустах!',
            failureText: 'Ничего подозрительного... кажется.',
          },
        },
        effects: {
          onSuccess: { nextScene: 'stadtgarten_ambush_avoided' },
          onFailure: { nextScene: 'stadtgarten_first_encounter' },
        },
      },
    ],
  },

  stadtgarten_ambush_avoided: {
    id: 'stadtgarten_ambush_avoided',
    background: STADTGARTEN_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ] Движение! Справа, в кустах. Минимум трое. Они готовят засаду.',
        emotion: { primary: 'determined', intensity: 80 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Вы замираете. Три пары жёлтых глаз следят за вами из зарослей. Мусорщики.',
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Преимущество за тобой. Ты видишь их, они не знают, что ты их видишь. Варианты: обойти, ударить первым, или спугнуть.',
        emotion: { primary: 'determined', intensity: 85 },
      },
    ],
    choices: [
      {
        id: 'strike_first',
        text: 'Ударить первым, пока есть преимущество.',
        nextScene: 'stadtgarten_combat_advantage',
        effects: {
          flags: [{ key: 'combat_advantage', value: true }],
        },
      },
      {
        id: 'go_around',
        text: 'Тихо обойти засаду.',
        nextScene: 'stadtgarten_stealth_success',
        effects: {
          xp: 10,
          flags: [{ key: 'avoided_first_fight', value: true }],
        },
      },
      {
        id: 'scare_them',
        text: '[АВТОРИТЕТ] Издать громкий крик, чтобы спугнуть. (Сложность 8)',
        presentation: {
          color: 'bold',
          icon: '👑',
          tooltip: 'Требуется АВТОРИТЕТ',
        },
        availability: {
          skillCheck: {
            skill: 'authority',
            difficulty: 8,
            successText: 'Твой рёв эхом разносится по парку!',
            failureText: 'Они не впечатлены...',
          },
        },
        effects: {
          onSuccess: { nextScene: 'stadtgarten_scare_success' },
          onFailure: { nextScene: 'stadtgarten_combat_disadvantage' },
        },
      },
    ],
  },

  stadtgarten_first_encounter: {
    id: 'stadtgarten_first_encounter',
    background: STADTGARTEN_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Шорох справа. Вы резко оборачиваетесь — слишком поздно.',
      },
      {
        speaker: 'РЕФЛЕКСЫ',
        text: '[ПАРАМЕТР: ТЕЛО/РЕФЛЕКСЫ (Успех)] Инстинкты срабатывают. Вы отпрыгиваете назад, и челюсти Мусорщика щёлкают в воздухе.',
        emotion: { primary: 'neutral', intensity: 80 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Из кустов выскакивают ещё двое. Крысоподобные твари размером с собаку, с голой кожей и жёлтыми глазами.',
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'ЗАСАДА! Я ГОВОРИЛ! Я ПРЕДУПРЕЖДАЛ!',
        emotion: { primary: 'worried', intensity: 90 },
      },
    ],
    choices: [
      {
        id: 'fight',
        text: 'Принять бой!',
        nextScene: 'stadtgarten_combat',
      },
    ],
  },

  stadtgarten_combat: {
    id: 'stadtgarten_combat',
    background: STADTGARTEN_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: '[БОЕВАЯ СЦЕНА — Мусорщики x3]',
      },
      {
        speaker: 'Рассказчик',
        text: 'Бой короткий, но жестокий. Мусорщики атакуют стаей, пытаясь окружить. Ваше оружие находит цели.',
      },
      {
        speaker: 'РЕФЛЕКСЫ',
        text: '[ПАРАМЕТР: ТЕЛО/РЕФЛЕКСЫ (Успех)] Удар. Ещё удар. Один падает. Второй отскакивает. Третий пытается зайти сзади — ты успеваешь развернуться.',
        emotion: { primary: 'determined', intensity: 85 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Через минуту всё кончено. Три тела лежат на траве. Вы тяжело дышите.',
      },
    ],
    choices: [
      {
        id: 'continue_patrol',
        text: 'Продолжить патруль.',
        nextScene: 'stadtgarten_gazebo',
        effects: {
          xp: 15,
          flags: [{ key: 'first_combat_won', value: true }],
        },
      },
      {
        id: 'loot_bodies',
        text: 'Обыскать тела.',
        nextScene: 'stadtgarten_loot',
      },
    ],
  },

  stadtgarten_combat_advantage: {
    id: 'stadtgarten_combat_advantage',
    background: STADTGARTEN_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы бросаетесь вперёд, застав тварей врасплох. Первый удар сносит ближайшего Мусорщика.',
      },
      {
        speaker: 'РЕФЛЕКСЫ',
        text: '[ПАРАМЕТР: ТЕЛО/РЕФЛЕКСЫ (Успех)] Преимущество неожиданности. Они в панике. Добей их, пока не опомнились!',
        emotion: { primary: 'determined', intensity: 85 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Бой заканчивается быстро. Вы даже не запыхались.',
      },
    ],
    choices: [
      {
        id: 'continue',
        text: 'Продолжить патруль.',
        nextScene: 'stadtgarten_gazebo',
        effects: {
          xp: 20,
          flags: [{ key: 'first_combat_won', value: true }],
        },
      },
    ],
  },

  stadtgarten_stealth_success: {
    id: 'stadtgarten_stealth_success',
    background: STADTGARTEN_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы тихо отступаете и обходите засаду по широкой дуге. Мусорщики так и не поняли, что их заметили.',
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Умный ход. Зачем тратить силы, если можно обойти?',
        emotion: { primary: 'determined', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'continue',
        text: 'Продолжить патруль.',
        nextScene: 'stadtgarten_gazebo',
      },
    ],
  },

  stadtgarten_scare_success: {
    id: 'stadtgarten_scare_success',
    background: STADTGARTEN_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ваш крик разрывает тишину парка. Мусорщики в панике бросаются врассыпную, исчезая в зарослях.',
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ] Они тебя боятся. Запомни это чувство.',
        emotion: { primary: 'determined', intensity: 80 },
      },
    ],
    choices: [
      {
        id: 'continue',
        text: 'Продолжить патруль с гордо поднятой головой.',
        nextScene: 'stadtgarten_gazebo',
        effects: {
          xp: 10,
        },
      },
    ],
  },

  stadtgarten_combat_disadvantage: {
    id: 'stadtgarten_combat_disadvantage',
    background: STADTGARTEN_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ваш крик звучит... неубедительно. Мусорщики, наоборот, принимают это за знак слабости и бросаются в атаку.',
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '[ПРОВАЛ] Поздравляю. Ты их разозлил.',
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    nextScene: 'stadtgarten_combat',
  },

  stadtgarten_loot: {
    id: 'stadtgarten_loot',
    background: STADTGARTEN_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы обыскиваете тела. Мусорщики — падальщики, и иногда они таскают с собой интересные находки.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] В желудке одного что-то блестит. Старый жетон. И... несколько кредитов.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'take_loot',
        text: 'Забрать находки.',
        nextScene: 'stadtgarten_gazebo',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: 8 } },
            { type: 'item', data: { itemId: 'old_badge', amount: 1 } },
          ],
        },
      },
    ],
  },

  stadtgarten_gazebo: {
    id: 'stadtgarten_gazebo',
    background: STADTGARTEN_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы достигаете разрушенной беседки — конечной точки маршрута. Крыша провалилась, но стены ещё стоят.',
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Когда-то здесь играл оркестр. Теперь только ветер гуляет среди обломков.',
        emotion: { primary: 'sad', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Патруль завершён. Пора возвращаться к Крюгеру.',
      },
    ],
    choices: [
      {
        id: 'return',
        text: 'Вернуться к Крюгеру.',
        nextScene: 'kruger_debriefing',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'baptism_by_fire', action: 'progress', stepId: 'patrol_stadtgarten' } },
          ],
        },
      },
    ],
  },

  // =====================================
  // РАЗБОР ПОЛЁТОВ
  // =====================================

  kruger_debriefing: {
    id: 'kruger_debriefing',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '(Смотрит на вас оценивающе) Живой. Уже хорошо. Отчёт.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'report_combat',
        text: 'Доложить о столкновении с Мусорщиками.',
        nextScene: 'kruger_combat_report',
        availability: {
          condition: { flag: 'first_combat_won' },
        },
      },
      {
        id: 'report_stealth',
        text: 'Доложить об избегании столкновения.',
        nextScene: 'kruger_stealth_report',
        availability: {
          condition: { flag: 'avoided_first_fight' },
        },
      },
      {
        id: 'report_clear',
        text: '"Маршрут чист."',
        nextScene: 'kruger_clear_report',
      },
    ],
  },

  kruger_combat_report: {
    id: 'kruger_combat_report',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '(Кивает) Мусорщики. Сколько?',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Вы',
        text: 'Трое. Устроили засаду у старых клумб.',
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'И ты их всех? Один? (Неожиданно усмехается) Неплохо, мясо. Неплохо.',
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    nextScene: 'kruger_quest_complete',
  },

  kruger_stealth_report: {
    id: 'kruger_stealth_report',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Обошёл? Заметил засаду и обошёл?',
        emotion: { primary: 'surprised', intensity: 60 },
      },
      {
        speaker: 'Вы',
        text: 'Не видел смысла рисковать без необходимости.',
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '(Задумчиво) Хм. Не геройствовал. Думал головой. Это... редкость.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    nextScene: 'kruger_quest_complete',
  },

  kruger_clear_report: {
    id: 'kruger_clear_report',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'neutral', intensity: 50 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '(Пристально смотрит) Чист? Совсем?',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'Он не верит! Он знает, что ты врёшь!',
        emotion: { primary: 'worried', intensity: 70 },
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: '...Ладно. Принимается.',
        emotion: { primary: 'neutral', intensity: 50 },
      },
    ],
    nextScene: 'kruger_quest_complete',
  },

  kruger_quest_complete: {
    id: 'kruger_quest_complete',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Задание выполнено. Держи свои кредиты.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Он отсчитывает пятьдесят кредитов и бросает вам.',
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Если хочешь ещё работы — приходи. FJR всегда нужны люди, которые возвращаются живыми.',
        emotion: { primary: 'determined', intensity: 65 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Первое задание выполнено. Репутация в FJR растёт. Это открывает новые возможности.',
        emotion: { primary: 'determined', intensity: 80 },
      },
    ],
    choices: [
      {
        id: 'take_reward',
        text: 'Взять награду и уйти.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: 50 } },
            { type: 'quest', data: { questId: 'baptism_by_fire', action: 'complete' } },
            { type: 'reputation', data: { faction: 'fjr', delta: 15 } },
          ],
          flags: [
            { key: 'baptism_complete', value: true },
            { key: 'fjr_trusted', value: true },
          ],
          xp: 25,
        },
      },
      {
        id: 'ask_about_more',
        text: '"Что ещё есть?"',
        nextScene: 'kruger_more_work',
      },
    ],
  },

  kruger_more_work: {
    id: 'kruger_more_work',
    background: STADTGARTEN_BACKGROUND,
    characters: [
      {
        id: 'kruger',
        name: 'Сержант Крюгер',
        position: 'center',
        sprite: KRUGER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'Рвёшься в бой? Хорошо. Приходи завтра на тренировочную площадку. Посмотрим, чего ты стоишь в настоящем бою.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'Сержант Крюгер',
        characterId: 'kruger',
        text: 'И если докажешь себя... Может, представлю тебя команданту Хольцу.',
        emotion: { primary: 'determined', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'agree',
        text: '"Буду."',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: 50 } },
            { type: 'quest', data: { questId: 'baptism_by_fire', action: 'complete' } },
            { type: 'quest', data: { questId: 'fjr_training', action: 'start' } },
            { type: 'reputation', data: { faction: 'fjr', delta: 15 } },
          ],
          flags: [
            { key: 'baptism_complete', value: true },
            { key: 'fjr_trusted', value: true },
            { key: 'kruger_training_offered', value: true },
          ],
          xp: 25,
        },
      },
    ],
  },
}







