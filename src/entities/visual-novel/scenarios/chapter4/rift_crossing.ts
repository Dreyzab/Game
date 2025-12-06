/**
 * rift_crossing.ts — Сценарий перехода через Разлом (Глава IV)
 * 
 * Локация: "Серость" (The Pale) — зона между безопасной территорией и целью
 * 
 * Механика: 
 * - Индивидуальные проверки (The Trials)
 * - Накопление энтропии
 * - AR-эффекты искажения реальности
 */

import type { 
  PolyphonicScene, 
  PolyphonicDialogue, 
  PrivateInjection,
  PolyphonicChoice,
} from '../../model/types'

// ============================================================================
// PRIVATE INJECTIONS — Голоса во время перехода
// ============================================================================

/**
 * Инъекции при входе в Разлом
 */
const riftEntryInjections: PrivateInjection[] = [
  {
    id: 'rift_entry_perception_change',
    voice: 'perception',
    voiceGroup: 'motorics',
    threshold: 35,
    text: 'Воздух стал тяжелее. Цвета блёкнут. Это не оптическая иллюзия — это реальность меняется.',
    effect: 'glitch',
    priority: 8,
    voiceName: 'ВОСПРИЯТИЕ',
  },
  {
    id: 'rift_entry_logic_timer',
    voice: 'logic',
    voiceGroup: 'mind',
    threshold: 40,
    text: 'Двадцать восемь минут. Отсчёт начался. Каждая секунда на счету.',
    effect: 'terminal',
    priority: 7,
    voiceName: 'ЛОГИКА',
    requiredFlag: 'has_real_time_info',
  },
  {
    id: 'rift_entry_courage_forward',
    voice: 'courage',
    voiceGroup: 'consciousness',
    threshold: 45,
    text: 'Это и есть испытание. То, ради чего мы здесь. Страх — просто ещё один враг. И мы его победим.',
    effect: 'pulse',
    priority: 6,
    voiceName: 'ОТВАГА',
  },
  {
    id: 'rift_entry_empathy_team',
    voice: 'empathy',
    voiceGroup: 'sociality',
    threshold: 40,
    text: 'Проверь товарищей. Их лица. Они напуганы не меньше. Но никто не покажет этого. Держись рядом.',
    effect: 'glow',
    priority: 5,
    voiceName: 'ЭМПАТИЯ',
  },
  {
    id: 'rift_entry_gambling_odds',
    voice: 'gambling',
    voiceGroup: 'psyche',
    threshold: 50,
    text: 'Четверо входят. Сколько выйдет? Три? Два? Ставки сделаны. Игра началась.',
    effect: 'glitch',
    priority: 4,
    voiceName: 'АЗАРТ',
  },
]

/**
 * Инъекции при пространственной петле
 */
const spatialLoopInjections: PrivateInjection[] = [
  {
    id: 'loop_coordination_navigate',
    voice: 'coordination',
    voiceGroup: 'motorics',
    threshold: 50,
    text: 'Геометрия искривлена. Но тело помнит. Закрой глаза. Почувствуй направление. Доверься мышечной памяти.',
    effect: 'pulse',
    priority: 9,
    voiceName: 'КООРДИНАЦИЯ',
    onView: {
      unlockHint: 'Закрыть глаза поможет пройти петлю',
    },
  },
  {
    id: 'loop_logic_recursion',
    voice: 'logic',
    voiceGroup: 'mind',
    threshold: 55,
    text: 'Рекурсия пространства. Каждый шаг возвращает на два назад. Решение: изменить вектор движения на 90 градусов. Шаг влево, чтобы идти прямо.',
    effect: 'terminal',
    priority: 10,
    voiceName: 'ЛОГИКА',
    onView: {
      addFlags: ['knows_loop_solution'],
      unlockHint: 'Шаг влево = шаг вперёд',
    },
  },
  {
    id: 'loop_perception_anchor',
    voice: 'perception',
    voiceGroup: 'motorics',
    threshold: 45,
    text: 'Найди ориентир. Что-то, что не меняется. Трещина в асфальте. Знак. Смотри на неё — она якорь.',
    effect: 'glitch',
    priority: 7,
    voiceName: 'ВОСПРИЯТИЕ',
  },
  {
    id: 'loop_creativity_break',
    voice: 'creativity',
    voiceGroup: 'psyche',
    threshold: 60,
    text: 'Петля ждёт, что ты будешь следовать правилам. Сломай их. Танцуй. Кружись. Смейся. Хаос против хаоса — кто победит?',
    effect: 'whisper',
    priority: 6,
    voiceName: 'ТВОРЧЕСТВО',
  },
]

/**
 * Инъекции при песне сирен
 */
const sirenSongInjections: PrivateInjection[] = [
  {
    id: 'siren_willpower_resist',
    voice: 'willpower',
    voiceGroup: 'consciousness',
    threshold: 50,
    text: 'НЕ СЛУШАЙ. ЭТО ЛОЖЬ. КАЖДОЕ СЛОВО — ЯД. ЗАКРОЙ УШИ. ДУМАЙ О МИССИИ. ТОЛЬКО О МИССИИ.',
    effect: 'pulse',
    priority: 10,
    voiceName: 'ВОЛЯ',
  },
  {
    id: 'siren_empathy_voices',
    voice: 'empathy',
    voiceGroup: 'sociality',
    threshold: 45,
    text: 'Эти голоса... они знакомы. Чьи-то матери. Отцы. Дети. Погибшие в Серости. Они не хотят зла — они хотят, чтобы кто-то помнил.',
    effect: 'glow',
    priority: 8,
    voiceName: 'ЭМПАТИЯ',
    onView: {
      addFlags: ['understands_sirens'],
    },
  },
  {
    id: 'siren_suggestion_counter',
    voice: 'suggestion',
    voiceGroup: 'consciousness',
    threshold: 55,
    text: 'Они пытаются внушить. Но внушение — твоя территория. Переверни игру. Прикажи им замолчать. Твой голос сильнее.',
    effect: 'whisper',
    priority: 9,
    voiceName: 'ВНУШЕНИЕ',
    onView: {
      addFlags: ['can_command_sirens'],
      unlockHint: 'Можно приказать голосам замолчать',
    },
  },
  {
    id: 'siren_drama_performance',
    voice: 'drama',
    voiceGroup: 'psyche',
    threshold: 40,
    text: 'Красиво. Трагично. Эти голоса — как хор в греческой трагедии. Они поют о смерти и потере. Но ты — не трагический герой. Ты — выживший.',
    effect: 'whisper',
    priority: 5,
    voiceName: 'ДРАМА',
  },
]

/**
 * Инъекции при гравитационном колодце
 */
const gravityWellInjections: PrivateInjection[] = [
  {
    id: 'gravity_endurance_push',
    voice: 'endurance',
    voiceGroup: 'body',
    threshold: 50,
    text: 'Тяжело? Хорошо. Боль — это слабость, покидающая тело. Ещё шаг. Ещё один. Не останавливайся.',
    effect: 'pulse',
    priority: 9,
    voiceName: 'СТОЙКОСТЬ',
  },
  {
    id: 'gravity_strength_carry',
    voice: 'strength',
    voiceGroup: 'body',
    threshold: 55,
    text: 'Рюкзак весит тонну? Неважно. Мы несли и больше. Спина прямо. Ноги вперёд. Мы — машина, которая не ломается.',
    effect: 'pulse',
    priority: 8,
    voiceName: 'СИЛА',
  },
  {
    id: 'gravity_logic_distribute',
    voice: 'logic',
    voiceGroup: 'mind',
    threshold: 45,
    text: 'Гравитационная аномалия. Перераспредели вес — больше на переднюю часть стопы. Используй инерцию. Физика всё ещё работает.',
    effect: 'terminal',
    priority: 7,
    voiceName: 'ЛОГИКА',
  },
  {
    id: 'gravity_solidarity_help',
    voice: 'solidarity',
    voiceGroup: 'sociality',
    threshold: 40,
    text: 'Кто-то из отряда отстаёт. Возьми часть его груза. Один упавший — слабое звено. Мы сильнее вместе.',
    effect: 'glow',
    priority: 6,
    voiceName: 'СОЛИДАРНОСТЬ',
  },
]

/**
 * Инъекции при встрече с Мимиком
 */
const mimicEncounterInjections: PrivateInjection[] = [
  {
    id: 'mimic_perception_eyes',
    voice: 'perception',
    voiceGroup: 'motorics',
    threshold: 45,
    text: 'Глаза. Смотри на глаза. Он моргнул? Нет. Это Мимик. Действуй.',
    effect: 'glitch',
    priority: 10,
    voiceName: 'ВОСПРИЯТИЕ',
    requiredFlag: 'knows_mimic_tell',
    onView: {
      addFlags: ['spotted_mimic'],
    },
  },
  {
    id: 'mimic_suggestion_test',
    voice: 'suggestion',
    voiceGroup: 'consciousness',
    threshold: 50,
    text: 'Задай вопрос. Что-то личное. Имя первого питомца. Любимая песня. Если запнётся — это не он.',
    effect: 'whisper',
    priority: 9,
    voiceName: 'ВНУШЕНИЕ',
    requiredFlag: 'has_verification_protocol',
  },
  {
    id: 'mimic_empathy_wrong',
    voice: 'empathy',
    voiceGroup: 'sociality',
    threshold: 55,
    text: 'Что-то не так. Это тело, которое ты знаешь. Но душа... пустота. Как будто смотришь на восковую фигуру.',
    effect: 'glow',
    priority: 8,
    voiceName: 'ЭМПАТИЯ',
    onView: {
      addFlags: ['sensed_mimic_emptiness'],
    },
  },
  {
    id: 'mimic_reaction_ready',
    voice: 'reaction',
    voiceGroup: 'motorics',
    threshold: 50,
    text: 'Оружие наготове. Первый выстрел — в голову. Или то, что выглядит как голова. Не медли.',
    effect: 'pulse',
    priority: 7,
    voiceName: 'РЕАКЦИЯ',
  },
]

/**
 * Инъекции при обнаружении Библиотеки
 */
const libraryApproachInjections: PrivateInjection[] = [
  {
    id: 'library_analysis_structure',
    voice: 'analysis',
    voiceGroup: 'mind',
    threshold: 45,
    text: 'Структурные повреждения: 40%. Левое крыло — обвал. Центральный вход — завален. Но боковая дверь... открыта.',
    effect: 'terminal',
    priority: 8,
    voiceName: 'АНАЛИЗ',
    requiredFlag: 'knows_entry_points',
  },
  {
    id: 'library_perception_trap',
    voice: 'perception',
    voiceGroup: 'motorics',
    threshold: 55,
    text: '"Открыта" — это не "безопасна". Слишком удобно. Засада внутри. Или ловушка.',
    effect: 'glitch',
    priority: 9,
    voiceName: 'ВОСПРИЯТИЕ',
    requiredFlag: 'knows_main_entrance_trap',
    onView: {
      addFlags: ['suspects_side_door_trap'],
    },
  },
  {
    id: 'library_courage_enter',
    voice: 'courage',
    voiceGroup: 'consciousness',
    threshold: 50,
    text: 'Это оно. Цель. Мы дошли. Теперь — самое трудное. Войти. И выйти живыми.',
    effect: 'pulse',
    priority: 6,
    voiceName: 'ОТВАГА',
  },
  {
    id: 'library_honor_rescue',
    voice: 'honor',
    voiceGroup: 'sociality',
    threshold: 45,
    text: 'Где-то там — люди Хольца. Живые. Ждут спасения. Мы не уйдём без них.',
    effect: 'glow',
    priority: 7,
    voiceName: 'ЧЕСТЬ',
    requiredFlag: 'knows_prisoners_location',
  },
]

// ============================================================================
// DIALOGUES — Диалоги перехода через Разлом
// ============================================================================

const dialogues: PolyphonicDialogue[] = [
  // === ВХОД В РАЗЛОМ ===
  {
    id: 'rift_entry',
    sharedContent: {
      text: 'Вы пересекаете невидимую границу. Мир вокруг меняется — цвета тускнеют, звуки приглушаются. Серость.',
      speaker: 'Narrator',
      background: '/images/backgrounds/rift_entry.jpg',
    },
    privateInjections: riftEntryInjections,
    nextDialogue: 'rift_first_steps',
  },
  
  {
    id: 'rift_first_steps',
    sharedContent: {
      text: 'Первые шаги даются легко. Слишком легко. Улицы Фрайбурга узнаваемы — но что-то не так. Тени падают не в ту сторону. Солнца нет, но свет есть.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'first_steps_perception_wrong',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 40,
        text: 'Тени. Они движутся. Когда ты не смотришь — они меняют форму. Это не паранойя. Это реальность.',
        effect: 'glitch',
        priority: 8,
        voiceName: 'ВОСПРИЯТИЕ',
      },
      {
        id: 'first_steps_logic_physics',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 50,
        text: 'Нарушение базовых физических законов. Свет без источника. Тени вопреки геометрии. Мы не в нашем мире. Мы в... проекции.',
        effect: 'terminal',
        priority: 7,
        voiceName: 'ЛОГИКА',
      },
    ],
    nextDialogue: 'rift_choice_route',
  },
  
  // === ВЫБОР МАРШРУТА ===
  {
    id: 'rift_choice_route',
    sharedContent: {
      text: 'Впереди — развилка. Основная дорога ведёт через площадь. Узкий переулок — в обход. Какой путь выбрать?',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'route_analysis_options',
        voice: 'analysis',
        voiceGroup: 'mind',
        threshold: 45,
        text: 'Площадь — открытое пространство. Уязвимы со всех сторон. Переулок — ограниченная видимость, но меньше шансов быть замеченными.',
        effect: 'terminal',
        priority: 8,
        voiceName: 'АНАЛИЗ',
      },
      {
        id: 'route_perception_danger',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 50,
        text: 'Площадь. Там что-то есть. Не видно, но... чувствуется. Давление. Присутствие.',
        effect: 'glitch',
        priority: 9,
        voiceName: 'ВОСПРИЯТИЕ',
        onView: {
          addFlags: ['sensed_plaza_danger'],
        },
      },
      {
        id: 'route_courage_direct',
        voice: 'courage',
        voiceGroup: 'consciousness',
        threshold: 55,
        text: 'Прямой путь. Всегда прямой путь. Прятаться по углам — для трусов.',
        effect: 'pulse',
        priority: 5,
        voiceName: 'ОТВАГА',
      },
    ],
    options: [
      {
        id: 'route_plaza',
        text: 'Через площадь. Быстрее.',
        nextDialogue: 'rift_plaza_approach',
        effects: {
          addFlags: ['chose_plaza_route'],
        },
      },
      {
        id: 'route_alley',
        text: 'Через переулок. Безопаснее.',
        nextDialogue: 'rift_alley_approach',
        effects: {
          addFlags: ['chose_alley_route'],
        },
      },
      {
        id: 'route_thermal',
        text: '[Термосканер] Проверить площадь перед выбором.',
        nextDialogue: 'rift_thermal_scan',
        requiredFlag: 'has_thermal_scanner',
        presentation: {
          color: 'cyan',
          icon: 'thermal',
          tooltip: 'Использовать термальный сканер',
        },
      },
    ],
  },
  
  // === ТЕРМАЛЬНОЕ СКАНИРОВАНИЕ ===
  {
    id: 'rift_thermal_scan',
    sharedContent: {
      text: 'Термальный сканер оживает. Экран расцветает пятнами тепла.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'thermal_logic_read',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Три источника тепла на площади. Неподвижны. Температура — ниже человеческой. Големы.',
        effect: 'terminal',
        priority: 10,
        voiceName: 'ЛОГИКА',
        onView: {
          addFlags: ['confirmed_golems_plaza'],
          unlockHint: 'Три Голема на площади',
        },
      },
    ],
    nextDialogue: 'rift_thermal_result',
  },
  
  {
    id: 'rift_thermal_result',
    sharedContent: {
      text: 'На площади — три неподвижные фигуры. Температура тела — на пятнадцать градусов ниже нормы. Это не люди.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'thermal_analysis_type',
        voice: 'analysis',
        voiceGroup: 'mind',
        threshold: 50,
        text: 'Низкая температура. Вероятно, "Глыбы" — каменные конструкты. Медленные, но бронированные. Лобовая атака — самоубийство.',
        effect: 'terminal',
        priority: 9,
        voiceName: 'АНАЛИЗ',
      },
      {
        id: 'thermal_coordination_plan',
        voice: 'coordination',
        voiceGroup: 'motorics',
        threshold: 45,
        text: 'Переулок. Однозначно переулок. Обойдём их. Сохраним силы для настоящего боя.',
        effect: 'none',
        priority: 7,
        voiceName: 'КООРДИНАЦИЯ',
      },
    ],
    options: [
      {
        id: 'after_scan_alley',
        text: 'Переулок. Не стоит рисковать.',
        nextDialogue: 'rift_alley_approach',
        effects: {
          addFlags: ['chose_alley_route', 'avoided_golem_ambush'],
          xp: 15,
        },
      },
      {
        id: 'after_scan_plaza_anyway',
        text: '[Отвага] Три Голема? Мы справимся.',
        nextDialogue: 'rift_plaza_ambush',
        requiredStat: { stat: 'courage', value: 60 },
        presentation: {
          color: 'violet',
          icon: 'courage',
          voiceHint: 'courage',
        },
        effects: {
          addFlags: ['chose_plaza_fight'],
        },
      },
    ],
  },
  
  // === ПУТЬ ЧЕРЕЗ ПЛОЩАДЬ ===
  {
    id: 'rift_plaza_approach',
    sharedContent: {
      text: 'Вы выходите на площадь. Старый фонтан в центре давно высох. Вокруг — статуи. Много статуй. Слишком много.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'plaza_perception_statues',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 45,
        text: 'Статуи. Они стоят не так, как должны стоять статуи. Слишком... готовые. Как солдаты перед атакой.',
        effect: 'glitch',
        priority: 10,
        voiceName: 'ВОСПРИЯТИЕ',
        onView: {
          addFlags: ['noticed_statue_positions'],
        },
      },
      {
        id: 'plaza_courage_walk',
        voice: 'courage',
        voiceGroup: 'consciousness',
        threshold: 40,
        text: 'Иди. Не беги. Не показывай страха. Они чувствуют страх.',
        effect: 'pulse',
        priority: 7,
        voiceName: 'ОТВАГА',
      },
    ],
    nextDialogue: 'rift_plaza_ambush',
  },
  
  {
    id: 'rift_plaza_ambush',
    sharedContent: {
      text: 'Статуи оживают. Каменные тела разворачиваются с хрустом. Глаза — пустые провалы — смотрят на вас. Големы.',
      speaker: 'Narrator',
      background: '/images/backgrounds/golem_ambush.jpg',
    },
    privateInjections: [
      {
        id: 'ambush_reaction_ready',
        voice: 'reaction',
        voiceGroup: 'motorics',
        threshold: 50,
        text: 'ОРУЖИЕ. СЕЙЧАС. ПЕРВЫЙ СПРАВА — ОН БЛИЖЕ ВСЕХ.',
        effect: 'pulse',
        priority: 10,
        voiceName: 'РЕАКЦИЯ',
      },
      {
        id: 'ambush_logic_weak_points',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 55,
        text: 'Стыки. Суставы. Там соединения слабее. Бей туда.',
        effect: 'terminal',
        priority: 9,
        voiceName: 'ЛОГИКА',
        onView: {
          addFlags: ['knows_golem_weakpoints'],
        },
      },
      {
        id: 'ambush_strength_charge',
        voice: 'strength',
        voiceGroup: 'body',
        threshold: 60,
        text: 'ОНИ МЕДЛЕННЫЕ. МЫ — НЕТ. В АТАКУ. РАЗБИТЬ ИХ РАНЬШЕ, ЧЕМ ОНИ ПОСТРОЯТСЯ.',
        effect: 'pulse',
        priority: 8,
        voiceName: 'СИЛА',
      },
    ],
    options: [
      {
        id: 'fight_golems',
        text: 'К бою!',
        nextScene: 'combat_golem_plaza',
        effects: {
          addFlags: ['entered_combat', 'plaza_battle'],
        },
      },
      {
        id: 'retreat_golems',
        text: '[Координация] Отступаем в переулок!',
        nextDialogue: 'rift_tactical_retreat',
        requiredStat: { stat: 'coordination', value: 55 },
        presentation: {
          color: 'amber',
          icon: 'coordination',
          voiceHint: 'coordination',
        },
        effects: {
          addFlags: ['tactical_retreat'],
        },
      },
    ],
  },
  
  // === ТАКТИЧЕСКОЕ ОТСТУПЛЕНИЕ ===
  {
    id: 'rift_tactical_retreat',
    sharedContent: {
      text: 'Вы бросаетесь назад. Големы — медленные, но неутомимые. Они идут за вами.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'retreat_coordination_lead',
        voice: 'coordination',
        voiceGroup: 'motorics',
        threshold: 45,
        text: 'Переулок. Там они не смогут атаковать всей массой. Один за одним — это мы можем.',
        effect: 'none',
        priority: 8,
        voiceName: 'КООРДИНАЦИЯ',
      },
      {
        id: 'retreat_endurance_run',
        voice: 'endurance',
        voiceGroup: 'body',
        threshold: 40,
        text: 'Бежим. Но не слишком быстро. Сохранить силы на бой.',
        effect: 'pulse',
        priority: 6,
        voiceName: 'СТОЙКОСТЬ',
      },
    ],
    nextDialogue: 'rift_alley_approach',
  },
  
  // === ПУТЬ ЧЕРЕЗ ПЕРЕУЛОК ===
  {
    id: 'rift_alley_approach',
    sharedContent: {
      text: 'Узкий переулок. Стены давят с обеих сторон. Тихо. Слишком тихо.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'alley_perception_listen',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 40,
        text: 'Слушай. Шаги? Нет. Дыхание? Нет. Но что-то есть. Ощущение взгляда на спине.',
        effect: 'glitch',
        priority: 8,
        voiceName: 'ВОСПРИЯТИЕ',
      },
      {
        id: 'alley_analysis_route',
        voice: 'analysis',
        voiceGroup: 'mind',
        threshold: 45,
        text: 'Двести метров до выхода. Три поворота. Два тупика справа — избегай их.',
        effect: 'terminal',
        priority: 7,
        voiceName: 'АНАЛИЗ',
      },
    ],
    nextDialogue: 'rift_spatial_loop',
  },
  
  // === ПРОСТРАНСТВЕННАЯ ПЕТЛЯ ===
  {
    id: 'rift_spatial_loop',
    sharedContent: {
      text: 'Ты сворачиваешь за угол и... оказываешься там, где был минуту назад. Та же трещина в стене. Тот же мусор под ногами. Пространственная петля.',
      speaker: 'Narrator',
    },
    privateInjections: spatialLoopInjections,
    options: [
      {
        id: 'loop_close_eyes',
        text: '[Координация] Закрыть глаза. Идти по памяти.',
        nextDialogue: 'rift_loop_success',
        requiredStat: { stat: 'coordination', value: 50 },
        presentation: {
          color: 'amber',
          icon: 'coordination',
          voiceHint: 'coordination',
        },
        effects: {
          addFlags: ['loop_solved_coordination'],
          xp: 20,
        },
      },
      {
        id: 'loop_step_left',
        text: '[Логика] Шаг влево. Сломать рекурсию.',
        nextDialogue: 'rift_loop_success',
        requiredStat: { stat: 'logic', value: 55 },
        requiredFlag: 'knows_loop_solution',
        presentation: {
          color: 'cyan',
          icon: 'logic',
          voiceHint: 'logic',
        },
        effects: {
          addFlags: ['loop_solved_logic'],
          xp: 25,
        },
      },
      {
        id: 'loop_chaos',
        text: '[Творчество] Танцевать. Смеяться. Сломать паттерн хаосом.',
        nextDialogue: 'rift_loop_success',
        requiredStat: { stat: 'creativity', value: 60 },
        presentation: {
          color: 'pink',
          icon: 'creativity',
          voiceHint: 'creativity',
        },
        effects: {
          addFlags: ['loop_solved_chaos'],
          xp: 30,
        },
      },
      {
        id: 'loop_brute_force',
        text: 'Просто идти вперёд. Снова и снова.',
        nextDialogue: 'rift_loop_failure',
        effects: {
          addFlags: ['loop_brute_force'],
        },
      },
    ],
  },
  
  {
    id: 'rift_loop_success',
    sharedContent: {
      text: 'Реальность сопротивляется — и сдаётся. Переулок выпрямляется. Ты вышел из петли.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'loop_success_logic',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 35,
        text: 'Разлом можно обмануть. Запомни это. Здесь работают другие правила — но правила всё же есть.',
        effect: 'terminal',
        priority: 7,
        voiceName: 'ЛОГИКА',
      },
    ],
    nextDialogue: 'rift_siren_song',
  },
  
  {
    id: 'rift_loop_failure',
    sharedContent: {
      text: 'Снова. И снова. И снова. Каждый шаг вперёд — шаг назад. Время теряется. Энергия уходит. Когда ты наконец вырываешься — ты измотан.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'loop_failure_endurance',
        voice: 'endurance',
        voiceGroup: 'body',
        threshold: 30,
        text: 'Истощение. Ноги свинцовые. Но мы всё ещё стоим. Это главное.',
        effect: 'pulse',
        priority: 8,
        voiceName: 'СТОЙКОСТЬ',
      },
    ],
    nextDialogue: 'rift_siren_song',
    effects: {
      addFlags: ['exhausted_from_loop'],
      // В боевой системе: -2 AP на первый ход
    },
  },
  
  // === ПЕСНЯ СИРЕН ===
  {
    id: 'rift_siren_song',
    sharedContent: {
      text: 'Голоса. Сначала едва слышные, потом всё громче. Они зовут. По имени. Твоим голосом. Голосами тех, кого ты любил.',
      speaker: 'Narrator',
    },
    privateInjections: sirenSongInjections,
    options: [
      {
        id: 'siren_resist',
        text: '[Воля] Заткни уши. Не слушай. Иди вперёд.',
        nextDialogue: 'rift_siren_resisted',
        requiredStat: { stat: 'willpower', value: 50 },
        presentation: {
          color: 'violet',
          icon: 'willpower',
          voiceHint: 'willpower',
        },
        effects: {
          addFlags: ['resisted_sirens'],
          xp: 20,
        },
      },
      {
        id: 'siren_command',
        text: '[Внушение] Приказать им замолчать. Твой голос — закон.',
        nextDialogue: 'rift_siren_commanded',
        requiredStat: { stat: 'suggestion', value: 55 },
        requiredFlag: 'can_command_sirens',
        presentation: {
          color: 'violet',
          icon: 'suggestion',
          voiceHint: 'suggestion',
        },
        effects: {
          addFlags: ['commanded_sirens'],
          xp: 30,
        },
      },
      {
        id: 'siren_listen',
        text: '[Эмпатия] Слушать. Понять, чего они хотят.',
        nextDialogue: 'rift_siren_listened',
        requiredStat: { stat: 'empathy', value: 50 },
        requiredFlag: 'understands_sirens',
        presentation: {
          color: 'emerald',
          icon: 'empathy',
          voiceHint: 'empathy',
        },
        effects: {
          addFlags: ['listened_to_sirens'],
          xp: 25,
        },
      },
      {
        id: 'siren_follow',
        text: 'Идти на голос...',
        nextDialogue: 'rift_siren_trap',
        effects: {
          addFlags: ['charmed_by_sirens'],
        },
      },
    ],
  },
  
  {
    id: 'rift_siren_resisted',
    sharedContent: {
      text: 'Ты сжимаешь кулаки. Шаг. Ещё шаг. Голоса кричат, плачут, умоляют — но ты не слушаешь. Постепенно они стихают.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'resisted_willpower',
        voice: 'willpower',
        voiceGroup: 'consciousness',
        threshold: 35,
        text: 'Разум сильнее иллюзий. Запомни это. Ты — хозяин своих мыслей.',
        effect: 'pulse',
        priority: 7,
        voiceName: 'ВОЛЯ',
      },
    ],
    nextDialogue: 'rift_gravity_well',
  },
  
  {
    id: 'rift_siren_commanded',
    sharedContent: {
      text: '"МОЛЧАТЬ." Твой голос разрезает какофонию. Тишина. Абсолютная. Голоса повинуются.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'commanded_suggestion_power',
        voice: 'suggestion',
        voiceGroup: 'consciousness',
        threshold: 40,
        text: 'Это место слушает тебя. Ты сильнее, чем думал. Разлом — не враг. Это... инструмент.',
        effect: 'whisper',
        priority: 9,
        voiceName: 'ВНУШЕНИЕ',
        onView: {
          addFlags: ['can_command_rift'],
        },
      },
    ],
    nextDialogue: 'rift_gravity_well',
  },
  
  {
    id: 'rift_siren_listened',
    sharedContent: {
      text: 'Ты слушаешь. Не слова — эмоции. Одиночество. Страх. Желание быть услышанными. Они не враги — они жертвы.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'listened_empathy_peace',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 35,
        text: 'Ты понимаешь их. И они понимают это. Голоса стихают — не побеждённые, но... утешенные.',
        effect: 'glow',
        priority: 8,
        voiceName: 'ЭМПАТИЯ',
        onView: {
          addFlags: ['sirens_at_peace'],
        },
      },
    ],
    nextDialogue: 'rift_gravity_well',
  },
  
  {
    id: 'rift_siren_trap',
    sharedContent: {
      text: 'Ты идёшь на голос. Знакомый. Родной. За угол. Ещё за угол. И... ничего. Пустота. Ты заблудился. Потерял время. Потерял товарищей.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'trap_perception_lost',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 30,
        text: 'Глупо. Так глупо. Они обманули тебя. Как ребёнка.',
        effect: 'glitch',
        priority: 9,
        voiceName: 'ВОСПРИЯТИЕ',
      },
    ],
    nextDialogue: 'rift_siren_trap_escape',
    effects: {
      addFlags: ['lost_in_sirens'],
      // В боевой системе: начинаем бой с дебаффом "Дезориентация"
    },
  },
  
  {
    id: 'rift_siren_trap_escape',
    sharedContent: {
      text: 'Товарищ находит тебя. Хватает за плечо. Встряхивает. "Очнись! Это ловушка!" Ты моргаешь. Реальность возвращается.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'escape_solidarity_save',
        voice: 'solidarity',
        voiceGroup: 'sociality',
        threshold: 30,
        text: 'Они не бросили тебя. Даже когда ты сам себя потерял. Это... это дорогого стоит.',
        effect: 'glow',
        priority: 8,
        voiceName: 'СОЛИДАРНОСТЬ',
      },
    ],
    nextDialogue: 'rift_gravity_well',
  },
  
  // === ГРАВИТАЦИОННЫЙ КОЛОДЕЦ ===
  {
    id: 'rift_gravity_well',
    sharedContent: {
      text: 'Воздух густеет. Каждый шаг — как через патоку. Рюкзак тянет к земле. Гравитация в этой зоне... неправильная.',
      speaker: 'Narrator',
    },
    privateInjections: gravityWellInjections,
    options: [
      {
        id: 'gravity_endure',
        text: '[Стойкость] Терпеть. Идти. Не сдаваться.',
        nextDialogue: 'rift_gravity_endured',
        requiredStat: { stat: 'endurance', value: 50 },
        presentation: {
          color: 'red',
          icon: 'endurance',
          voiceHint: 'endurance',
        },
        effects: {
          addFlags: ['endured_gravity'],
          xp: 20,
        },
      },
      {
        id: 'gravity_physics',
        text: '[Логика] Перераспределить вес. Использовать инерцию.',
        nextDialogue: 'rift_gravity_outsmarted',
        requiredStat: { stat: 'logic', value: 50 },
        presentation: {
          color: 'cyan',
          icon: 'logic',
          voiceHint: 'logic',
        },
        effects: {
          addFlags: ['outsmarted_gravity'],
          xp: 25,
        },
      },
      {
        id: 'gravity_help',
        text: '[Солидарность] Помочь товарищу. Разделить груз.',
        nextDialogue: 'rift_gravity_teamwork',
        requiredStat: { stat: 'solidarity', value: 45 },
        presentation: {
          color: 'emerald',
          icon: 'solidarity',
          voiceHint: 'solidarity',
        },
        effects: {
          addFlags: ['gravity_teamwork'],
          xp: 20,
        },
      },
      {
        id: 'gravity_struggle',
        text: 'Продолжать идти. Через силу.',
        nextDialogue: 'rift_gravity_exhausted',
        effects: {
          addFlags: ['exhausted_by_gravity'],
        },
      },
    ],
  },
  
  {
    id: 'rift_gravity_endured',
    sharedContent: {
      text: 'Боль. Усталость. Но ты не останавливаешься. Шаг за шагом. И наконец — давление спадает. Ты прошёл.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'endured_strength_victory',
        voice: 'strength',
        voiceGroup: 'body',
        threshold: 35,
        text: 'Тело не подвело. Мы сильнее этого места. Сильнее любого места.',
        effect: 'pulse',
        priority: 7,
        voiceName: 'СИЛА',
      },
    ],
    nextDialogue: 'rift_library_approach',
  },
  
  {
    id: 'rift_gravity_outsmarted',
    sharedContent: {
      text: 'Новый центр тяжести. Короткие шаги. Использование момента инерции. Физика — твой союзник даже в безумии Разлома.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'outsmarted_logic_victory',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 35,
        text: 'Законы природы можно изогнуть, но не сломать. Знание — сила. Буквально.',
        effect: 'terminal',
        priority: 7,
        voiceName: 'ЛОГИКА',
      },
    ],
    nextDialogue: 'rift_library_approach',
  },
  
  {
    id: 'rift_gravity_teamwork',
    sharedContent: {
      text: 'Вы разделяете груз. Поддерживаете друг друга. Вместе — легче. Вместе — возможно.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'teamwork_solidarity_bond',
        voice: 'solidarity',
        voiceGroup: 'sociality',
        threshold: 30,
        text: 'Мы — команда. Не просто группа людей. Команда. И команда не бросает своих.',
        effect: 'glow',
        priority: 8,
        voiceName: 'СОЛИДАРНОСТЬ',
        onView: {
          addFlags: ['team_bonded'],
        },
      },
    ],
    nextDialogue: 'rift_library_approach',
  },
  
  {
    id: 'rift_gravity_exhausted',
    sharedContent: {
      text: 'Ты продираешься сквозь давление. Но оно забирает всё. Когда аномалия отступает — ты едва стоишь на ногах.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'exhausted_endurance_warning',
        voice: 'endurance',
        voiceGroup: 'body',
        threshold: 25,
        text: 'Плохо. Очень плохо. Мы потеряли слишком много сил. Если будет бой — мы в невыгодном положении.',
        effect: 'pulse',
        priority: 9,
        voiceName: 'СТОЙКОСТЬ',
      },
    ],
    nextDialogue: 'rift_library_approach',
    effects: {
      addFlags: ['severely_exhausted'],
      // В боевой системе: начинаем с 50% Stamina
    },
  },
  
  // === ПОДХОД К БИБЛИОТЕКЕ ===
  {
    id: 'rift_library_approach',
    sharedContent: {
      text: 'И вот она. Университетская библиотека. Величественная. Разрушенная. Серость окутывает её, как саван.',
      speaker: 'Narrator',
      background: '/images/backgrounds/library_exterior.jpg',
    },
    privateInjections: libraryApproachInjections,
    options: [
      {
        id: 'library_main_entrance',
        text: 'Главный вход.',
        nextDialogue: 'rift_library_main_trap',
        effects: {
          addFlags: ['chose_main_entrance'],
        },
      },
      {
        id: 'library_side_door',
        text: 'Боковая дверь.',
        nextDialogue: 'rift_library_side_entry',
        effects: {
          addFlags: ['chose_side_entry'],
        },
      },
      {
        id: 'library_roof',
        text: '[Координация] Крыша. Через соседнее здание.',
        nextDialogue: 'rift_library_roof_entry',
        requiredStat: { stat: 'coordination', value: 55 },
        requiredFlag: 'knows_entry_points',
        presentation: {
          color: 'amber',
          icon: 'coordination',
          voiceHint: 'coordination',
        },
        effects: {
          addFlags: ['chose_roof_entry'],
        },
      },
      {
        id: 'library_sewer',
        text: '[Анализ] Канализация. Скрытно.',
        nextDialogue: 'rift_library_sewer_entry',
        requiredStat: { stat: 'analysis', value: 50 },
        requiredFlag: 'knows_entry_points',
        presentation: {
          color: 'cyan',
          icon: 'analysis',
          voiceHint: 'analysis',
        },
        effects: {
          addFlags: ['chose_sewer_entry'],
        },
      },
    ],
  },
  
  // === ВХОДЫ В БИБЛИОТЕКУ ===
  {
    id: 'rift_library_main_trap',
    sharedContent: {
      text: 'Ты делаешь шаг к главному входу — и пол под ногами проваливается. Ловушка. Классическая, жестокая ловушка.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'main_trap_reaction',
        voice: 'reaction',
        voiceGroup: 'motorics',
        threshold: 55,
        text: 'ПРЫГАЙ!',
        effect: 'pulse',
        priority: 10,
        voiceName: 'РЕАКЦИЯ',
      },
    ],
    options: [
      {
        id: 'trap_dodge',
        text: '[Реакция] Прыгнуть назад!',
        nextDialogue: 'rift_library_trap_avoided',
        requiredStat: { stat: 'reaction', value: 55 },
        presentation: {
          color: 'amber',
          icon: 'reaction',
          voiceHint: 'reaction',
        },
        effects: {
          xp: 15,
        },
      },
      {
        id: 'trap_fall',
        text: 'Падаю...',
        nextDialogue: 'rift_library_trap_fallen',
        effects: {
          addFlags: ['fell_in_trap'],
          // Урон: -20 HP
        },
      },
    ],
  },
  
  {
    id: 'rift_library_trap_avoided',
    sharedContent: {
      text: 'Ты отпрыгиваешь в последний момент. Пол рушится в пустоту. Главный вход закрыт — буквально провалился в никуда.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'avoided_perception_close',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 35,
        text: 'Близко. Слишком близко. Катарина была права — главный вход это смерть.',
        effect: 'glitch',
        priority: 8,
        voiceName: 'ВОСПРИЯТИЕ',
      },
    ],
    options: [
      {
        id: 'after_trap_side',
        text: 'Боковая дверь.',
        nextDialogue: 'rift_library_side_entry',
      },
      {
        id: 'after_trap_roof',
        text: '[Координация] Крыша.',
        nextDialogue: 'rift_library_roof_entry',
        requiredStat: { stat: 'coordination', value: 50 },
        presentation: {
          color: 'amber',
          icon: 'coordination',
          voiceHint: 'coordination',
        },
      },
    ],
  },
  
  {
    id: 'rift_library_trap_fallen',
    sharedContent: {
      text: 'Ты падаешь. Темнота. Удар. Боль. Когда открываешь глаза — ты в подвале. Один.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'fallen_endurance_survive',
        voice: 'endurance',
        voiceGroup: 'body',
        threshold: 30,
        text: 'Живой. Избитый, но живой. Встать. Найти выход. Найти отряд.',
        effect: 'pulse',
        priority: 9,
        voiceName: 'СТОЙКОСТЬ',
      },
      {
        id: 'fallen_perception_basement',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 40,
        text: 'Подвал. Здесь темно, но... слышны голоса. Человеческие. Живые.',
        effect: 'glitch',
        priority: 8,
        voiceName: 'ВОСПРИЯТИЕ',
        requiredFlag: 'knows_prisoners_location',
        onView: {
          addFlags: ['found_prisoners_by_accident'],
        },
      },
    ],
    nextScene: 'library_basement',
  },
  
  {
    id: 'rift_library_side_entry',
    sharedContent: {
      text: 'Боковая дверь открыта. Подозрительно открыта. Но выбора нет. Вы входите.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'side_perception_trap',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 50,
        text: 'Ловушка. Но другая. Не механическая — живая. Кто-то ждёт внутри.',
        effect: 'glitch',
        priority: 9,
        voiceName: 'ВОСПРИЯТИЕ',
        requiredFlag: 'suspects_side_door_trap',
      },
    ],
    nextScene: 'library_interior',
  },
  
  {
    id: 'rift_library_roof_entry',
    sharedContent: {
      text: 'Прыжок на соседнее здание. Бег по крыше. Ещё прыжок — и вы на библиотеке. Сверху видно всё.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'roof_coordination_success',
        voice: 'coordination',
        voiceGroup: 'motorics',
        threshold: 40,
        text: 'Чисто. Красиво. Тактическое преимущество — за нами.',
        effect: 'none',
        priority: 7,
        voiceName: 'КООРДИНАЦИЯ',
      },
      {
        id: 'roof_analysis_layout',
        voice: 'analysis',
        voiceGroup: 'mind',
        threshold: 45,
        text: 'Сверху видна планировка. Читальный зал — в центре. Подвал — слева. Там дрон. Там пленники.',
        effect: 'terminal',
        priority: 8,
        voiceName: 'АНАЛИЗ',
        onView: {
          addFlags: ['knows_library_layout'],
        },
      },
    ],
    nextScene: 'library_interior_stealth',
    effects: {
      addFlags: ['roof_entry_bonus'],
      xp: 30,
    },
  },
  
  {
    id: 'rift_library_sewer_entry',
    sharedContent: {
      text: 'Канализация. Темно. Влажно. Пахнет... странно. Не гнилью — чем-то химическим. Артефактным.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'sewer_perception_smell',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 45,
        text: 'Этот запах. Артефактная пыль. Здесь недавно что-то активировали. Или создавали.',
        effect: 'glitch',
        priority: 8,
        voiceName: 'ВОСПРИЯТИЕ',
        onView: {
          addFlags: ['sensed_artifact_activity'],
        },
      },
      {
        id: 'sewer_analysis_stealth',
        voice: 'analysis',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Идеально для скрытного проникновения. Но выход в подвал — там могут быть охранники.',
        effect: 'terminal',
        priority: 7,
        voiceName: 'АНАЛИЗ',
      },
    ],
    nextScene: 'library_basement_stealth',
    effects: {
      addFlags: ['sewer_entry_bonus'],
      xp: 25,
    },
  },
]

// ============================================================================
// SCENE DEFINITION
// ============================================================================

export const riftCrossingScene: PolyphonicScene = {
  id: 'chapter4_rift_crossing',
  chapterId: 'chapter4',
  questId: 'main_quest_rift_crossing',
  
  background: '/images/backgrounds/rift_pale.jpg',
  music: '/audio/ambient/rift_drone.mp3',
  
  characters: [],
  
  dialogues,
  entryDialogueId: 'rift_entry',
  
  isActive: true,
}

// ============================================================================
// EXPORTS
// ============================================================================

export default riftCrossingScene

/**
 * Получить диалог по ID
 */
export function getRiftDialogueById(dialogueId: string): PolyphonicDialogue | undefined {
  return dialogues.find((d) => d.id === dialogueId)
}

/**
 * Получить все инъекции для сцены
 */
export function getAllRiftInjections(): PrivateInjection[] {
  return dialogues.flatMap((d) => d.privateInjections)
}

/**
 * Типы испытаний Разлома
 */
export const RIFT_TRIAL_TYPES = {
  SPATIAL_LOOP: 'spatial_loop',
  SIREN_SONG: 'siren_song',
  GRAVITY_WELL: 'gravity_well',
  MIMIC_ENCOUNTER: 'mimic_encounter',
} as const

export type RiftTrialType = typeof RIFT_TRIAL_TYPES[keyof typeof RIFT_TRIAL_TYPES]

/**
 * Описание испытаний
 */
export const riftTrialDescriptions: Record<RiftTrialType, {
  name: string
  description: string
  primaryStat: string
  fallbackStat: string
  difficulty: number
}> = {
  [RIFT_TRIAL_TYPES.SPATIAL_LOOP]: {
    name: 'Пространственная Петля',
    description: 'Геометрия искривлена. Каждый шаг возвращает назад.',
    primaryStat: 'coordination',
    fallbackStat: 'logic',
    difficulty: 50,
  },
  [RIFT_TRIAL_TYPES.SIREN_SONG]: {
    name: 'Песня Сирен',
    description: 'Голоса мёртвых зовут по имени.',
    primaryStat: 'willpower',
    fallbackStat: 'empathy',
    difficulty: 50,
  },
  [RIFT_TRIAL_TYPES.GRAVITY_WELL]: {
    name: 'Гравитационный Колодец',
    description: 'Воздух превратился в свинец. Каждый шаг — пытка.',
    primaryStat: 'endurance',
    fallbackStat: 'logic',
    difficulty: 50,
  },
  [RIFT_TRIAL_TYPES.MIMIC_ENCOUNTER]: {
    name: 'Встреча с Мимиком',
    description: 'Кто-то из отряда ведёт себя странно...',
    primaryStat: 'perception',
    fallbackStat: 'suggestion',
    difficulty: 55,
  },
}


