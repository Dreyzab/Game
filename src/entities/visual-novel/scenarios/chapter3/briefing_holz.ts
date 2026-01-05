/**
 * briefing_holz.ts — Сценарий инструктажа Главы III
 * 
 * Локация: Historisches Kaufhaus (Исторический торговый дом), 
 *          переоборудованный под полевой штаб FJR
 * 
 * NPC: Командант Мартен Хольц (FJR)
 * 
 * Механика: Полифонический нарратив (Shared vs Private Reality)
 * Каждый игрок слышит одну и ту же речь Хольца, но уходит с разным
 * пониманием подтекста, рисков и скрытых возможностей.
 */

import type {
  PolyphonicScene,
  PolyphonicDialogue,
  PrivateInjection,
} from '../../model/types'

// ============================================================================
// PRIVATE INJECTIONS — Внутренние голоса для сцены инструктажа
// ============================================================================

/**
 * Инъекции для диалога о временном окне
 */
const timeWindowInjections: PrivateInjection[] = [
  // ЛОГИК — Группа III: РАЗУМ
  {
    id: 'briefing_logic_time',
    voice: 'logic',
    voiceGroup: 'mind',
    threshold: 45,
    text: '"Сорок минут" — это оптимистичное округление для гражданских. Исходя из частоты флуктуаций "Серого", реальное окно стабильности составляет 28 минут. Хольц знает это. Он закладывает буфер на нашу некомпетентность.',
    effect: 'terminal',
    priority: 9,
    voiceName: 'ЛОГИКА',
    onView: {
      addFlags: ['knows_real_time_window'],
      unlockHint: 'Реальное время: 28 минут',
    },
  },
  {
    id: 'briefing_analysis_structure',
    voice: 'knowledge',
    voiceGroup: 'mind',
    threshold: 50,
    text: 'Сканирование сектора указывает на 40% вероятность структурного коллапса в подвале Библиотеки. Дрон не просто упал — он погребён. Нам понадобится тяжёлое оборудование или взрывчатка. В брифинге нет ни слова об инструментах для раскопок.',
    effect: 'terminal',
    priority: 8,
    voiceName: 'ЗНАНИЯ',
    onView: {
      addFlags: ['knows_drone_buried'],
      unlockHint: 'Дрон под завалами — нужны инструменты',
    },
  },

  // ТИТАН — Группа I: ТЕЛО
  {
    id: 'briefing_strength_holz',
    voice: 'force',
    voiceGroup: 'body',
    threshold: 55,
    text: 'Посмотри на него. Стоит слишком прямо. Левая нога не принимает вес. Он ранен. Он отправляет нас не потому, что мы лучшие, а потому что сам не может пройти этот путь. Слабость. Если что-то пойдёт не так, мы берём командование на себя.',
    effect: 'pulse',
    priority: 7,
    voiceName: 'СИЛА',
    onView: {
      addFlags: ['noticed_holz_injury'],
    },
  },
  {
    id: 'briefing_endurance_sprint',
    voice: 'endurance',
    voiceGroup: 'body',
    threshold: 45,
    text: 'Сорок минут? Это спринт. Мы можем сделать это за двадцать. Пусть остальные задыхаются. Мы понесём груз, когда они упадут.',
    effect: 'pulse',
    priority: 6,
    voiceName: 'ВЫНОСЛИВОСТЬ',
  },

  // ЭМПАТ — Группа VI: СОЦИАЛЬНОСТЬ
  {
    id: 'briefing_empathy_fear',
    voice: 'empathy',
    voiceGroup: 'sociality',
    threshold: 50,
    text: 'Он напуган. Не за себя — за нас. Дрожь в пальцах, когда он указывает на карту. Вчера он потерял там группу, верно? Поэтому он так формален. Он держится за протокол как за спасательный круг, чтобы не сломаться перед новобранцами.',
    effect: 'glow',
    priority: 8,
    voiceName: 'ЭМПАТИЯ',
    onView: {
      addFlags: ['sensed_holz_fear'],
    },
  },
  {
    id: 'briefing_authority_protocol',
    voice: 'authority',
    voiceGroup: 'consciousness',
    threshold: 45,
    text: 'ЕМУ НУЖНО ПОДТВЕРЖДЕНИЕ. КИВОК. ПОКАЖИ ЕМУ, ЧТО МЫ ПРОФЕССИОНАЛЫ. ЕСЛИ МЫ УВАЖИМ ИЕРАРХИЮ СЕЙЧАС, ОН УСПОКОИТСЯ И ДАСТ НАМ ЛУЧШУЮ ПОДДЕРЖКУ В РАДИОЭФИРЕ.',
    effect: 'pulse',
    priority: 5,
    voiceName: 'АВТОРИТЕТ',
  },

  // ПАРАНОИК — Группа V: ПСИХИКА
  {
    id: 'briefing_perception_shadow',
    voice: 'perception',
    voiceGroup: 'motorics',
    threshold: 55,
    text: 'Ты видел это? Тень у вентиляции. Кто-то ещё слушает. И фраза "мимикрируют под городскую мебель"? Это код. Он знает, что Големы активны. Почему он преуминьшает угрозу? Это тест? Или мы — наживка?',
    effect: 'glitch',
    priority: 10,
    voiceName: 'ВОСПРИЯТИЕ',
    onView: {
      addFlags: ['noticed_listener'],
      unlockHint: 'Кто-то подслушивает',
    },
  },
  {
    id: 'briefing_gambling_trap',
    voice: 'gambling',
    voiceGroup: 'psyche',
    threshold: 60,
    maxThreshold: 100,
    text: 'Накопитель — не цель. Мы — приманка для Синтеза. Дрон пуст. Смотри на выходы. Они закроют нас там.',
    effect: 'glitch',
    priority: 9,
    voiceName: 'АЗАРТ',
    requiredFlags: ['paranoia_high'],
    onView: {
      addFlags: ['suspects_trap'],
    },
  },

  // РИТОРИКА — умение читать между строк
  {
    id: 'briefing_rhetoric_subtext',
    voice: 'rhetoric',
    voiceGroup: 'mind',
    threshold: 50,
    text: 'Обрати внимание на паузы. "Желтый код" — это не просто правила вовлечения. Это страховка. Если мы откроем огонь первыми, он снимает с себя ответственность. Подтекст: "Если умрёте — сами виноваты".',
    effect: 'terminal',
    priority: 7,
    voiceName: 'РИТОРИКА',
    onView: {
      addFlags: ['understood_yellow_code'],
    },
  },

  // ДРАМА — театральность ситуации
  {
    id: 'briefing_drama_performance',
    voice: 'drama',
    voiceGroup: 'psyche',
    threshold: 40,
    text: 'Как красиво он играет роль несгибаемого командира. Военные всегда такие. Но посмотри на тени под глазами. Этот спектакль стоит ему дорого. Может, подыграть? Или показать, что мы видим сквозь маску?',
    effect: 'whisper',
    priority: 4,
    voiceName: 'ДРАМА',
  },
]

/**
 * Инъекции для диалога о Големах
 */
const golemWarningInjections: PrivateInjection[] = [
  {
    id: 'briefing_logic_golem_analysis',
    voice: 'logic',
    voiceGroup: 'mind',
    threshold: 50,
    text: '"Мимикрируют под городскую мебель" — значит, стандартное обнаружение не сработает. Нужен нестандартный подход. Термальные сигнатуры? Звуковые аномалии? Они сделаны из камня и металла — у них другая теплопроводность.',
    effect: 'terminal',
    priority: 8,
    voiceName: 'ЛОГИКА',
    onView: {
      unlockHint: 'Термальное обнаружение может помочь',
    },
  },
  {
    id: 'briefing_courage_challenge',
    voice: 'courage',
    voiceGroup: 'consciousness',
    threshold: 55,
    text: 'Големы. Хорошо. Это будет настоящее испытание. Мы готовились к этому. Пусть другие боятся — мы будем действовать. Страх — это роскошь, которую мы не можем себе позволить.',
    effect: 'pulse',
    priority: 6,
    voiceName: 'ОТВАГА',
  },
  {
    id: 'briefing_coordination_tactics',
    voice: 'coordination',
    voiceGroup: 'motorics',
    threshold: 45,
    text: 'Если они неподвижны до атаки — это преимущество. Мы должны двигаться непредсказуемо. Зигзагами. Менять темп. Не давать им запереть нас в угол.',
    effect: 'none',
    priority: 5,
    voiceName: 'КООРДИНАЦИЯ',
  },
  {
    id: 'briefing_solidarity_team',
    voice: 'solidarity',
    voiceGroup: 'sociality',
    threshold: 40,
    text: 'Мы справимся, если будем держаться вместе. Один в Разломе — мертвец. Четверо — сила. Не забывай о товарищах.',
    effect: 'glow',
    priority: 5,
    voiceName: 'СОЛИДАРНОСТЬ',
  },
  {
    id: 'briefing_reaction_ambush',
    voice: 'reaction',
    voiceGroup: 'motorics',
    threshold: 50,
    text: 'Засада. Они ждут, пока мы расслабимся. Держи палец на спусковом крючке. Всегда. Первый выстрел — единственный шанс.',
    effect: 'pulse',
    priority: 7,
    voiceName: 'РЕАКЦИЯ',
  },
  {
    id: 'briefing_suggestion_control',
    voice: 'suggestion',
    voiceGroup: 'consciousness',
    threshold: 55,
    text: 'Мимики копируют не только внешность — они копируют поведение. Но не мысли. Задай вопрос, который знает только настоящий товарищ. Проверяй. Всегда проверяй.',
    effect: 'whisper',
    priority: 8,
    voiceName: 'ВНУШЕНИЕ',
    onView: {
      addFlags: ['knows_mimic_weakness'],
      unlockHint: 'Мимики не знают воспоминаний',
    },
  },
]

/**
 * Инъекции для диалога о снаряжении
 */
const equipmentInjections: PrivateInjection[] = [
  {
    id: 'equipment_analysis_inventory',
    voice: 'knowledge',
    voiceGroup: 'mind',
    threshold: 45,
    text: 'Стандартный набор. Недостаточно. Нужны: термальный сканер, заряды направленного взрыва, минимум три флейра. Спроси о дополнительном снаряжении.',
    effect: 'terminal',
    priority: 8,
    voiceName: 'ЗНАНИЯ',
    onView: {
      addFlags: ['needs_extra_equipment'],
    },
  },
  {
    id: 'equipment_strength_carry',
    voice: 'force',
    voiceGroup: 'body',
    threshold: 40,
    text: 'Мы можем нести больше. Дай нам тяжёлое оружие. Пусть слабаки несут аптечки — мы возьмём огневую мощь.',
    effect: 'pulse',
    priority: 5,
    voiceName: 'СИЛА',
  },
  {
    id: 'equipment_creativity_artifacts',
    voice: 'creativity',
    voiceGroup: 'psyche',
    threshold: 55,
    text: 'Артефакты. FJR конфискует их у торговцев. Наверняка в арсенале есть что-то... особенное. То, что не дают новичкам. Но мы — не новички.',
    effect: 'whisper',
    priority: 7,
    voiceName: 'ТВОРЧЕСТВО',
    onView: {
      addFlags: ['knows_artifact_storage'],
    },
  },
  {
    id: 'equipment_gambling_risk',
    voice: 'gambling',
    voiceGroup: 'psyche',
    threshold: 50,
    text: 'Рискнём? Попросим экспериментальное снаряжение. Да, оно может взорваться в руках. Но если сработает...',
    effect: 'glitch',
    priority: 6,
    voiceName: 'АЗАРТ',
  },
]

/**
 * Инъекции для диалога с перебежчицей
 */
const defectorInjections: PrivateInjection[] = [
  {
    id: 'defector_empathy_terror',
    voice: 'empathy',
    voiceGroup: 'sociality',
    threshold: 35,
    text: 'Её трясёт. Это не притворство. Она видела что-то настолько ужасное, что предпочла смерть от пули FJR, чем возвращение.',
    effect: 'glow',
    priority: 9,
    voiceName: 'ЭМПАТИЯ',
  },
  {
    id: 'defector_rhetoric_interrogate',
    voice: 'rhetoric',
    voiceGroup: 'mind',
    threshold: 50,
    text: 'Её можно сломать вопросами. Но можно и подружиться. Дружба даст больше информации, чем страх. Страх заставляет лгать. Доверие — говорить правду.',
    effect: 'terminal',
    priority: 7,
    voiceName: 'РИТОРИКА',
  },
  {
    id: 'defector_authority_threat',
    voice: 'authority',
    voiceGroup: 'consciousness',
    threshold: 55,
    text: 'СИНТЕЗ. ВРАГ. ШПИОН. НЕ ДОВЕРЯЙ. ОНА ЗДЕСЬ, ЧТОБЫ СОБРАТЬ ИНФОРМАЦИЮ. ПУЛЯ В ГОЛОВУ — И НИКАКИХ ПРОБЛЕМ.',
    effect: 'pulse',
    priority: 6,
    voiceName: 'АВТОРИТЕТ',
  },
  {
    id: 'defector_perception_details',
    voice: 'perception',
    voiceGroup: 'motorics',
    threshold: 50,
    text: 'Комбинезон порван в трёх местах. Следы когтей? Нет. Ножа. Она резала знаки отличия. Избавлялась от эмблем Синтеза. Это не шпион — это дезертир.',
    effect: 'glitch',
    priority: 8,
    voiceName: 'ВОСПРИЯТИЕ',
    onView: {
      addFlags: ['confirmed_defector'],
    },
  },
  {
    id: 'defector_drama_performance',
    voice: 'drama',
    voiceGroup: 'psyche',
    threshold: 45,
    text: 'Если это игра — она гениальная актриса. Дрожь, слёзы, надломленный голос... Но что если это правда? Что если Синтез действительно творит что-то такое, от чего бегут свои?',
    effect: 'whisper',
    priority: 6,
    voiceName: 'ДРАМА',
  },
]

// ============================================================================
// DIALOGUES — Полифонические диалоги
// ============================================================================

const dialogues: PolyphonicDialogue[] = [
  // Диалог 1: Введение
  {
    id: 'briefing_intro',
    sharedContent: {
      text: 'Тектонические сдвиги в Сетке Реальности стабилизировались. У нас есть окно.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'serious', intensity: 90 },
      background: '/images/backgrounds/bunker_briefing.jpg',
    },
    privateInjections: [
      {
        id: 'briefing_intro_perception',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 35,
        text: 'Карты на столе. Красные зоны. Много красных зон. Больше, чем в прошлый раз.',
        effect: 'none',
        priority: 3,
        voiceName: 'ВОСПРИЯТИЕ',
      },
    ],
    nextDialogue: 'briefing_time_window',
  },

  // Диалог 2: Временное окно (основной)
  {
    id: 'briefing_time_window',
    sharedContent: {
      text: 'У нас есть окно в сорок минут. Мы засекли сигнатуру дрона — Сектор 4, возле Библиотеки. Он глубоко в "Серости". Ваша задача: зайти, изъять накопитель, выйти.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'commanding', intensity: 85 },
    },
    privateInjections: timeWindowInjections,
    nextDialogue: 'briefing_rules_engagement',
  },

  // Диалог 3: Правила вовлечения
  {
    id: 'briefing_rules_engagement',
    sharedContent: {
      text: 'Правила вовлечения — жёлтый код: огонь только при прорыве периметра.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'stern', intensity: 80 },
    },
    privateInjections: [
      {
        id: 'briefing_honor_duty',
        voice: 'honor',
        voiceGroup: 'sociality',
        threshold: 45,
        text: 'Жёлтый код — это разумно. Мы не убийцы. Мы защищаемся. Эта черта отделяет нас от бандитов.',
        effect: 'glow',
        priority: 5,
        voiceName: 'ЧЕСТЬ',
      },
      {
        id: 'briefing_rhetoric_subtext_2',
        voice: 'rhetoric',
        voiceGroup: 'mind',
        threshold: 50,
        text: '"Прорыв периметра" — размытая формулировка. Что считается периметром? Это даёт нам пространство для интерпретации. Или ловушку для обвинений.',
        effect: 'terminal',
        priority: 6,
        voiceName: 'РИТОРИКА',
      },
    ],
    nextDialogue: 'briefing_golem_warning',
  },

  // Диалог 4: Предупреждение о Големах
  {
    id: 'briefing_golem_warning',
    sharedContent: {
      text: 'Конструкты в этой зоне... они мимикрируют под городскую мебель. Статуи, стены. Смотрите в оба.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'warning', intensity: 75 },
    },
    privateInjections: golemWarningInjections,
    nextDialogue: 'briefing_questions',
  },

  // Диалог 5: Вопросы
  {
    id: 'briefing_questions',
    sharedContent: {
      text: 'Вопросы?',
      speaker: 'Командант Хольц',
      emotion: { primary: 'expectant', intensity: 60 },
    },
    privateInjections: [
      {
        id: 'briefing_logic_questions',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 55,
        text: 'Десятки вопросов. Но какие из них выдадут наши знания? Какие — нашу слабость?',
        effect: 'terminal',
        priority: 7,
        voiceName: 'ЛОГИКА',
      },
      {
        id: 'briefing_empathy_comfort',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 45,
        text: 'Он надеется, что вопросов не будет. Каждый вопрос — это напоминание о том, сколько он не знает. Сколько он не может защитить.',
        effect: 'glow',
        priority: 6,
        voiceName: 'ЭМПАТИЯ',
      },
    ],
    options: [
      {
        id: 'accept_mission',
        text: 'Принято, Командант.',
        nextScene: 'briefing_end_standard',
        effects: {
          reputation: [{ faction: 'fjr', delta: 5 }],
        },
      },
      {
        id: 'question_time',
        text: '[Логика] Сорок минут — это оптимистичная оценка?',
        nextDialogue: 'briefing_time_challenge',
        requiredStat: { stat: 'logic', value: 45 },
        presentation: {
          color: 'cyan',
          icon: 'logic',
          tooltip: 'Проверка Логики (45)',
          voiceHint: 'logic',
        },
      },
      {
        id: 'question_injury',
        text: '[Эмпатия] Вы в порядке, сэр? Ваша нога...',
        nextDialogue: 'briefing_injury_reveal',
        requiredStat: { stat: 'empathy', value: 50 },
        requiredFlag: 'noticed_holz_injury',
        presentation: {
          color: 'emerald',
          icon: 'empathy',
          tooltip: 'Проверка Эмпатии (50) — Требуется флаг',
          voiceHint: 'empathy',
        },
        effects: {
          addFlags: ['confronted_holz_injury'],
        },
      },
      {
        id: 'question_listener',
        text: '[Восприятие] Кто ещё слушает этот брифинг?',
        nextDialogue: 'briefing_listener_reveal',
        requiredStat: { stat: 'perception', value: 55 },
        requiredFlag: 'noticed_listener',
        presentation: {
          color: 'amber',
          icon: 'perception',
          tooltip: 'Проверка Восприятия (55) — Требуется флаг',
          voiceHint: 'perception',
        },
      },
      {
        id: 'question_golems',
        text: '[Отвага] Расскажите больше о Конструктах. Мы готовы.',
        nextDialogue: 'briefing_golem_details',
        requiredStat: { stat: 'courage', value: 50 },
        presentation: {
          color: 'violet',
          icon: 'courage',
          tooltip: 'Проверка Отваги (50)',
          voiceHint: 'courage',
        },
      },
    ],
  },

  // Диалог 6: Вызов по времени
  {
    id: 'briefing_time_challenge',
    sharedContent: {
      text: 'Хольц замирает на секунду. Его глаза сужаются.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'challenge_logic_win',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Он понял, что мы не идиоты. Хорошо. Теперь он будет честнее.',
        effect: 'terminal',
        priority: 8,
        voiceName: 'ЛОГИКА',
      },
    ],
    nextDialogue: 'briefing_time_response',
  },

  // Диалог 7: Ответ Хольца на вызов по времени
  {
    id: 'briefing_time_response',
    sharedContent: {
      text: '...Двадцать восемь минут, если быть точным. Буфер — на случай непредвиденных обстоятельств. Рад, что в отряде есть кто-то, кто умеет считать.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'respect', intensity: 65 },
    },
    privateInjections: [
      {
        id: 'response_rhetoric_respect',
        voice: 'rhetoric',
        voiceGroup: 'mind',
        threshold: 35,
        text: 'Это комплимент. Скрытый, но комплимент. Он теперь будет относиться к нам серьёзнее.',
        effect: 'terminal',
        priority: 5,
        voiceName: 'РИТОРИКА',
      },
    ],
    options: [
      {
        id: 'nod_continue',
        text: 'Понял. Мы будем учитывать реальное время.',
        nextScene: 'briefing_end_informed',
        effects: {
          addFlags: ['has_real_time_info'],
          reputation: [{ faction: 'fjr', delta: 10 }],
          xp: 15,
        },
      },
    ],
  },

  // Диалог 8: Раскрытие травмы
  {
    id: 'briefing_injury_reveal',
    sharedContent: {
      text: 'Хольц бледнеет. На мгновение маска падает.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'injury_empathy_pain',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 40,
        text: 'Мы задели что-то глубокое. Не физическую рану — душевную.',
        effect: 'glow',
        priority: 9,
        voiceName: 'ЭМПАТИЯ',
      },
    ],
    nextDialogue: 'briefing_injury_response',
  },

  // Диалог 9: Ответ про травму
  {
    id: 'briefing_injury_response',
    sharedContent: {
      text: '...Вчера я потерял четверых. Хороших людей. В том же секторе, куда отправляю вас. Нога... это напоминание. Что я должен был быть с ними. Не отправляйте меня обратно в этот ад — вернитесь живыми. Это приказ.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'vulnerable', intensity: 90 },
    },
    privateInjections: [
      {
        id: 'injury_response_solidarity',
        voice: 'solidarity',
        voiceGroup: 'sociality',
        threshold: 35,
        text: 'Теперь мы понимаем его. Он один из нас. Он тоже терял товарищей. Мы вернёмся — ради него тоже.',
        effect: 'glow',
        priority: 8,
        voiceName: 'СОЛИДАРНОСТЬ',
      },
      {
        id: 'injury_response_honor',
        voice: 'honor',
        voiceGroup: 'sociality',
        threshold: 40,
        text: 'Этот долг мы примем. Не как приказ — как обещание.',
        effect: 'glow',
        priority: 7,
        voiceName: 'ЧЕСТЬ',
      },
    ],
    options: [
      {
        id: 'promise_return',
        text: 'Мы вернёмся, сэр. Все.',
        nextScene: 'briefing_end_bonded',
        effects: {
          addFlags: ['holz_trust_high', 'team_morale_boost'],
          reputation: [{ faction: 'fjr', delta: 20 }],
          xp: 25,
        },
      },
    ],
  },

  // Диалог 10: Раскрытие слушателя
  {
    id: 'briefing_listener_reveal',
    sharedContent: {
      text: 'Хольц резко оборачивается к вентиляции. Его рука ложится на кобуру.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'listener_perception_confirm',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 40,
        text: 'Он знал. Или подозревал. Но не хотел показывать слабость.',
        effect: 'glitch',
        priority: 9,
        voiceName: 'ВОСПРИЯТИЕ',
      },
    ],
    nextDialogue: 'briefing_listener_response',
  },

  // Диалог 11: Ответ про слушателя
  {
    id: 'briefing_listener_response',
    sharedContent: {
      text: '...Выходи. Медленно.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'alert', intensity: 95 },
    },
    privateInjections: [],
    nextDialogue: 'briefing_listener_reveal_person',
  },

  // Диалог 12: Появление слушателя
  {
    id: 'briefing_listener_reveal_person',
    sharedContent: {
      text: 'Из тени выходит молодая женщина в потрёпанном комбинезоне Синтеза. Её руки подняты.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'listener_perception_synthesis',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 35,
        text: 'Синтез. Наши враги? Или дезертир?',
        effect: 'glitch',
        priority: 8,
        voiceName: 'ВОСПРИЯТИЕ',
      },
      {
        id: 'listener_empathy_fear',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 45,
        text: 'Она напугана до смерти. Это не шпион — это беглец.',
        effect: 'glow',
        priority: 9,
        voiceName: 'ЭМПАТИЯ',
      },
    ],
    options: [
      {
        id: 'listener_attack',
        text: '[Авторитет] Синтез! На колени!',
        nextScene: 'briefing_end_hostile',
        requiredStat: { stat: 'authority', value: 45 },
        presentation: {
          color: 'violet',
          icon: 'authority',
          voiceHint: 'authority',
        },
      },
      {
        id: 'listener_mercy',
        text: '[Эмпатия] Подожди. Она напугана. Дай ей говорить.',
        nextScene: 'briefing_end_synthesis_contact',
        requiredStat: { stat: 'empathy', value: 50 },
        presentation: {
          color: 'emerald',
          icon: 'empathy',
          voiceHint: 'empathy',
        },
        effects: {
          addFlags: ['synthesis_defector_contact'],
          xp: 30,
        },
      },
    ],
  },

  // Диалог 13: Детали о Големах
  {
    id: 'briefing_golem_details',
    sharedContent: {
      text: 'Хольц кивает с уважением.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'golem_courage_respect',
        voice: 'courage',
        voiceGroup: 'consciousness',
        threshold: 40,
        text: 'Он видит в нас воинов, а не просто расходный материал. Это хорошо.',
        effect: 'pulse',
        priority: 6,
        voiceName: 'ОТВАГА',
      },
    ],
    nextDialogue: 'briefing_golem_details_2',
  },

  // Диалог 14: Детали о Големах (продолжение)
  {
    id: 'briefing_golem_details_2',
    sharedContent: {
      text: 'Три типа. "Глыбы" — медленные, но броня как у танка. Бей по стыкам. "Сдвиги" — полупрозрачные, уклоняются от всего. Нужно что-то... нестандартное. И "Мимики" — они копируют членов отряда. Не доверяй глазам.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'instructive', intensity: 75 },
    },
    privateInjections: [
      {
        id: 'golem_logic_types',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Три архетипа: танк, скирмишер, поддержка. Классическая тактическая триада. Мы можем это использовать.',
        effect: 'terminal',
        priority: 8,
        voiceName: 'ЛОГИКА',
        onView: {
          addFlags: ['knows_golem_types'],
          unlockHint: 'Типы Големов: Глыба, Сдвиг, Мимик',
        },
      },
      {
        id: 'golem_creativity_holy',
        voice: 'creativity',
        voiceGroup: 'psyche',
        threshold: 50,
        text: '"Нестандартное"... Святая вода? Молитва? Они же из Серости — мистическое должно работать.',
        effect: 'whisper',
        priority: 7,
        voiceName: 'ТВОРЧЕСТВО',
        onView: {
          unlockHint: 'Мистические методы могут работать против Сдвигов',
        },
      },
    ],
    options: [
      {
        id: 'ready_for_battle',
        text: 'Мы готовы. Спасибо за информацию.',
        nextScene: 'briefing_end_prepared',
        effects: {
          addFlags: ['fully_briefed'],
          reputation: [{ faction: 'fjr', delta: 15 }],
          xp: 20,
        },
      },
      {
        id: 'ask_about_mimic_weakness',
        text: '[Внушение] Как отличить Мимика от настоящего товарища?',
        nextDialogue: 'briefing_mimic_weakness',
        requiredStat: { stat: 'suggestion', value: 50 },
        presentation: {
          color: 'violet',
          icon: 'suggestion',
          tooltip: 'Проверка Внушения (50)',
          voiceHint: 'suggestion',
        },
      },
      {
        id: 'ask_about_equipment',
        text: '[Знания] Нам понадобится специальное снаряжение.',
        nextDialogue: 'briefing_equipment',
        requiredStat: { stat: 'knowledge', value: 45 },
        requiredFlag: 'needs_extra_equipment',
        presentation: {
          color: 'cyan',
          icon: 'knowledge',
          tooltip: 'Проверка Знаний (45) — Требуется флаг',
          voiceHint: 'knowledge',
        },
      },
    ],
  },

  // Диалог 15: Слабость Мимиков
  {
    id: 'briefing_mimic_weakness',
    sharedContent: {
      text: 'Хольц наклоняется ближе. Его голос становится тише.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'mimic_suggestion_secret',
        voice: 'suggestion',
        voiceGroup: 'consciousness',
        threshold: 40,
        text: 'Он собирается рассказать что-то, чего нет в официальных отчётах. Секрет, который стоил кому-то жизни.',
        effect: 'whisper',
        priority: 8,
        voiceName: 'ВНУШЕНИЕ',
      },
    ],
    nextDialogue: 'briefing_mimic_weakness_2',
  },

  // Диалог 16: Слабость Мимиков (продолжение)
  {
    id: 'briefing_mimic_weakness_2',
    sharedContent: {
      text: 'Мимик копирует только то, что видит. Память — нет. Спроси что-то личное. Имя матери. Первый поцелуй. Что угодно, чего не знает никто, кроме настоящего человека. И ещё... они не моргают. Следи за глазами.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'secretive', intensity: 80 },
    },
    privateInjections: [
      {
        id: 'mimic_logic_protocol',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 35,
        text: 'Контрольные вопросы. Нужно придумать их сейчас. Для каждого члена отряда. И убедиться, что все знают ответы друг друга.',
        effect: 'terminal',
        priority: 9,
        voiceName: 'ЛОГИКА',
        onView: {
          addFlags: ['has_verification_protocol'],
          unlockHint: 'Протокол верификации: личные вопросы',
        },
      },
      {
        id: 'mimic_perception_eyes',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 40,
        text: 'Не моргают. Хорошо. Это проще, чем ждать ответа на вопрос. Смотри на глаза. Всегда смотри на глаза.',
        effect: 'glitch',
        priority: 7,
        voiceName: 'ВОСПРИЯТИЕ',
        onView: {
          addFlags: ['knows_mimic_tell'],
        },
      },
    ],
    options: [
      {
        id: 'understood_mimic',
        text: 'Понял. Мы разработаем протокол проверки.',
        nextScene: 'briefing_end_tactical',
        effects: {
          addFlags: ['fully_briefed', 'has_mimic_protocol'],
          reputation: [{ faction: 'fjr', delta: 20 }],
          xp: 25,
        },
      },
    ],
  },

  // Диалог 17: Снаряжение
  {
    id: 'briefing_equipment',
    sharedContent: {
      text: 'Хольц хмурится.',
      speaker: 'Narrator',
    },
    privateInjections: equipmentInjections,
    nextDialogue: 'briefing_equipment_2',
  },

  // Диалог 18: Снаряжение (ответ)
  {
    id: 'briefing_equipment_2',
    sharedContent: {
      text: 'Стандартный комплект... да, его недостаточно. Но ресурсы ограничены. Что конкретно вам нужно?',
      speaker: 'Командант Хольц',
      emotion: { primary: 'cautious', intensity: 70 },
    },
    privateInjections: [
      {
        id: 'equipment_rhetoric_negotiate',
        voice: 'rhetoric',
        voiceGroup: 'mind',
        threshold: 45,
        text: 'Он готов торговаться. Но не проси слишком много — покажешь жадность. И не проси слишком мало — покажешь неуверенность.',
        effect: 'terminal',
        priority: 7,
        voiceName: 'РИТОРИКА',
      },
    ],
    options: [
      {
        id: 'request_thermal',
        text: '[Логика] Термальный сканер. Один на отряд — достаточно.',
        nextDialogue: 'briefing_equipment_thermal',
        requiredStat: { stat: 'logic', value: 45 },
        presentation: {
          color: 'cyan',
          icon: 'logic',
          voiceHint: 'logic',
        },
      },
      {
        id: 'request_explosives',
        text: '[Знания] Заряды направленного взрыва. Для расчистки завалов.',
        nextDialogue: 'briefing_equipment_explosives',
        requiredStat: { stat: 'knowledge', value: 50 },
        requiredFlag: 'knows_drone_buried',
        presentation: {
          color: 'cyan',
          icon: 'knowledge',
          tooltip: 'Требуется флаг: знание о завалах',
          voiceHint: 'knowledge',
        },
      },
      {
        id: 'request_artifacts',
        text: '[Творчество] Артефакты. Мистические. Против Сдвигов.',
        nextDialogue: 'briefing_equipment_artifacts',
        requiredStat: { stat: 'creativity', value: 55 },
        requiredFlag: 'knows_artifact_storage',
        presentation: {
          color: 'pink',
          icon: 'creativity',
          tooltip: 'Требуется флаг: знание об артефактах',
          voiceHint: 'creativity',
        },
      },
      {
        id: 'request_nothing',
        text: 'Стандартного комплекта хватит. Мы справимся.',
        nextScene: 'briefing_end_standard',
        effects: {
          reputation: [{ faction: 'fjr', delta: 5 }],
        },
      },
    ],
  },

  // Диалог 19: Термальный сканер
  {
    id: 'briefing_equipment_thermal',
    sharedContent: {
      text: 'Хольц кивает и делает пометку в планшете.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'thermal_logic_approved',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 35,
        text: 'Разумный запрос. Он это оценит. И даст.',
        effect: 'terminal',
        priority: 6,
        voiceName: 'ЛОГИКА',
      },
    ],
    nextDialogue: 'briefing_equipment_thermal_2',
  },

  // Диалог 20: Термальный сканер (ответ)
  {
    id: 'briefing_equipment_thermal_2',
    sharedContent: {
      text: 'Термальник. Да, это умно. Есть один в арсенале — старый, но работает. Заберёте у интенданта.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'approving', intensity: 65 },
    },
    privateInjections: [],
    options: [
      {
        id: 'thanks_thermal',
        text: 'Благодарю, сэр.',
        nextScene: 'briefing_end_equipped',
        effects: {
          addFlags: ['has_thermal_scanner', 'fully_briefed'],
          reputation: [{ faction: 'fjr', delta: 15 }],
          xp: 20,
        },
      },
    ],
  },

  // Диалог 21: Взрывчатка
  {
    id: 'briefing_equipment_explosives',
    sharedContent: {
      text: 'Хольц замирает. Его взгляд становится острым.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'explosives_analysis_test',
        voice: 'knowledge',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Он понял, что мы знаем о завалах. Он не упоминал их в брифинге. Откуда мы знаем?',
        effect: 'terminal',
        priority: 8,
        voiceName: 'ЗНАНИЯ',
      },
    ],
    nextDialogue: 'briefing_equipment_explosives_2',
  },

  // Диалог 22: Взрывчатка (ответ)
  {
    id: 'briefing_equipment_explosives_2',
    sharedContent: {
      text: '...Вы знаете о завалах. Как? Неважно. Да, дрон погребён. Два заряда. Больше дать не могу — остальные нужны на других участках. Хватит?',
      speaker: 'Командант Хольц',
      emotion: { primary: 'surprised', intensity: 75 },
    },
    privateInjections: [
      {
        id: 'explosives_logic_calculate',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 45,
        text: 'Два заряда. Один на основной проход, один на запасной выход. Если всё пойдёт по плану. Если нет — придётся импровизировать.',
        effect: 'terminal',
        priority: 7,
        voiceName: 'ЛОГИКА',
      },
      {
        id: 'explosives_rhetoric_respect',
        voice: 'rhetoric',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Он теперь смотрит на нас иначе. Не как на пушечное мясо. Как на профессионалов.',
        effect: 'terminal',
        priority: 5,
        voiceName: 'РИТОРИКА',
      },
    ],
    options: [
      {
        id: 'accept_explosives',
        text: 'Два — достаточно. Мы справимся.',
        nextScene: 'briefing_end_demolition',
        effects: {
          addFlags: ['has_explosives', 'fully_briefed', 'holz_impressed'],
          reputation: [{ faction: 'fjr', delta: 25 }],
          xp: 30,
        },
      },
    ],
  },

  // Диалог 23: Артефакты
  {
    id: 'briefing_equipment_artifacts',
    sharedContent: {
      text: 'Хольц отступает на шаг. Его лицо каменеет.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'artifacts_creativity_danger',
        voice: 'creativity',
        voiceGroup: 'psyche',
        threshold: 45,
        text: 'Мы попали в нерв. Артефакты — запретная тема. Но это не значит, что их нет.',
        effect: 'whisper',
        priority: 8,
        voiceName: 'ТВОРЧЕСТВО',
      },
      {
        id: 'artifacts_perception_reaction',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 50,
        text: 'Его зрачки расширились. Он знает, о чём мы говорим. И ему это не нравится.',
        effect: 'glitch',
        priority: 7,
        voiceName: 'ВОСПРИЯТИЕ',
      },
    ],
    nextDialogue: 'briefing_equipment_artifacts_2',
  },

  // Диалог 24: Артефакты (ответ)
  {
    id: 'briefing_equipment_artifacts_2',
    sharedContent: {
      text: '...Официально — у FJR нет артефактов. Неофициально... Пойдёмте. Эта информация — не для общего уха.',
      speaker: 'Командант Хольц',
      emotion: { primary: 'secretive', intensity: 90 },
    },
    privateInjections: [
      {
        id: 'artifacts_gambling_jackpot',
        voice: 'gambling',
        voiceGroup: 'psyche',
        threshold: 40,
        text: 'Бинго. Секретный арсенал. Это изменит всё.',
        effect: 'pulse',
        priority: 9,
        voiceName: 'АЗАРТ',
      },
      {
        id: 'artifacts_honor_cost',
        voice: 'honor',
        voiceGroup: 'sociality',
        threshold: 45,
        text: 'Он рискует. Ради нас. Мы не имеем права его подвести.',
        effect: 'glow',
        priority: 7,
        voiceName: 'ЧЕСТЬ',
      },
    ],
    options: [
      {
        id: 'follow_holz',
        text: 'Веди, Командант.',
        nextScene: 'briefing_end_secret_armory',
        effects: {
          addFlags: ['access_secret_armory', 'fully_briefed', 'holz_trusts'],
          reputation: [{ faction: 'fjr', delta: 30 }],
          xp: 40,
        },
      },
    ],
  },

  // Диалог 25: Перебежчица — расширенный диалог
  {
    id: 'briefing_defector_dialogue',
    sharedContent: {
      text: 'Женщина сглатывает. Её голос дрожит.',
      speaker: 'Narrator',
    },
    privateInjections: defectorInjections,
    nextDialogue: 'briefing_defector_story',
  },

  // Диалог 26: История перебежчицы
  {
    id: 'briefing_defector_story',
    sharedContent: {
      text: 'Меня зовут Катя. Катарина Вебер. Я была... я была техником в Синтезе. Системы жизнеобеспечения. Но то, что я увидела... Они не люди больше. Они... они сращивают людей с машинами. Живых людей. Без анестезии. Я слышала крики каждую ночь.',
      speaker: 'Катарина',
      emotion: { primary: 'terrified', intensity: 95 },
    },
    privateInjections: [
      {
        id: 'defector_story_empathy_horror',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 30,
        text: 'Боже. Это не ложь. Она пережила ад. Настоящий ад.',
        effect: 'glow',
        priority: 10,
        voiceName: 'ЭМПАТИЯ',
      },
      {
        id: 'defector_story_logic_data',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 50,
        text: 'Киборгизация. Принудительная. Это объясняет слухи о "бессмертных солдатах" Синтеза. Они не бессмертны — они... переделаны.',
        effect: 'terminal',
        priority: 9,
        voiceName: 'ЛОГИКА',
        onView: {
          addFlags: ['knows_synthesis_cyborgs'],
          unlockHint: 'Синтез создаёт киборгов из живых людей',
        },
      },
      {
        id: 'defector_story_perception_scars',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 55,
        text: 'Шрамы на её запястьях. Не от попытки суицида. От наручников. Она была пленницей. Не работником.',
        effect: 'glitch',
        priority: 8,
        voiceName: 'ВОСПРИЯТИЕ',
        onView: {
          addFlags: ['defector_was_prisoner'],
        },
      },
    ],
    options: [
      {
        id: 'defector_believe',
        text: '[Эмпатия] Я верю тебе. Ты в безопасности.',
        nextDialogue: 'briefing_defector_intel',
        requiredStat: { stat: 'empathy', value: 45 },
        presentation: {
          color: 'emerald',
          icon: 'empathy',
          voiceHint: 'empathy',
        },
        effects: {
          addFlags: ['defector_trusts_player'],
        },
      },
      {
        id: 'defector_interrogate',
        text: '[Риторика] Что ты знаешь о Секторе 4? О Библиотеке?',
        nextDialogue: 'briefing_defector_intel_sector4',
        requiredStat: { stat: 'rhetoric', value: 50 },
        presentation: {
          color: 'cyan',
          icon: 'rhetoric',
          voiceHint: 'rhetoric',
        },
      },
      {
        id: 'defector_reject',
        text: '[Авторитет] Хватит историй. Хольц, запри её.',
        nextScene: 'briefing_end_defector_jailed',
        requiredStat: { stat: 'authority', value: 55 },
        presentation: {
          color: 'violet',
          icon: 'authority',
          voiceHint: 'authority',
        },
        effects: {
          addFlags: ['defector_jailed'],
          reputation: [{ faction: 'fjr', delta: 10 }, { faction: 'synthesis', delta: -5 }],
        },
      },
    ],
  },

  // Диалог 27: Разведданные от перебежчицы
  {
    id: 'briefing_defector_intel',
    sharedContent: {
      text: 'Катарина кивает, вытирая слёзы.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'intel_solidarity_ally',
        voice: 'solidarity',
        voiceGroup: 'sociality',
        threshold: 35,
        text: 'Она может стать союзником. Не просто источником информации — настоящим товарищем.',
        effect: 'glow',
        priority: 7,
        voiceName: 'СОЛИДАРНОСТЬ',
      },
    ],
    nextDialogue: 'briefing_defector_intel_2',
  },

  // Диалог 28: Разведданные (продолжение)
  {
    id: 'briefing_defector_intel_2',
    sharedContent: {
      text: 'Я знаю коды доступа. Частоты патрулей. И... я знаю, где они держат пленных. Библиотека — это не просто точка крушения дрона. Там база. Небольшая, но... там люди. Наши люди. Те, кого вы "потеряли".',
      speaker: 'Катарина',
      emotion: { primary: 'desperate', intensity: 85 },
    },
    privateInjections: [
      {
        id: 'intel_logic_rescue',
        voice: 'logic',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Изменение миссии. Не просто извлечение данных — потенциально спасательная операция. Это усложняет всё... и меняет приоритеты.',
        effect: 'terminal',
        priority: 9,
        voiceName: 'ЛОГИКА',
        onView: {
          addFlags: ['knows_prisoners_location'],
          unlockHint: 'В Библиотеке — пленники FJR',
        },
      },
      {
        id: 'intel_honor_duty',
        voice: 'honor',
        voiceGroup: 'sociality',
        threshold: 45,
        text: 'Они живы. Люди Хольца. Мы не можем оставить их там. Это не обсуждается.',
        effect: 'glow',
        priority: 10,
        voiceName: 'ЧЕСТЬ',
      },
      {
        id: 'intel_empathy_holz',
        voice: 'empathy',
        voiceGroup: 'sociality',
        threshold: 40,
        text: 'Посмотри на Хольца. Он побледнел. Надежда — страшнее отчаяния. Теперь он будет думать, что мог их спасти.',
        effect: 'glow',
        priority: 8,
        voiceName: 'ЭМПАТИЯ',
      },
    ],
    options: [
      {
        id: 'accept_rescue_mission',
        text: 'Командант, миссия изменилась. Мы вытащим ваших людей.',
        nextScene: 'briefing_end_rescue_mission',
        effects: {
          addFlags: ['rescue_mission_accepted', 'defector_ally', 'holz_grateful'],
          reputation: [{ faction: 'fjr', delta: 40 }],
          xp: 50,
        },
      },
      {
        id: 'primary_objective',
        text: '[Логика] Сначала — накопитель. Потом — пленники. Если время позволит.',
        nextScene: 'briefing_end_pragmatic',
        requiredStat: { stat: 'logic', value: 50 },
        presentation: {
          color: 'cyan',
          icon: 'logic',
          voiceHint: 'logic',
        },
        effects: {
          addFlags: ['pragmatic_approach', 'defector_ally'],
          reputation: [{ faction: 'fjr', delta: 20 }],
          xp: 35,
        },
      },
    ],
  },

  // Диалог 29: Разведданные о Секторе 4
  {
    id: 'briefing_defector_intel_sector4',
    sharedContent: {
      text: 'Катарина сосредотачивается, пытаясь вспомнить.',
      speaker: 'Narrator',
    },
    privateInjections: [
      {
        id: 'sector4_rhetoric_extract',
        voice: 'rhetoric',
        voiceGroup: 'mind',
        threshold: 40,
        text: 'Хороший подход. Конкретные вопросы — конкретные ответы. Она не потеряется в эмоциях.',
        effect: 'terminal',
        priority: 6,
        voiceName: 'РИТОРИКА',
      },
    ],
    nextDialogue: 'briefing_defector_intel_sector4_2',
  },

  // Диалог 30: Разведданные о Секторе 4 (продолжение)
  {
    id: 'briefing_defector_intel_sector4_2',
    sharedContent: {
      text: 'Сектор 4... Там точка конвергенции. Место, где Серость... стабильнее. Синтез использует его как транзитный хаб. Патрули каждые пятнадцать минут. Три точки входа: главный вход через площадь, подвал через канализацию, крыша через соседнее здание. Главный вход — ловушка. Всегда.',
      speaker: 'Катарина',
      emotion: { primary: 'focused', intensity: 70 },
    },
    privateInjections: [
      {
        id: 'sector4_analysis_routes',
        voice: 'knowledge',
        voiceGroup: 'mind',
        threshold: 45,
        text: 'Три точки входа. Канализация — медленно, но скрытно. Крыша — рискованно, но быстро. Выбор зависит от времени и состава отряда.',
        effect: 'terminal',
        priority: 8,
        voiceName: 'ЗНАНИЯ',
        onView: {
          addFlags: ['knows_entry_points'],
          unlockHint: 'Три входа: площадь (ловушка), канализация (скрытно), крыша (рискованно)',
        },
      },
      {
        id: 'sector4_coordination_route',
        voice: 'coordination',
        voiceGroup: 'motorics',
        threshold: 50,
        text: 'Крыша. Если мы достаточно быстрые и координированные — крыша. Минимальный контакт, максимальная скорость.',
        effect: 'pulse',
        priority: 7,
        voiceName: 'КООРДИНАЦИЯ',
      },
      {
        id: 'sector4_perception_trap',
        voice: 'perception',
        voiceGroup: 'motorics',
        threshold: 55,
        text: '"Главный вход — ловушка". Запомни это. И передай отряду. Если кто-то предложит идти через площадь — проверь его на Мимика.',
        effect: 'glitch',
        priority: 9,
        voiceName: 'ВОСПРИЯТИЕ',
        onView: {
          addFlags: ['knows_main_entrance_trap'],
        },
      },
    ],
    options: [
      {
        id: 'thank_defector_tactical',
        text: 'Это спасёт нам жизни. Спасибо, Катарина.',
        nextScene: 'briefing_end_tactical_intel',
        effects: {
          addFlags: ['has_tactical_intel', 'defector_ally', 'fully_briefed'],
          reputation: [{ faction: 'fjr', delta: 25 }],
          xp: 35,
        },
      },
      {
        id: 'ask_about_prisoners',
        text: '[Эмпатия] А пленники? Там есть пленники?',
        nextDialogue: 'briefing_defector_intel_2',
        requiredStat: { stat: 'empathy', value: 40 },
        presentation: {
          color: 'emerald',
          icon: 'empathy',
          voiceHint: 'empathy',
        },
      },
    ],
  },
]

// ============================================================================
// SCENE DEFINITION
// ============================================================================

export const briefingHolzScene: PolyphonicScene = {
  id: 'chapter3_briefing_holz',
  chapterId: 'chapter3',
  questId: 'main_quest_rift_crossing',

  background: '/images/backgrounds/bunker_briefing.jpg',
  music: '/audio/ambient/military_briefing.mp3',

  characters: [
    {
      id: 'holz',
      name: 'Командант Хольц',
      position: 'center',
      sprite: '/images/characters/holz_portrait.png',
      emotion: { primary: 'serious', intensity: 80 },
    },
  ],

  dialogues,
  entryDialogueId: 'briefing_intro',

  isActive: true,
}

// ============================================================================
// EXPORTS
// ============================================================================

export default briefingHolzScene

// ============================================================================
// SCENE ENDINGS — Различные концовки сцены брифинга
// ============================================================================

/**
 * Описания всех возможных концовок брифинга
 */
export const briefingEndings = {
  briefing_end_standard: {
    id: 'briefing_end_standard',
    title: 'Стандартный исход',
    description: 'Отряд принял миссию без дополнительных вопросов.',
    flags: [],
    bonuses: { xp: 0, reputation: { fjr: 5 } },
  },
  briefing_end_informed: {
    id: 'briefing_end_informed',
    title: 'Информированный исход',
    description: 'Отряд узнал реальное время окна — 28 минут.',
    flags: ['has_real_time_info'],
    bonuses: { xp: 15, reputation: { fjr: 10 } },
  },
  briefing_end_bonded: {
    id: 'briefing_end_bonded',
    title: 'Связь с командиром',
    description: 'Отряд установил личную связь с Хольцем через его травму.',
    flags: ['holz_trust_high', 'team_morale_boost'],
    bonuses: { xp: 25, reputation: { fjr: 20 } },
  },
  briefing_end_hostile: {
    id: 'briefing_end_hostile',
    title: 'Враждебный исход',
    description: 'Перебежчица арестована с применением силы.',
    flags: ['defector_hostile'],
    bonuses: { xp: 5, reputation: { fjr: 15, synthesis: -10 } },
  },
  briefing_end_synthesis_contact: {
    id: 'briefing_end_synthesis_contact',
    title: 'Контакт с Синтезом',
    description: 'Установлен контакт с перебежчицей из Синтеза.',
    flags: ['synthesis_defector_contact'],
    bonuses: { xp: 30, reputation: { fjr: 10 } },
  },
  briefing_end_prepared: {
    id: 'briefing_end_prepared',
    title: 'Полная подготовка',
    description: 'Отряд получил полную информацию о Големах.',
    flags: ['fully_briefed'],
    bonuses: { xp: 20, reputation: { fjr: 15 } },
  },
  briefing_end_tactical: {
    id: 'briefing_end_tactical',
    title: 'Тактическое преимущество',
    description: 'Отряд разработал протокол против Мимиков.',
    flags: ['fully_briefed', 'has_mimic_protocol'],
    bonuses: { xp: 25, reputation: { fjr: 20 } },
  },
  briefing_end_equipped: {
    id: 'briefing_end_equipped',
    title: 'Снаряжённые',
    description: 'Отряд получил термальный сканер.',
    flags: ['has_thermal_scanner', 'fully_briefed'],
    bonuses: { xp: 20, reputation: { fjr: 15 } },
  },
  briefing_end_demolition: {
    id: 'briefing_end_demolition',
    title: 'Сапёры',
    description: 'Отряд получил взрывчатку и произвёл впечатление на Хольца.',
    flags: ['has_explosives', 'fully_briefed', 'holz_impressed'],
    bonuses: { xp: 30, reputation: { fjr: 25 } },
  },
  briefing_end_secret_armory: {
    id: 'briefing_end_secret_armory',
    title: 'Секретный арсенал',
    description: 'Хольц доверил отряду доступ к секретным артефактам.',
    flags: ['access_secret_armory', 'fully_briefed', 'holz_trusts'],
    bonuses: { xp: 40, reputation: { fjr: 30 } },
  },
  briefing_end_defector_jailed: {
    id: 'briefing_end_defector_jailed',
    title: 'Пленница',
    description: 'Перебежчица заключена под стражу.',
    flags: ['defector_jailed'],
    bonuses: { xp: 10, reputation: { fjr: 10, synthesis: -5 } },
  },
  briefing_end_rescue_mission: {
    id: 'briefing_end_rescue_mission',
    title: 'Миссия спасения',
    description: 'Миссия расширена: спасти пленников FJR из Библиотеки.',
    flags: ['rescue_mission_accepted', 'defector_ally', 'holz_grateful'],
    bonuses: { xp: 50, reputation: { fjr: 40 } },
  },
  briefing_end_pragmatic: {
    id: 'briefing_end_pragmatic',
    title: 'Прагматичный подход',
    description: 'Основная цель — данные. Пленники — вторично.',
    flags: ['pragmatic_approach', 'defector_ally'],
    bonuses: { xp: 35, reputation: { fjr: 20 } },
  },
  briefing_end_tactical_intel: {
    id: 'briefing_end_tactical_intel',
    title: 'Тактическая разведка',
    description: 'Получены детальные данные о точках входа и патрулях.',
    flags: ['has_tactical_intel', 'defector_ally', 'fully_briefed'],
    bonuses: { xp: 35, reputation: { fjr: 25 } },
  },
} as const

export type BriefingEndingId = keyof typeof briefingEndings

/**
 * Получить концовку по ID
 */
export function getBriefingEnding(endingId: BriefingEndingId) {
  return briefingEndings[endingId]
}

/**
 * Получить диалог по ID
 */
export function getDialogueById(dialogueId: string): PolyphonicDialogue | undefined {
  return dialogues.find((d) => d.id === dialogueId)
}

/**
 * Получить все инъекции для сцены
 */
export function getAllSceneInjections(): PrivateInjection[] {
  return dialogues.flatMap((d) => d.privateInjections)
}

/**
 * Получить инъекции для конкретного диалога
 */
export function getDialogueInjections(dialogueId: string): PrivateInjection[] {
  const dialogue = getDialogueById(dialogueId)
  return dialogue?.privateInjections ?? []
}
