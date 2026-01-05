/**
 * library_interior.ts — Сценарий внутри Библиотеки (Глава IV - продолжение)
 * 
 * Локация: Университетская библиотека Фрайбурга — руины в Серости
 * 
 * Механика:
 * - Исследование локации
 * - Обнаружение дрона и пленников
 * - Боевое столкновение с Големами
 */

import type { 
  PolyphonicScene, 
  PolyphonicDialogue, 
  PrivateInjection,
} from '../../model/types'

// ============================================================================
// PRIVATE INJECTIONS — Голоса в библиотеке
// ============================================================================

/**
 * Инъекции при входе в библиотеку
 */
const libraryEntryInjections: PrivateInjection[] = [
  {
    id: 'library_perception_silence',
    voice: 'perception',
    voiceGroup: 'motorics',
    threshold: 40,
    text: 'Тишина. Абсолютная. Даже шаги не отдаются эхом. Как будто здание поглощает звук.',
    effect: 'glitch',
    priority: 8,
    voiceName: 'ВОСПРИЯТИЕ',
  },
  {
    id: 'library_analysis_structure',
    voice: 'knowledge',
    voiceGroup: 'mind',
    threshold: 45,
    text: 'Несущие конструкции повреждены на 60%. Здание может обрушиться. Двигаться осторожно. Не трогать стены.',
    effect: 'terminal',
    priority: 7,
    voiceName: 'ЗНАНИЯ',
    onView: {
      addFlags: ['knows_structural_damage'],
    },
  },
  {
    id: 'library_creativity_beauty',
    voice: 'creativity',
    voiceGroup: 'psyche',
    threshold: 35,
    text: 'Когда-то это было прекрасно. Высокие потолки. Витражи. Ряды книг до горизонта. Теперь — склеп знаний.',
    effect: 'whisper',
    priority: 4,
    voiceName: 'ТВОРЧЕСТВО',
  },
  {
    id: 'library_honor_respect',
    voice: 'honor',
    voiceGroup: 'sociality',
    threshold: 40,
    text: 'Библиотека. Хранилище человеческой мудрости. Даже разрушенная — она заслуживает уважения.',
    effect: 'glow',
    priority: 5,
    voiceName: 'ЧЕСТЬ',
  },
]

/**
 * Инъекции при обнаружении дрона
 */
const droneDiscoveryInjections: PrivateInjection[] = [
  {
    id: 'drone_logic_extraction',
    voice: 'logic',
    voiceGroup: 'mind',
    threshold: 45,
    text: 'Накопитель данных — в защитном контейнере слева. Стандартная модель FJR-7. Открывается кодом 4-7-2.',
    effect: 'terminal',
    priority: 9,
    voiceName: 'ЛОГИКА',
    onView: {
      addFlags: ['knows_drone_code'],
    },
  },
  {
    id: 'drone_analysis_damage',
    voice: 'knowledge',
    voiceGroup: 'mind',
    threshold: 50,
    text: 'Дрон не упал. Его сбили. Следы энергетического оружия. Синтез знал, что он летит.',
    effect: 'terminal',
    priority: 8,
    voiceName: 'ЗНАНИЯ',
    onView: {
      addFlags: ['drone_was_shot_down'],
    },
  },
  {
    id: 'drone_perception_trap',
    voice: 'perception',
    voiceGroup: 'motorics',
    threshold: 55,
    text: 'Это приманка. Дрон слишком целый. Слишком доступный. Они хотят, чтобы мы подошли.',
    effect: 'glitch',
    priority: 10,
    voiceName: 'ВОСПРИЯТИЕ',
    onView: {
      addFlags: ['suspects_drone_trap'],
    },
  },
]

/**
 * Инъекции при обнаружении пленников
 */
const prisonerDiscoveryInjections: PrivateInjection[] = [
  {
    id: 'prisoner_empathy_alive',
    voice: 'empathy',
    voiceGroup: 'sociality',
    threshold: 35,
    text: 'Они живы. Дышат. Некоторые без сознания, но... живы. Надежда ещё есть.',
    effect: 'glow',
    priority: 10,
    voiceName: 'ЭМПАТИЯ',
  },
  {
    id: 'prisoner_perception_condition',
    voice: 'perception',
    voiceGroup: 'motorics',
    threshold: 50,
    text: 'Истощены. Обезвожены. Следы инъекций на руках. Над ними экспериментировали.',
    effect: 'glitch',
    priority: 9,
    voiceName: 'ВОСПРИЯТИЕ',
    onView: {
      addFlags: ['knows_prisoner_experiments'],
    },
  },
  {
    id: 'prisoner_honor_rescue',
    voice: 'honor',
    voiceGroup: 'sociality',
    threshold: 40,
    text: 'Люди Хольца. Те, кого он "потерял". Теперь мы их нашли. Мы их ВЫВЕДЕМ.',
    effect: 'glow',
    priority: 8,
    voiceName: 'ЧЕСТЬ',
  },
  {
    id: 'prisoner_logic_capacity',
    voice: 'logic',
    voiceGroup: 'mind',
    threshold: 45,
    text: 'Четверо пленников. Трое могут идти. Один — нужны носилки. Это замедлит нас. Значительно.',
    effect: 'terminal',
    priority: 7,
    voiceName: 'ЛОГИКА',
  },
]

/**
 * Инъекции перед боем с Големами
 */
const golemCombatInjections: PrivateInjection[] = [
  {
    id: 'combat_reaction_ready',
    voice: 'reaction',
    voiceGroup: 'motorics',
    threshold: 45,
    text: 'ОРУЖИЕ НАГОТОВЕ. ПЕРВЫЙ — СПРАВА. ВТОРОЙ — ЦЕНТР. ТРЕТИЙ — ФЛАНГ.',
    effect: 'pulse',
    priority: 10,
    voiceName: 'РЕАКЦИЯ',
  },
  {
    id: 'combat_logic_tactics',
    voice: 'logic',
    voiceGroup: 'mind',
    threshold: 50,
    text: 'Глыба — бей по стыкам. Сдвиг — используй мистику. Мимик — проверяй глаза. Protocol Trinity.',
    effect: 'terminal',
    priority: 9,
    voiceName: 'ЛОГИКА',
    requiredFlag: 'knows_golem_types',
  },
  {
    id: 'combat_courage_charge',
    voice: 'courage',
    voiceGroup: 'consciousness',
    threshold: 55,
    text: 'Это момент истины. Покажи им, на что способен. ПОКАЖИ ИМ СТРАХ.',
    effect: 'pulse',
    priority: 8,
    voiceName: 'ОТВАГА',
  },
  {
    id: 'combat_solidarity_protect',
    voice: 'solidarity',
    voiceGroup: 'sociality',
    threshold: 40,
    text: 'Пленники за спиной. Отряд рядом. Защити их. Любой ценой.',
    effect: 'glow',
    priority: 7,
    voiceName: 'СОЛИДАРНОСТЬ',
  },
  {
    id: 'combat_strength_dominate',
    voice: 'force',
    voiceGroup: 'body',
    threshold: 55,
    text: 'ОНИ — КАМЕНЬ И МЕТАЛЛ. МЫ — ВОЛЯ И ЯРОСТЬ. СЛОМАЙ ИХ.',
    effect: 'pulse',
    priority: 6,
    voiceName: 'СИЛА',
  },
]

/**
 * Инъекции при обнаружении Эхо-Мимика
 */
const mimicRevealInjections: PrivateInjection[] = [
  {
    id: 'mimic_perception_eyes',
    voice: 'perception',
    voiceGroup: 'motorics',
    threshold: 50,
    text: 'ОН НЕ МОРГАЕТ. ЭТО НЕ ОН. СТРЕЛЯЙ.',
    effect: 'glitch',
    priority: 10,
    voiceName: 'ВОСПРИЯТИЕ',
    requiredFlag: 'knows_mimic_tell',
  },
  {
    id: 'mimic_empathy_wrong',
    voice: 'empathy',
    voiceGroup: 'sociality',
    threshold: 55,
    text: 'Пустота. За этими глазами — ничего. Это не душа. Это... пародия.',
    effect: 'glow',
    priority: 9,
    voiceName: 'ЭМПАТИЯ',
  },
  {
    id: 'mimic_suggestion_command',
    voice: 'suggestion',
    voiceGroup: 'consciousness',
    threshold: 60,
    text: 'Оно копирует форму, но не волю. ПРИКАЖИ ЕМУ ОСТАНОВИТЬСЯ. Твой голос — закон для слабых умов.',
    effect: 'whisper',
    priority: 8,
    voiceName: 'ВНУШЕНИЕ',
    onView: {
      addFlags: ['can_command_mimic'],
    },
  },
]

// ============================================================================
// DIALOGUES — Диалоги в библиотеке
// ============================================================================

const dialogues: PolyphonicDialogue[] = [
  // === ВХОД В БИБЛИОТЕКУ ===
  {
    id: 'library_entry',
    sharedContent: {
      text: 'Внутри — хаос. Книжные стеллажи опрокинуты. Пол усеян страницами. Пыль танцует в лучах света, пробивающегося сквозь дыры в потолке.',
      speaker: 'Narrator',
      background: '/images/backgrounds/library_interior.jpg',
    },
    privateInjections: libraryEntryInjections,
    nextDialogue: 'library_navigation',
  },
  
  {
    id: 'library_navigation',
    sharedContent: {
      text: 'Нужно найти дрон. И, если повезёт, пленников. Куда направиться?',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'nav_analysis_layout',
        voice: 'knowledge',
        voiceGroup: 'mind',
        threshold: 45,
        text: 'Дрон — в читальном зале. Пленники — вероятно, в подвале. Подвал слева, зал прямо.',
        effect: 'terminal',
        priority: 8,
        voiceName: 'ЗНАНИЯ',
        requiredFlag: 'knows_library_layout',
      },
    ],
    options: [
      {
        id: 'nav_reading_room',
        text: 'В читальный зал. К дрону.',
        nextDialogue: 'library_reading_room',
        effects: {
          addFlags: ['went_to_reading_room'],
        },
      },
      {
        id: 'nav_basement',
        text: 'В подвал. Искать пленников.',
        nextDialogue: 'library_basement_entry',
        requiredFlag: 'knows_prisoners_location',
        effects: {
          addFlags: ['went_to_basement_first'],
        },
      },
      {
        id: 'nav_search',
        text: '[Восприятие] Осмотреться. Найти следы.',
        nextDialogue: 'library_search',
        requiredStat: { stat: 'perception', value: 45 },
        presentation: {
          color: 'amber',
          icon: 'perception',
          voiceHint: 'perception',
        },
      },
    ],
  },
  
  // === ПОИСК ===
  {
    id: 'library_search',
    sharedContent: {
      text: 'Ты осматриваешь пол. Следы в пыли. Много следов. Человеческие — и нечеловеческие.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'search_perception_tracks',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 40,
        text: 'Три типа следов. Человеческие — недавние, вглубь здания. Тяжёлые — Големы. И... что-то ещё. Царапающее.',
        effect: 'glitch',
        priority: 9,
        voiceName: 'ВОСПРИЯТИЕ',
        onView: {
          addFlags: ['found_tracks'],
        },
      },
    ],
    nextDialogue: 'library_search_result',
  },
  
  {
    id: 'library_search_result',
    sharedContent: {
      text: 'Человеческие следы ведут в подвал. Тяжёлые — к читальному залу. Что-то царапающее — везде.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'search_analysis_pattern',
        voice: 'knowledge',
        voiceGroup: 'mind',
        threshold: 50,
        text: 'Царапающие следы — Сдвиги. Они патрулируют. Везде. Читальный зал охраняется. Подвал — возможно, тоже.',
        effect: 'terminal',
        priority: 8,
        voiceName: 'ЗНАНИЯ',
        onView: {
          addFlags: ['knows_patrol_pattern'],
        },
      },
    ],
    options: [
      {
        id: 'search_reading_room',
        text: 'В читальный зал. Осторожно.',
        nextDialogue: 'library_reading_room',
      },
      {
        id: 'search_basement',
        text: 'В подвал. Сначала — люди.',
        nextDialogue: 'library_basement_entry',
      },
    ],
  },
  
  // === ЧИТАЛЬНЫЙ ЗАЛ ===
  {
    id: 'library_reading_room',
    sharedContent: {
      text: 'Читальный зал. Огромное пространство под стеклянным куполом, теперь — разбитым. В центре, среди обломков мебели — дрон FJR.',
      speaker: 'Narrator',
      background: '/images/backgrounds/reading_room.jpg',
    },
    privateInjections: droneDiscoveryInjections,
    nextDialogue: 'library_drone_approach',
  },
  
  {
    id: 'library_drone_approach',
    sharedContent: {
      text: 'Дрон лежит на боку. Корпус повреждён, но контейнер данных — цел. Подойти и забрать?',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'approach_perception_danger',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 55,
        text: 'СТОП. Не двигайся. Тени в углах. Они ждут. Это засада.',
        effect: 'glitch',
        priority: 10,
        voiceName: 'ВОСПРИЯТИЕ',
        requiredFlag: 'suspects_drone_trap',
        onView: {
          addFlags: ['confirmed_ambush'],
        },
      },
    ],
    options: [
      {
        id: 'drone_grab',
        text: 'Взять данные. Быстро.',
        nextDialogue: 'library_ambush_triggered',
        effects: {
          addFlags: ['triggered_ambush'],
        },
      },
      {
        id: 'drone_cautious',
        text: '[Восприятие] Сначала проверить периметр.',
        nextDialogue: 'library_ambush_prepared',
        requiredStat: { stat: 'perception', value: 50 },
        requiredFlag: 'suspects_drone_trap',
        presentation: {
          color: 'amber',
          icon: 'perception',
          voiceHint: 'perception',
        },
        effects: {
          addFlags: ['prepared_for_ambush'],
          xp: 20,
        },
      },
      {
        id: 'drone_thermal',
        text: '[Термосканер] Просканировать зал.',
        nextDialogue: 'library_thermal_reveal',
        requiredFlag: 'has_thermal_scanner',
        presentation: {
          color: 'cyan',
          icon: 'thermal',
        },
        effects: {
          xp: 15,
        },
      },
    ],
  },
  
  // === ТЕРМАЛЬНОЕ СКАНИРОВАНИЕ ===
  {
    id: 'library_thermal_reveal',
    sharedContent: {
      text: 'Термосканер оживает. Экран взрывается пятнами. Три источника — по углам зала. Ещё один — за колонной.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'thermal_logic_count',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Четыре враждебных сигнатуры. Три Глыбы. Один... другой. Температура выше. Сдвиг? Или Мимик.',
        effect: 'terminal',
        priority: 9,
        voiceName: 'ЛОГИКА',
        onView: {
          addFlags: ['knows_enemy_positions'],
        },
      },
      {
        id: 'thermal_reaction_plan',
        voice: 'reaction',
        voiceGroup: 'motorics',
        threshold: 45,
        text: 'Четверо на четверых. Справедливо. Каждому — по цели. Координированная атака.',
        effect: 'pulse',
        priority: 7,
        voiceName: 'РЕАКЦИЯ',
      },
    ],
    options: [
      {
        id: 'thermal_first_strike',
        text: '[Реакция] Первый удар — наш! Атакуем!',
        nextDialogue: 'library_first_strike',
        requiredStat: { stat: 'reaction', value: 50 },
        presentation: {
          color: 'amber',
          icon: 'reaction',
          voiceHint: 'reaction',
        },
        effects: {
          addFlags: ['first_strike_bonus'],
        },
      },
      {
        id: 'thermal_retreat',
        text: 'Слишком много. Отступаем за подкреплением.',
        nextDialogue: 'library_retreat',
        effects: {
          addFlags: ['retreated_from_reading_room'],
        },
      },
    ],
  },
  
  // === ЗАСАДА ===
  {
    id: 'library_ambush_triggered',
    sharedContent: {
      text: 'Ты делаешь шаг к дрону — и мир взрывается движением. Статуи в углах оживают. Каменные тела разворачиваются. Засада.',
      speaker: 'Narrator',
    },
    privateInjections: golemCombatInjections,
    nextDialogue: 'library_golems_confrontation',
  },
  
  {
    id: 'library_ambush_prepared',
    sharedContent: {
      text: 'Ты видишь их прежде, чем они атакуют. Три Голема по углам. Один — за колонной, ждёт. Ты готов.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'prepared_logic_advantage',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 35,
        text: 'Тактическое преимущество. Мы знаем их позиции. Они не знают, что мы знаем.',
        effect: 'terminal',
        priority: 8,
        voiceName: 'ЛОГИКА',
      },
    ],
    nextDialogue: 'library_golems_confrontation',
    effects: {
      addFlags: ['ambush_prepared'],
      // В бою: +2 к инициативе
    },
  },
  
  {
    id: 'library_first_strike',
    sharedContent: {
      text: '"ОГОНЬ!" Выстрелы рвут тишину раньше, чем Големы успевают среагировать. Преимущество первого удара — за вами.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'first_strike_coordination',
        voice: 'coordination',
        voiceGroup: 'motorics',
        threshold: 40,
        text: 'Чисто. Синхронно. Отряд работает как единый механизм.',
        effect: 'none',
        priority: 7,
        voiceName: 'КООРДИНАЦИЯ',
      },
    ],
    nextDialogue: 'library_golems_confrontation',
    effects: {
      addFlags: ['first_strike_success'],
      // В бою: враги начинают с -20% HP
    },
  },
  
  // === БОЙ ===
  {
    id: 'library_combat_intro',
    sharedContent: {
      text: 'Бой начинается. Три Глыбы — массивные, каменные, неумолимые. И один... один выглядит как член твоего отряда.',
      speaker: 'Narrator',
      background: '/images/backgrounds/combat_arena_library.jpg',
    },
    privateInjections: mimicRevealInjections,
    options: [
      {
        id: 'combat_start',
        text: 'К бою!',
        nextScene: 'combat_library_main',
        effects: {
          addFlags: ['library_combat_started'],
        },
      },
      {
        id: 'combat_mimic_first',
        text: '[Восприятие] Сначала — Мимик! Он опаснее!',
        nextScene: 'combat_library_mimic_priority',
        requiredStat: { stat: 'perception', value: 55 },
        requiredFlag: 'knows_mimic_tell',
        presentation: {
          color: 'amber',
          icon: 'perception',
          voiceHint: 'perception',
        },
        effects: {
          addFlags: ['mimic_priority_target'],
        },
      },
      {
        id: 'combat_command_mimic',
        text: '[Внушение] "СТОП!" — приказать Мимику остановиться.',
        nextDialogue: 'library_mimic_commanded',
        requiredStat: { stat: 'suggestion', value: 60 },
        requiredFlag: 'can_command_mimic',
        presentation: {
          color: 'violet',
          icon: 'suggestion',
          voiceHint: 'suggestion',
        },
        effects: {
          addFlags: ['mimic_commanded'],
          xp: 40,
        },
      },
    ],
  },
  
  {
    id: 'library_mimic_commanded',
    sharedContent: {
      text: '"СТОП." Твой голос разрезает воздух. Мимик замирает. Его форма... дрожит. Нестабильна. Он подчиняется.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'commanded_suggestion_power',
        voice: 'suggestion',
        voiceGroup: 'consciousness',
        threshold: 45,
        text: 'Власть. Настоящая власть. Не над телами — над разумами. Это... опьяняет.',
        effect: 'whisper',
        priority: 9,
        voiceName: 'ВНУШЕНИЕ',
      },
      {
        id: 'commanded_empathy_warning',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 50,
        text: 'Осторожно. Это не победа над врагом. Это контроль над существом. Есть разница.',
        effect: 'glow',
        priority: 7,
        voiceName: 'ЭМПАТИЯ',
      },
    ],
    options: [
      {
        id: 'mimic_destroy',
        text: 'Уничтожить его, пока он беспомощен.',
        nextDialogue: 'library_mimic_destroyed',
        effects: {
          addFlags: ['mimic_executed'],
        },
      },
      {
        id: 'mimic_interrogate',
        text: '[Внушение] "ГОВОРИ. Где пленники?"',
        nextDialogue: 'library_mimic_interrogated',
        requiredStat: { stat: 'suggestion', value: 55 },
        presentation: {
          color: 'violet',
          icon: 'suggestion',
          voiceHint: 'suggestion',
        },
        effects: {
          addFlags: ['mimic_interrogated'],
          xp: 30,
        },
      },
      {
        id: 'mimic_release',
        text: '[Эмпатия] "УХОДИ. И не возвращайся."',
        nextDialogue: 'library_mimic_released',
        requiredStat: { stat: 'empathy', value: 55 },
        presentation: {
          color: 'emerald',
          icon: 'empathy',
          voiceHint: 'empathy',
        },
        effects: {
          addFlags: ['mimic_released'],
          xp: 25,
        },
      },
    ],
  },
  
  {
    id: 'library_mimic_destroyed',
    sharedContent: {
      text: 'Выстрел. Мимик распадается на куски — не крови, не плоти, а чего-то серого, пыльного. Он был не живым. Просто... копией.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'destroyed_logic_efficient',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 35,
        text: 'Эффективно. Одним врагом меньше. Теперь — Глыбы.',
        effect: 'terminal',
        priority: 6,
        voiceName: 'ЛОГИКА',
      },
    ],
    nextScene: 'combat_library_reduced',
    effects: {
      // В бою: на одного врага меньше
    },
  },
  
  {
    id: 'library_mimic_interrogated',
    sharedContent: {
      text: 'Мимик говорит — твоим голосом, но словами, которые не твои. "Подвал. Секция Б. Там... создатели. Там... материал."',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'interrogated_perception_meaning',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 45,
        text: '"Материал." Он имеет в виду пленников. Они используют людей как... материал.',
        effect: 'glitch',
        priority: 9,
        voiceName: 'ВОСПРИЯТИЕ',
        onView: {
          addFlags: ['knows_synthesis_purpose'],
        },
      },
      {
        id: 'interrogated_logic_location',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Секция Б. Подвал. Конкретная информация. Это сэкономит время.',
        effect: 'terminal',
        priority: 8,
        voiceName: 'ЛОГИКА',
        onView: {
          addFlags: ['knows_exact_prisoner_location'],
        },
      },
    ],
    nextScene: 'combat_library_reduced',
    effects: {
      // В бою: на одного врага меньше + информация
    },
  },
  
  {
    id: 'library_mimic_released',
    sharedContent: {
      text: 'Мимик... благодарит? Его форма теряет чёткость, становится серой массой — и он уходит. Растворяется в тенях.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'released_empathy_choice',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 40,
        text: 'Это было... неожиданно. Может, не все существа Серости — враги. Может, некоторые — просто... заблудившиеся.',
        effect: 'glow',
        priority: 8,
        voiceName: 'ЭМПАТИЯ',
        onView: {
          addFlags: ['showed_mercy_to_rift'],
        },
      },
      {
        id: 'released_strength_weak',
        voice: 'force',
        voiceGroup: 'body',
        threshold: 50,
        text: 'Слабость. Отпустил врага. Он вернётся. С друзьями.',
        effect: 'pulse',
        priority: 6,
        voiceName: 'СИЛА',
      },
    ],
    nextScene: 'combat_library_reduced',
    effects: {
      addFlags: ['rift_entity_spared'],
      // В бою: на одного врага меньше + скрытый бонус позже
    },
  },
  
  // === ОТСТУПЛЕНИЕ ===
  {
    id: 'library_retreat',
    sharedContent: {
      text: 'Вы отступаете. Тихо. Осторожно. Големы не преследуют — они защищают. Дрон остаётся за спиной.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'retreat_logic_regroup',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Тактическое отступление. Не поражение. Перегруппировка. Найдём другой путь.',
        effect: 'terminal',
        priority: 7,
        voiceName: 'ЛОГИКА',
      },
      {
        id: 'retreat_courage_shame',
        voice: 'courage',
        voiceGroup: 'consciousness',
        threshold: 50,
        text: 'Бегство. Это... бегство. Но живой трус лучше мёртвого героя.',
        effect: 'pulse',
        priority: 6,
        voiceName: 'ОТВАГА',
      },
    ],
    options: [
      {
        id: 'retreat_basement',
        text: 'В подвал. Сначала — люди.',
        nextDialogue: 'library_basement_entry',
      },
      {
        id: 'retreat_call',
        text: 'Связаться с Хольцем. Нужна поддержка.',
        nextDialogue: 'library_call_backup',
      },
    ],
  },
  
  // === ПОДВАЛ ===
  {
    id: 'library_basement_entry',
    sharedContent: {
      text: 'Подвал. Темнота. Запах сырости и... чего-то химического. Артефактная пыль висит в воздухе.',
      speaker: 'Narrator',
      background: '/images/backgrounds/library_basement.jpg',
    },
    privateInjections: [
      {
        id: 'basement_perception_smell',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 40,
        text: 'Тот же запах, что в канализации. Здесь что-то создают. Или создавали.',
        effect: 'glitch',
        priority: 7,
        voiceName: 'ВОСПРИЯТИЕ',
      },
    ],
    nextDialogue: 'library_basement_search',
  },
  
  {
    id: 'library_basement_search',
    sharedContent: {
      text: 'Коридоры. Двери. Большинство — заперты. Но одна... приоткрыта. Оттуда — слабый свет.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'search_empathy_sense',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 45,
        text: 'Там люди. Живые. Чувствую их страх. Их надежду. Они знают, что кто-то пришёл.',
        effect: 'glow',
        priority: 9,
        voiceName: 'ЭМПАТИЯ',
      },
    ],
    options: [
      {
        id: 'basement_door_open',
        text: 'Открыть дверь.',
        nextDialogue: 'library_prisoners_found',
      },
      {
        id: 'basement_door_cautious',
        text: '[Восприятие] Прислушаться сначала.',
        nextDialogue: 'library_prisoners_listen',
        requiredStat: { stat: 'perception', value: 45 },
        presentation: {
          color: 'amber',
          icon: 'perception',
          voiceHint: 'perception',
        },
      },
    ],
  },
  
  {
    id: 'library_prisoners_listen',
    sharedContent: {
      text: 'Ты прислушиваешься. Тихие голоса. Стоны. И... шаги. Кто-то ходит внутри. Охранник?',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'listen_analysis_count',
        voice: 'knowledge',
        voiceGroup: 'mind',
        threshold: 45,
        text: 'Четыре-пять дыханий. Один — ходит. Охранник или медик? Походка... механическая. Не человек.',
        effect: 'terminal',
        priority: 8,
        voiceName: 'ЗНАНИЯ',
        onView: {
          addFlags: ['knows_basement_guard'],
        },
      },
    ],
    options: [
      {
        id: 'listen_ambush',
        text: '[Реакция] Ворваться. Нейтрализовать охранника.',
        nextDialogue: 'library_prisoners_ambush',
        requiredStat: { stat: 'reaction', value: 50 },
        presentation: {
          color: 'amber',
          icon: 'reaction',
          voiceHint: 'reaction',
        },
      },
      {
        id: 'listen_distract',
        text: '[Внушение] Создать отвлечение. Выманить его.',
        nextDialogue: 'library_prisoners_distract',
        requiredStat: { stat: 'suggestion', value: 50 },
        presentation: {
          color: 'violet',
          icon: 'suggestion',
          voiceHint: 'suggestion',
        },
      },
    ],
  },
  
  {
    id: 'library_prisoners_ambush',
    sharedContent: {
      text: 'Ты врываешься. Дверь слетает с петель. Охранник — конструкт, полумеханический — не успевает среагировать. Один удар — и он падает.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'ambush_reaction_clean',
        voice: 'reaction',
        voiceGroup: 'motorics',
        threshold: 35,
        text: 'Чисто. Быстро. Профессионально. Вот как это делается.',
        effect: 'pulse',
        priority: 7,
        voiceName: 'РЕАКЦИЯ',
      },
    ],
    nextDialogue: 'library_prisoners_found',
    effects: {
      addFlags: ['guard_neutralized'],
      xp: 20,
    },
  },
  
  {
    id: 'library_prisoners_distract',
    sharedContent: {
      text: 'Ты бросаешь камень в коридор. Звук. Охранник выходит проверить — и получает удар сзади. Тихо. Эффективно.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'distract_suggestion_smart',
        voice: 'suggestion',
        voiceGroup: 'consciousness',
        threshold: 35,
        text: 'Мозги важнее мышц. Всегда.',
        effect: 'whisper',
        priority: 7,
        voiceName: 'ВНУШЕНИЕ',
      },
    ],
    nextDialogue: 'library_prisoners_found',
    effects: {
      addFlags: ['guard_neutralized_stealth'],
      xp: 25,
    },
  },
  
  {
    id: 'library_prisoners_found',
    sharedContent: {
      text: 'Камера. Четверо людей в форме FJR. Грязные. Измученные. Но живые. Они смотрят на тебя с недоверием — и надеждой.',
      speaker: 'Narrator',
    },
    privateInjections: prisonerDiscoveryInjections,
    nextDialogue: 'library_prisoners_talk',
  },
  
  {
    id: 'library_prisoners_talk',
    sharedContent: {
      text: 'Старший из них — сержант, судя по нашивкам — пытается встать. Его ноги не держат.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'talk_empathy_state',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 35,
        text: 'Он держится из последних сил. Ради своих людей. Типичный сержант.',
        effect: 'glow',
        priority: 6,
        voiceName: 'ЭМПАТИЯ',
      },
    ],
    nextDialogue: 'library_sergeant_speaks',
  },
  
  {
    id: 'library_sergeant_speaks',
    sharedContent: {
      text: '"Хольц... послал?" Голос хриплый. Сломанный. "Мы думали... думали, нас бросили. Синтез... они берут по одному. На операции. Никто не возвращается."',
      speaker: 'Сержант Вебер',
      emotion: { primary: 'exhausted', intensity: 90 },
    },
    privateInjections: [
      {
        id: 'sergeant_perception_experiments',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 50,
        text: '"Операции." Следы на их руках. Они вживляют что-то. Интегрируют. Люди становятся... частью машин.',
        effect: 'glitch',
        priority: 9,
        voiceName: 'ВОСПРИЯТИЕ',
      },
      {
        id: 'sergeant_honor_promise',
        voice: 'honor',
        voiceGroup: 'sociality',
        threshold: 40,
        text: 'Мы обещали Хольцу. Мы обещали себе. Никто не останется.',
        effect: 'glow',
        priority: 8,
        voiceName: 'ЧЕСТЬ',
      },
    ],
    options: [
      {
        id: 'rescue_now',
        text: 'Мы вытащим вас. Всех. Сейчас.',
        nextDialogue: 'library_rescue_start',
        effects: {
          addFlags: ['rescue_committed'],
        },
      },
      {
        id: 'rescue_info',
        text: '[Риторика] Сначала — информация. Что они искали? Что вы видели?',
        nextDialogue: 'library_sergeant_intel',
        requiredStat: { stat: 'rhetoric', value: 45 },
        presentation: {
          color: 'cyan',
          icon: 'rhetoric',
          voiceHint: 'rhetoric',
        },
      },
    ],
  },
  
  {
    id: 'library_sergeant_intel',
    sharedContent: {
      text: 'Сержант сглатывает. Вспоминает.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'intel_rhetoric_extract',
        voice: 'rhetoric',
        voiceGroup: 'mind',
        threshold: 35,
        text: 'Он хочет говорить. Ему нужно выговориться. Дай ему время.',
        effect: 'terminal',
        priority: 6,
        voiceName: 'РИТОРИКА',
      },
    ],
    nextDialogue: 'library_sergeant_intel_2',
  },
  
  {
    id: 'library_sergeant_intel_2',
    sharedContent: {
      text: '"Проект «Хор». Они... они создают что-то. Солдат. Но не просто солдат — они хотят... объединить сознания. Много людей — одна воля. Один разум. Они называют это «Симфонией»."',
      speaker: 'Сержант Вебер',
      emotion: { primary: 'horrified', intensity: 95 },
    },
    privateInjections: [
      {
        id: 'intel_logic_choir',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 45,
        text: '"Хор". "Симфония". Коллективный разум. Если это правда — Синтез создаёт не армию. Они создают... сущность.',
        effect: 'terminal',
        priority: 10,
        voiceName: 'ЛОГИКА',
        onView: {
          addFlags: ['knows_synthesis_plan'],
          unlockHint: 'Проект «Хор» — коллективный разум',
        },
      },
      {
        id: 'intel_empathy_horror',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 40,
        text: 'Стирание личности. Растворение в массе. Это хуже смерти. Это... небытие.',
        effect: 'glow',
        priority: 9,
        voiceName: 'ЭМПАТИЯ',
      },
    ],
    nextDialogue: 'library_rescue_start',
    effects: {
      addFlags: ['has_critical_intel'],
      xp: 40,
    },
  },
  
  {
    id: 'library_rescue_start',
    sharedContent: {
      text: 'Ты помогаешь пленникам подняться. Трое могут идти. Одного придётся нести. Но вы справитесь. Вместе.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'rescue_solidarity_together',
        voice: 'solidarity',
        voiceGroup: 'sociality',
        threshold: 30,
        text: 'Четверо пленников. Четверо спасателей. Никто не останется. Никто.',
        effect: 'glow',
        priority: 8,
        voiceName: 'СОЛИДАРНОСТЬ',
      },
      {
        id: 'rescue_endurance_burden',
        voice: 'endurance',
        voiceGroup: 'body',
        threshold: 45,
        text: 'Дополнительный вес. Замедление. Но мы выдержим. Мы должны выдержать.',
        effect: 'pulse',
        priority: 6,
        voiceName: 'СТОЙКОСТЬ',
      },
    ],
    options: [
      {
        id: 'rescue_drone_first',
        text: 'Сначала — данные. Потом — выход.',
        nextDialogue: 'library_final_approach',
        requiredFlag: 'went_to_basement_first',
        effects: {
          addFlags: ['drone_after_rescue'],
        },
      },
      {
        id: 'rescue_exit_now',
        text: 'Выходим. Данные подождут.',
        nextScene: 'chapter4_escape',
        effects: {
          addFlags: ['prisoners_rescued', 'drone_abandoned'],
        },
      },
      {
        id: 'rescue_drone_with_team',
        text: 'Разделимся. Часть — ведёт пленников. Остальные — за данными.',
        nextDialogue: 'library_split_team',
        effects: {
          addFlags: ['team_split'],
        },
      },
    ],
  },
  
  // === СВЯЗЬ С ХОЛЬЦЕМ ===
  {
    id: 'library_call_backup',
    sharedContent: {
      text: 'Рация шипит. Помехи. Но сквозь них — голос Хольца.',
      speaker: 'Narrator',
    },
    privateInjections: [],
    nextDialogue: 'library_holz_response',
  },
  
  {
    id: 'library_holz_response',
    sharedContent: {
      text: '"Статус?" Голос напряжённый. Ждущий.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'tense', intensity: 80 },
    },
    privateInjections: [
      {
        id: 'holz_empathy_hope',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 40,
        text: 'Он ждёт. Надеется. И боится. Каждый вызов может быть последним.',
        effect: 'glow',
        priority: 6,
        voiceName: 'ЭМПАТИЯ',
      },
    ],
    options: [
      {
        id: 'report_golems',
        text: 'Четыре Голема охраняют дрон. Нужна поддержка.',
        nextDialogue: 'library_holz_support',
      },
      {
        id: 'report_prisoners',
        text: 'Сэр... мы нашли ваших людей. Живых.',
        nextDialogue: 'library_holz_prisoners',
        requiredFlag: 'knows_prisoners_location',
      },
    ],
  },
  
  {
    id: 'library_holz_support',
    sharedContent: {
      text: 'Молчание. Потом — вздох.',
      speaker: 'Narrator',
    },
    privateInjections: [],
    nextDialogue: 'library_holz_support_2',
  },
  
  {
    id: 'library_holz_support_2',
    sharedContent: {
      text: '"Поддержки нет. Все ресурсы — на других участках. Вы сами. Но я верю в вас. Хольц — конец связи."',
      speaker: 'Командант Хольц',
      emotion: { primary: 'resigned', intensity: 70 },
    },
    privateInjections: [
      {
        id: 'support_logic_alone',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 35,
        text: 'Мы одни. Это не новость. Это... реальность. Справимся.',
        effect: 'terminal',
        priority: 6,
        voiceName: 'ЛОГИКА',
      },
    ],
    nextDialogue: 'library_navigation',
  },
  
  {
    id: 'library_holz_prisoners',
    sharedContent: {
      text: 'Тишина. Долгая. Потом — голос, дрожащий.',
      speaker: 'Narrator',
    },
    privateInjections: [],
    nextDialogue: 'library_holz_prisoners_2',
  },
  
  {
    id: 'library_holz_prisoners_2',
    sharedContent: {
      text: '"...Живых? Мои люди... живы?" Голос ломается. "Вытащите их. Пожалуйста. Данные... данные подождут. Вытащите их."',
      speaker: 'Командант Хольц',
      emotion: { primary: 'overwhelmed', intensity: 95 },
    },
    privateInjections: [
      {
        id: 'prisoners_empathy_relief',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 30,
        text: 'Он плачет. Командант Хольц — плачет. От облегчения. От надежды.',
        effect: 'glow',
        priority: 9,
        voiceName: 'ЭМПАТИЯ',
      },
      {
        id: 'prisoners_honor_duty',
        voice: 'honor',
        voiceGroup: 'sociality',
        threshold: 35,
        text: 'Это больше не приказ. Это мольба. Мы не можем её проигнорировать.',
        effect: 'glow',
        priority: 8,
        voiceName: 'ЧЕСТЬ',
      },
    ],
    options: [
      {
        id: 'promise_rescue',
        text: 'Мы их вытащим, сэр. Обещаю.',
        nextDialogue: 'library_basement_entry',
        effects: {
          addFlags: ['holz_personal_request', 'rescue_priority'],
        },
      },
    ],
  },
  
  // === РАЗДЕЛЕНИЕ КОМАНДЫ ===
  {
    id: 'library_split_team',
    sharedContent: {
      text: 'Вы делитесь на две группы. Двое ведут пленников к выходу. Двое — идут за данными.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'split_logic_risk',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 45,
        text: 'Разделение — риск. Но это оптимизирует время. Если обе группы справятся — победа полная.',
        effect: 'terminal',
        priority: 7,
        voiceName: 'ЛОГИКА',
      },
      {
        id: 'split_solidarity_trust',
        voice: 'solidarity',
        voiceGroup: 'sociality',
        threshold: 40,
        text: 'Мы доверяем друг другу. Это и есть команда. Каждый сделает своё дело.',
        effect: 'glow',
        priority: 6,
        voiceName: 'СОЛИДАРНОСТЬ',
      },
    ],
    nextDialogue: 'library_final_approach',
    effects: {
      addFlags: ['team_divided'],
    },
  },
  
  // === ФИНАЛЬНЫЙ ПОДХОД К ДРОНУ ===
  {
    id: 'library_final_approach',
    sharedContent: {
      text: 'Читальный зал. Големы всё ещё там. Но теперь вы знаете, что делать.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'final_courage_now',
        voice: 'courage',
        voiceGroup: 'consciousness',
        threshold: 40,
        text: 'Это оно. Финальный бой. Всё, ради чего мы прошли этот путь. ВПЕРЁД.',
        effect: 'pulse',
        priority: 9,
        voiceName: 'ОТВАГА',
      },
    ],
    options: [
      {
        id: 'final_combat',
        text: 'В бой. За Хольца. За пленников. За Фрайбург.',
        nextScene: 'combat_library_final',
        effects: {
          addFlags: ['final_battle_started'],
        },
      },
    ],
  },

  {
    id: 'library_golems_confrontation',
    sharedContent: {
      text: 'Големы поднимаются, каменные суставы трещат, но они не бросаются вперёд сразу. Это больше похоже на ритуал охраны, чем на жажду убийства. У тебя есть миг, чтобы решить, чем это закончится.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'golems_empathy_guardians',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 40,
        text: 'Они стоят между вами и дроном. Не преследуют, не окружают. Они не охотники — они сторожа.',
        effect: 'glow',
        priority: 8,
        voiceName: 'ЭМПАТИЯ',
      },
      {
        id: 'golems_logic_choice',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 45,
        text: 'У нас три варианта: говорить, отступить или стрелять. Стрелять — самый простой. Но не факт, что лучший.',
        effect: 'terminal',
        priority: 7,
        voiceName: 'ЛОГИКА',
      },
    ],
    options: [
      {
        id: 'golems_try_truce',
        text: '[Риторика] Поднять руки и сказать: "Мы пришли за людьми, не за войной".',
        nextDialogue: 'library_golems_truce',
        requiredStat: { stat: 'rhetoric', value: 45 },
        presentation: {
          color: 'cyan',
          icon: 'rhetoric',
          voiceHint: 'rhetoric',
        },
        effects: {
          addFlags: ['golems_truce_attempted'],
        },
      },
      {
        id: 'golems_fall_back',
        text: 'Медленно отступить. Дрон подождёт.',
        nextDialogue: 'library_retreat',
        effects: {
          addFlags: ['retreated_from_reading_room', 'avoided_golem_combat'],
        },
      },
      {
        id: 'golems_open_fire',
        text: '[Атака] Открыть огонь.',
        nextDialogue: 'library_combat_intro',
        presentation: {
          color: 'red',
          icon: 'attack',
        },
        effects: {
          addFlags: ['chose_golem_combat'],
        },
      },
    ],
  },

  {
    id: 'library_golems_truce',
    sharedContent: {
      text: 'Ты опускаешь ствол и говоришь вслух, чтобы слышали и люди, и камень. Големы замирают. Свет в их глазах мерцает, сглаживается. Они медленно отступают к колоннам, оставляя проход к дрону и выходам.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'golems_honor_respect',
        voice: 'honor',
        voiceGroup: 'sociality',
        threshold: 35,
        text: 'Мы признали их правомочность — они признали нашу. Иногда этого достаточно, чтобы не стрелять.',
        effect: 'glow',
        priority: 7,
        voiceName: 'ЧЕСТЬ',
      },
      {
        id: 'golems_creativity_new_script',
        voice: 'creativity',
        voiceGroup: 'psyche',
        threshold: 40,
        text: 'Скрипты боя переписаны на скрипты пропуска. Ты только что взломал систему одним жестом доверия.',
        effect: 'whisper',
        priority: 6,
        voiceName: 'ТВОРЧЕСТВО',
      },
    ],
    options: [
      {
        id: 'golems_take_drone_peacefully',
        text: 'Медленно подойти к дрону и забрать контейнер данных.',
        nextDialogue: 'library_golems_truce_drone_taken',
        effects: {
          addFlags: ['drone_retrieved', 'golems_respected'],
        },
      },
      {
        id: 'golems_leave_drone',
        text: 'Оставить дрон. Сначала — люди.',
        nextDialogue: 'library_basement_entry',
        effects: {
          addFlags: ['drone_abandoned_for_now', 'golems_respected'],
        },
      },
    ],
  },

  {
    id: 'library_golems_truce_drone_taken',
    sharedContent: {
      text: 'Ты поднимаешь контейнер. Големы следят, но не двигаются. В воздухе висит ощутимое напряжение — и новое правило: сюда можно войти без выстрела.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'golems_logic_mission_progress',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 35,
        text: 'Данные у нас, охрана успокоена. Осталось самое главное — люди внизу.',
        effect: 'terminal',
        priority: 6,
        voiceName: 'ЛОГИКА',
      },
    ],
    nextDialogue: 'library_basement_entry',
    effects: {
      addFlags: ['drone_retrieved_peacefully'],
    },
  },
]

// ============================================================================
// SCENE DEFINITION
// ============================================================================

export const libraryInteriorScene: PolyphonicScene = {
  id: 'chapter4_library_interior',
  chapterId: 'chapter4',
  questId: 'main_quest_rift_crossing',
  
  background: '/images/backgrounds/library_interior.jpg',
  music: '/audio/ambient/library_tension.mp3',
  
  characters: [],
  
  dialogues,
  entryDialogueId: 'library_entry',
  
  isActive: true,
}

// ============================================================================
// EXPORTS
// ============================================================================

export default libraryInteriorScene

/**
 * Получить диалог по ID
 */
export function getLibraryDialogueById(dialogueId: string): PolyphonicDialogue | undefined {
  return dialogues.find((d) => d.id === dialogueId)
}

/**
 * Получить все инъекции для сцены
 */
export function getAllLibraryInjections(): PrivateInjection[] {
  return dialogues.flatMap((d) => d.privateInjections)
}

/**
 * Возможные концовки сцены библиотеки
 */
export const libraryEndings = {
  COMBAT_VICTORY: 'combat_victory',
  PRISONERS_RESCUED: 'prisoners_rescued',
  DRONE_RETRIEVED: 'drone_retrieved',
  FULL_SUCCESS: 'full_success', // И пленники, и данные
  TACTICAL_RETREAT: 'tactical_retreat',
  HEAVY_LOSSES: 'heavy_losses',
} as const

export type LibraryEndingType = typeof libraryEndings[keyof typeof libraryEndings]

