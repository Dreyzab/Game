import type { Scene } from '../../../model/types'

/**
 * Сценарии для фракции Артисаны
 * 
 * Ключевые NPC: Мастер Дитер, Рико-подрывник
 * Квесты: artisans_introduction, workshop_helper
 * Локация: Промзона Артисанов (Инненштадт Ост)
 */

const WORKSHOP_BACKGROUND = '/images/backgrounds/workshop.jpg'
const INDUSTRIAL_BACKGROUND = '/images/backgrounds/industrial_zone.jpg'
const DIETER_SPRITE = '/images/npcs/dieter.jpg'
const RICO_SPRITE = '/images/npcs/rico.jpg'

export const artisansScenes: Record<string, Scene> = {
  // =====================================
  // ПЕРВОЕ ПРИБЫТИЕ В ПРОМЗОНУ
  // =====================================

  artisan_zone_arrival: {
    id: 'artisan_zone_arrival',
    background: INDUSTRIAL_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Промзона Артисанов. Здесь пахнет маслом, горелым металлом и потом. Звон молотов, шипение сварки, гудение генераторов — симфония труда.',
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Гибридные технологии. Они комбинируют старое и новое. Видишь тот генератор? Паровой двигатель с электронным управлением. Гениально.',
        emotion: { primary: 'excited', intensity: 80 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Рабочие не обращают на вас внимания — каждый занят своим делом. Но несколько охранников провожают вас взглядами.',
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: '(Шёпот) Они следят... оценивают... ждут ошибки...',
        emotion: { primary: 'worried', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'find_workshop',
        text: 'Найти мастерскую Дитера.',
        nextScene: 'dieter_workshop_approach',
      },
      {
        id: 'check_bulletin',
        text: 'Посмотреть доску объявлений.',
        nextScene: 'artisan_bulletin_board',
      },
      {
        id: 'explore_zone',
        text: 'Осмотреться по сторонам.',
        nextScene: 'artisan_zone_exploration',
      },
    ],
  },

  artisan_zone_exploration: {
    id: 'artisan_zone_exploration',
    background: INDUSTRIAL_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Промзона — лабиринт из цехов, складов и кузниц. Повсюду — люди в рабочей одежде, испачканной сажей и маслом.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Интересно. Нет бездельников. Каждый либо работает, либо учится. У Артисанов ценят только одно — труд.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'В дальнем углу замечаете вывеску: "Мастерская Опора — Дитер Хофманн". Рядом — доска объявлений, увешанная записками.',
      },
    ],
    choices: [
      {
        id: 'go_to_dieter',
        text: 'Направиться к мастерской Дитера.',
        nextScene: 'dieter_workshop_approach',
      },
      {
        id: 'check_board',
        text: 'Изучить доску объявлений.',
        nextScene: 'artisan_bulletin_board',
      },
    ],
  },

  // =====================================
  // ДОСКА ОБЪЯВЛЕНИЙ АРТИСАНОВ
  // =====================================

  artisan_bulletin_board: {
    id: 'artisan_bulletin_board',
    background: INDUSTRIAL_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Доска объявлений Артисанов. Потрёпанные листки, написанные от руки или напечатанные на старых принтерах.',
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Здесь размещают заказы на ремонт, закупку материалов и наём помощников. Экономика Артисанов — бартер и услуги.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Несколько объявлений привлекают внимание...',
      },
    ],
    choices: [
      {
        id: 'read_repair_job',
        text: '[ЗАКАЗ] "Требуется помощь с ремонтом генератора — 20 кредитов"',
        nextScene: 'board_repair_job',
      },
      {
        id: 'read_material_job',
        text: '[ЗАКАЗ] "Нужны детали от старых дронов — оплата по договорённости"',
        nextScene: 'board_material_job',
      },
      {
        id: 'read_apprentice_notice',
        text: '[ОБЪЯВЛЕНИЕ] "Мастерская Опора набирает учеников"',
        nextScene: 'board_apprentice_notice',
      },
      {
        id: 'leave_board',
        text: 'Отойти от доски.',
        nextScene: 'artisan_zone_arrival',
      },
    ],
  },

  board_repair_job: {
    id: 'board_repair_job',
    background: INDUSTRIAL_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: '"Требуется помощь с ремонтом генератора в секторе 4. Нужен кто-то с техническими навыками или хотя бы крепкими руками. Оплата — 20 кредитов. Обращаться к Францу в кузню."',
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '(Заинтересованно) Генератор... Это может быть любопытно. И полезно для репутации.',
        emotion: { primary: 'excited', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'take_job',
        text: 'Запомнить заказ.',
        nextScene: 'artisan_bulletin_board',
        effects: {
          flags: [{ key: 'know_repair_job', value: true }],
        },
      },
      {
        id: 'back',
        text: 'Посмотреть другие объявления.',
        nextScene: 'artisan_bulletin_board',
      },
    ],
  },

  board_material_job: {
    id: 'board_material_job',
    background: INDUSTRIAL_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: '"Срочно нужны детали от старых дронов: сервоприводы, камеры, аккумуляторы. Оплата зависит от состояния и количества. Обращаться к Рико в Цех 4."',
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Рико. Это имя упоминал Дитер. Подрывник. Интересно, зачем ему части дронов.',
        emotion: { primary: 'curious', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'remember_rico',
        text: 'Запомнить информацию о Рико.',
        nextScene: 'artisan_bulletin_board',
        effects: {
          flags: [{ key: 'know_rico_job', value: true }],
        },
      },
      {
        id: 'back',
        text: 'Посмотреть другие объявления.',
        nextScene: 'artisan_bulletin_board',
      },
    ],
  },

  board_apprentice_notice: {
    id: 'board_apprentice_notice',
    background: INDUSTRIAL_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: '"Мастерская Опора набирает учеников. Требования: трудолюбие, готовность учиться, отсутствие связей с FJR. Обращаться к мастеру Дитеру."',
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Традиционная система мастер-ученик. Артисаны передают знания напрямую, без формального образования.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'consider_apprenticeship',
        text: 'Подумать об ученичестве.',
        nextScene: 'artisan_bulletin_board',
        effects: {
          flags: [{ key: 'consider_artisan_apprentice', value: true }],
        },
      },
      {
        id: 'back',
        text: 'Посмотреть другие объявления.',
        nextScene: 'artisan_bulletin_board',
      },
    ],
  },

  // =====================================
  // МАСТЕРСКАЯ ДИТЕРА
  // =====================================

  dieter_workshop_approach: {
    id: 'dieter_workshop_approach',
    background: WORKSHOP_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Мастерская "Опора". Большое помещение с высоким потолком, заваленное деталями, инструментами и незаконченными проектами.',
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Рай для механика. Старые двигатели, электроника, гидравлика... Здесь можно собрать что угодно.',
        emotion: { primary: 'excited', intensity: 85 },
      },
      {
        speaker: 'Рассказчик',
        text: 'За верстаком работает крепкий мужчина лет пятидесяти. Руки в мозолях, лицо сосредоточенное.',
      },
    ],
    choices: [
      {
        id: 'approach_dieter',
        text: 'Подойти к Дитеру.',
        nextScene: 'dieter_first_meeting',
      },
      {
        id: 'observe_first',
        text: 'Сначала понаблюдать.',
        nextScene: 'dieter_observation',
      },
    ],
  },

  dieter_observation: {
    id: 'dieter_observation',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы наблюдаете, как Дитер работает. Его движения точны и экономны. Каждый жест — результат многолетней практики.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Он чинит какой-то сложный механизм. Кажется, это часть протеза. Работа тонкая, требует огромного мастерства.',
        emotion: { primary: 'neutral', intensity: 75 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Не поднимая головы) Если собираешься стоять и пялиться — возьми хотя бы метлу. Пыль не подметалась неделю.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'take_broom',
        text: 'Взять метлу и начать подметать.',
        nextScene: 'dieter_impressed',
        effects: {
          flags: [{ key: 'helped_dieter_clean', value: true }],
        },
      },
      {
        id: 'introduce_self',
        text: 'Представиться.',
        nextScene: 'dieter_first_meeting',
      },
    ],
  },

  dieter_impressed: {
    id: 'dieter_impressed',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы берёте метлу и начинаете подметать. Работа простая, но делаете её добросовестно.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Поднимает голову, в глазах — лёгкое удивление) Хм. Без споров, без вопросов. Просто взял и сделал.',
        emotion: { primary: 'surprised', intensity: 55 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Не часто такое встретишь. Большинство новичков начинают торговаться или жаловаться. Как тебя зовут?',
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    nextScene: 'dieter_introduction_good',
  },

  dieter_first_meeting: {
    id: 'dieter_first_meeting',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Откладывает инструмент, вытирает руки тряпкой) Так. Чего тебе?',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'mention_hans',
        text: '"Я от Ганса. Принёс запчасти."',
        nextScene: 'dieter_hans_mention',
        availability: {
          condition: { flag: 'has_dieter_parts' },
        },
      },
      {
        id: 'introduce_plain',
        text: 'Просто представиться.',
        nextScene: 'dieter_plain_introduction',
      },
      {
        id: 'ask_about_work',
        text: '"Я ищу работу."',
        nextScene: 'dieter_work_inquiry',
      },
    ],
  },

  dieter_hans_mention: {
    id: 'dieter_hans_mention',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        id: 'rico',
        name: 'Рико',
        position: 'right',
        sprite: RICO_SPRITE,
        emotion: { primary: 'happy', intensity: 75 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Мастерская «Опора» — огромный ангар с распахнутыми воротами. Внутри гудит сварка, летят искры. Ты входишь с ящиком, и в глубине цеха видишь две фигуры у разобранного генератора.',
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Опа! Кого я вижу! Живой! А я думал, тебя Густав на запчасти разобрал.',
        emotion: { primary: 'happy', intensity: 80 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Поднимает очки на лоб) Вы знакомы?',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Это тот самый парень с поезда! Тот, что не зассал, когда твари попёрли.',
        emotion: { primary: 'happy', intensity: 75 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Хмыкает) Вот как? Полезное качество.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты ставишь ящик на верстак. Дитер быстро проверяет содержимое.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Всё на месте. Отлично.',
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        speaker: 'Вы',
        condition: { flag: 'heard_flens_payment_warning' },
        text: 'Элиас просил передать: Фленс недоволен задержкой оплаты.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        condition: { flag: 'heard_flens_payment_warning' },
        text: '(Мрачно) Фленс всегда недоволен. Передай ему: пусть не забывает, кто держит город на ходу.',
        emotion: { primary: 'angry', intensity: 55 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Достаёт кошелёк) Держи. Заслужил. Тридцать кредитов.',
        emotion: { primary: 'happy', intensity: 55 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        emotion: { primary: 'serious', intensity: 70 },
        text: 'И раз уж вы с Рико друг друга знаете, и он тебя хвалит... есть у меня к тебе разговор. Дело посложнее, чем коробки таскать.',
      },
    ],
    choices: [
      {
        id: 'confirm_delivery_to_dieter',
        text: 'Поставить ящик на верстак.',
        nextScene: 'dieter_schlossberg_offer',
        effects: {
          addFlags: ['met_dieter', 'met_rico', 'completed_dieter_delivery', 'delivered_parts_to_dieter'],
          removeFlags: ['has_dieter_parts', 'chance_for_newbie_active'],
          xp: 15,
        },
      },
    ],
  },

  dieter_schlossberg_offer: {
    id: 'dieter_schlossberg_offer',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        id: 'rico',
        name: 'Рико',
        position: 'right',
        sprite: RICO_SPRITE,
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Там, на горе, у подножия старого замка, есть мой схрон. Старая смотровая площадка. Я оставил там... кое-какие кристаллы. Нужно их забрать.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: '(Перестает улыбаться) Старик, ты же не хочешь его на Шлосберг послать?',
        emotion: { primary: 'worried', intensity: 65 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Цыц. Не пугай парня.',
        emotion: { primary: 'angry', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'schlossberg_danger',
        text: '"На гору? Я слышал, там опасно. И проход закрыт."',
        nextScene: 'dieter_schlossberg_danger',
      },
      {
        id: 'schlossberg_pay',
        text: '"Сколько платишь?"',
        nextScene: 'dieter_schlossberg_payment',
      },
      {
        id: 'schlossberg_why_rico',
        text: '"Почему ты не пошлёшь Рико?"',
        nextScene: 'dieter_schlossberg_why_not_rico',
      },
      {
        id: 'schlossberg_decline',
        text: '"Мне нужно подумать. Я зайду позже."',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [{ type: 'open_map' }],
          addFlags: ['declined_schlossberg_job'],
        },
      },
    ],
  },

  dieter_schlossberg_danger: {
    id: 'dieter_schlossberg_danger',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        id: 'rico',
        name: 'Рико',
        position: 'right',
        sprite: RICO_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Опасно — да. Но пройти можно. На выходе к горе, на КПП у ворот Швабентор, тебе выдадут временное разрешение. Скажешь, что работаешь на Артисанов по спецзаказу.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: '(Криво улыбается) «Временное разрешение» — звучит как «временная жизнь».',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      { id: 'danger_back', text: 'Вернуться к разговору.', nextScene: 'dieter_schlossberg_offer' },
      { id: 'danger_accept', text: '"Ладно. По рукам."', nextScene: 'dieter_schlossberg_payment' },
    ],
  },

  dieter_schlossberg_why_not_rico: {
    id: 'dieter_schlossberg_why_not_rico',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        id: 'rico',
        name: 'Рико',
        position: 'right',
        sprite: RICO_SPRITE,
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Эй, я занятой человек! У меня тут генераторы, взрывы, искусство…',
        emotion: { primary: 'happy', intensity: 70 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Рико нужен здесь. А тебе — нужно доказать, что на тебя можно положиться.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      { id: 'why_back', text: 'Вернуться к разговору.', nextScene: 'dieter_schlossberg_offer' },
      { id: 'why_accept', text: '"Хорошо. Сколько платишь?"', nextScene: 'dieter_schlossberg_payment' },
    ],
  },

  dieter_schlossberg_payment: {
    id: 'dieter_schlossberg_payment',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        id: 'rico',
        name: 'Рико',
        position: 'right',
        sprite: RICO_SPRITE,
        emotion: { primary: 'excited', intensity: 75 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Морщится) Полтинник накину, не больше. Времена тяжёлые. Но могу предложить кое-что получше.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Он достаёт из-под верстака пистолет. Старый, потёртый, но ухоженный. Ствол удлинён, рукоять обмотана кожей.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Модифицированный «Шершень». И главное — я посодействую с разрешением. В этом городе пушка с бумажкой стоит дороже золота.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Неплохое предложение, брат. С такой игрушкой и по ночам гулять не страшно.',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'pay_accept',
        text: '"По рукам. Где этот схрон?"',
        nextScene: 'dieter_schlossberg_instructions',
      },
      {
        id: 'pay_turn_back',
        text: '"Ладно. Но если там будет жарко — я разворачиваюсь."',
        nextScene: 'dieter_schlossberg_instructions',
        effects: { addFlags: ['will_turn_back_if_hot'] },
      },
      {
        id: 'pay_think',
        text: '"Мне нужно подумать. Я зайду позже."',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['declined_schlossberg_job'],
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },

  dieter_schlossberg_instructions: {
    id: 'dieter_schlossberg_instructions',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        id: 'rico',
        name: 'Рико',
        position: 'right',
        sprite: RICO_SPRITE,
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Идёшь к воротам Швабентор. Там покажешь мою записку — это для Шмидта, начальника караула. Он пропустит.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Дальше по старой туристической тропе. Не сворачивай в лес. Дойдёшь до смотровой площадки — под старой скамьёй тайник. Код: 4-5-1. Заберёшь контейнер и пулей назад.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Если выживешь на горе — загляни ко мне потом. Я в подвале «Цех 4». Может, подгоню тебе пару гранат. На всякий пожарный.',
        emotion: { primary: 'happy', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'КВЕСТ ОБНОВЛЁН: «Шёпот Разлома». Цель: добраться до ворот Швабентор.',
      },
    ],
    choices: [
      {
        id: 'head_to_schwabentor',
        text: 'Кивнуть и выйти из мастерской.',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: [
            'whispers_quest_active',
            'need_visit_schwabentor',
            'need_talk_to_rico',
            'rico_hideout_marker',
            'talked_schlossberg_with_dieter',
          ],
          immediate: [{ type: 'open_map' }],
          xp: 10,
        },
      },
    ],
  },

  dieter_introduction_good: {
    id: 'dieter_introduction_good',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы представляетесь. Дитер кивает, запоминая.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Я — Дитер Хофманн. Мастер этой мастерской. Работаю здесь уже двадцать лет. Ещё до... всего этого.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Хофманн. Известная фамилия среди Артисанов. Его дед основал эту мастерскую.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Ты новенький, я вижу. В городе ориентируешься ещё плохо. Но Ганс умеет выбирать людей. Значит, и в тебе что-то есть.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'ask_about_artisans',
        text: '"Расскажите об Артисанах."',
        nextScene: 'dieter_artisans_info',
      },
      {
        id: 'ask_about_work',
        text: '"Можно ли здесь найти работу?"',
        nextScene: 'dieter_work_offer',
      },
      {
        id: 'ask_about_schlossberg',
        text: '"Что вы знаете о Шлосберге?"',
        nextScene: 'dieter_schlossberg_info',
      },
      {
        id: 'thank_and_leave',
        text: '"Благодарю. Мне пора."',
        nextScene: 'dieter_farewell',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'chance_for_a_newbie', action: 'complete' } },
            { type: 'reputation', data: { faction: 'artisans', delta: 10 } },
          ],
          flags: [{ key: 'met_dieter', value: true }],
          xp: 15,
        },
      },
    ],
  },

  dieter_plain_introduction: {
    id: 'dieter_plain_introduction',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы представляетесь. Дитер слушает без особого интереса.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Ага. Ну и что тебе нужно? Я занятый человек.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'ask_for_work',
        text: '"Я ищу работу."',
        nextScene: 'dieter_work_inquiry',
      },
      {
        id: 'apologize_leave',
        text: '"Извините за беспокойство."',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'met_dieter', value: true }],
        },
      },
    ],
  },

  dieter_work_inquiry: {
    id: 'dieter_work_inquiry',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Оценивающе смотрит) Работу? Много народу ищет работу. Мало кто умеет работать.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Что умеешь? Руками работать? С техникой? Или только языком молоть?',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'claim_technical',
        text: '"Разбираюсь в технике."',
        nextScene: 'dieter_technical_test',
      },
      {
        id: 'claim_anything',
        text: '"Готов делать что угодно."',
        nextScene: 'dieter_simple_work',
      },
      {
        id: 'be_honest',
        text: '"Я новичок. Но я учусь быстро."',
        nextScene: 'dieter_honest_response',
      },
    ],
  },

  dieter_technical_test: {
    id: 'dieter_technical_test',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Усмехается) Разбираешься? Ну давай проверим.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Он указывает на сломанный механизм на столе.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Это регулятор давления от парового двигателя. Скажи, что с ним не так.',
        emotion: { primary: 'determined', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'technical_check',
        text: '[ЗНАНИЯ] Осмотреть и диагностировать.',
        presentation: {
          color: 'skilled',
          icon: '⚙️',
          tooltip: 'Требуются ЗНАНИЯ',
        },
        availability: {
          skillCheck: {
            skill: 'knowledge',
            difficulty: 9,
            successText: 'Вы видите проблему сразу.',
            failureText: 'Механизм слишком сложен для вас.',
          },
        },
        effects: {
          onSuccess: { nextScene: 'dieter_test_passed' },
          onFailure: { nextScene: 'dieter_test_failed' },
        },
      },
      {
        id: 'admit_ignorance',
        text: '"Признаю, это слишком сложно для меня."',
        nextScene: 'dieter_honest_response',
      },
    ],
  },

  dieter_test_passed: {
    id: 'dieter_test_passed',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Вы',
        text: 'Прокладка клапана изношена. И... да, вот здесь — трещина в корпусе. Из-за неё давление стравливается.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Брови взлетают вверх) Ха! Неплохо, совсем неплохо. Ты первый за месяц, кто это увидел.',
        emotion: { primary: 'happy', intensity: 75 },
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ] Мастер впечатлён. Это открывает двери.',
        emotion: { primary: 'excited', intensity: 80 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Ладно. Может, из тебя будет толк. Заходи завтра — найдётся работа.',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'thank_dieter',
        text: 'Поблагодарить.',
        nextScene: 'dieter_farewell',
        effects: {
          immediate: [
            { type: 'reputation', data: { faction: 'artisans', delta: 15 } },
          ],
          flags: [
            { key: 'met_dieter', value: true },
            { key: 'impressed_dieter', value: true },
            { key: 'artisan_work_available', value: true },
          ],
          xp: 20,
        },
      },
    ],
  },

  dieter_test_failed: {
    id: 'dieter_test_failed',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'sad', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы осматриваете механизм, но... это слишком сложно. Вы не можете определить проблему.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Вздыхает) Как я и думал. "Разбираюсь в технике"... Прокладка клапана и трещина в корпусе. Базовые вещи.',
        emotion: { primary: 'sad', intensity: 55 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Не расстраивайся. Это можно выучить. Если есть желание — заходи. Начнёшь с простого.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    nextScene: 'dieter_simple_work',
  },

  dieter_honest_response: {
    id: 'dieter_honest_response',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Удивлённо) Честность? Редкое качество. Большинство врут, чтобы получить работу.',
        emotion: { primary: 'happy', intensity: 55 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Ладно, новичок. Если готов учиться и не боишься грязной работы — найдётся дело.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    nextScene: 'dieter_simple_work',
  },

  dieter_simple_work: {
    id: 'dieter_simple_work',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Начнёшь с подсобной работы. Таскать детали, чистить инструменты, подметать. Плачу 5 кредитов в день.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Покажешь себя — дам что-то посерьёзнее. Не покажешь — дорога на выход.',
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'accept_work',
        text: 'Согласиться на работу.',
        nextScene: 'dieter_farewell',
        effects: {
          flags: [
            { key: 'met_dieter', value: true },
            { key: 'artisan_work_available', value: true },
          ],
        },
      },
      {
        id: 'think_about_it',
        text: '"Я подумаю."',
        nextScene: 'dieter_farewell',
        effects: {
          flags: [{ key: 'met_dieter', value: true }],
        },
      },
    ],
  },

  dieter_work_offer: {
    id: 'dieter_work_offer',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Работа? Всегда есть. Вопрос — на что ты годишься.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Могу дать простую подсобную работу. Или, если покажешь навыки — что-то интереснее.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    nextScene: 'dieter_work_inquiry',
  },

  dieter_artisans_info: {
    id: 'dieter_artisans_info',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Артисаны — это мы. Те, кто строит и чинит. Без нас город развалится.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'FJR охраняют стены, Синтез мутят свои эксперименты, а мы — держим всё работающим. Генераторы, водопровод, транспорт — всё наше.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Артисаны — техническая основа Фрайбурга. Их влияние незаметно, но критично.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'У нас нет лидеров. Есть мастера. Каждый мастер — свой цех, свои ученики. Решения принимаем вместе на совете.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'back_to_talk',
        text: 'Продолжить разговор.',
        nextScene: 'dieter_introduction_good',
      },
    ],
  },

  dieter_schlossberg_info: {
    id: 'dieter_schlossberg_info',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'worried', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Его лицо меняется) Шлосберг... Ты туда не суйся.',
        emotion: { primary: 'worried', intensity: 75 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'После катастрофы там... что-то изменилось. Странные звуки, свечение по ночам. Люди пропадают.',
        emotion: { primary: 'worried', intensity: 70 },
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: '(Напряжённо) Он боится. Настоящий страх. Это не сказки.',
        emotion: { primary: 'worried', intensity: 80 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Но... (Тише) ...там могут быть редкие материалы. Артефакты. Если найдёшь что-то ценное — я куплю. Хорошо заплачу.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'ask_more_schlossberg',
        text: '"Какие именно материалы?"',
        nextScene: 'dieter_schlossberg_details',
      },
      {
        id: 'back_to_talk',
        text: 'Сменить тему.',
        nextScene: 'dieter_introduction_good',
      },
    ],
  },

  dieter_schlossberg_details: {
    id: 'dieter_schlossberg_details',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Кристаллы. Особые. Говорят, они хранят энергию. Не электричество — что-то другое.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Синтез платит за них бешеные деньги. Я бы хотел изучить их сам... но нужны образцы.',
        emotion: { primary: 'determined', intensity: 65 },
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Аномальные кристаллы. Потенциально революционный источник энергии. Опасно, но... заманчиво.',
        emotion: { primary: 'excited', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'offer_to_help',
        text: '"Я могу попробовать достать образцы."',
        nextScene: 'dieter_schlossberg_quest',
        effects: {
          flags: [{ key: 'schlossberg_job_known', value: true }],
        },
      },
      {
        id: 'decline',
        text: '"Это слишком опасно."',
        nextScene: 'dieter_introduction_good',
      },
    ],
  },

  dieter_schlossberg_quest: {
    id: 'dieter_schlossberg_quest',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'worried', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Задумчиво) Попробовать... Ладно. Но не сейчас. Тебе нужна подготовка. Снаряжение.',
        emotion: { primary: 'worried', intensity: 60 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Поговори с Рико — он в Цехе 4. Он знает, как работать в опасных зонах. Скажи, что от меня.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'accept',
        text: 'Запомнить информацию.',
        nextScene: 'dieter_farewell',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'whispers_of_rift', action: 'start' } },
          ],
          flags: [
            { key: 'whispers_quest_active', value: true },
            { key: 'need_talk_to_rico', value: true },
          ],
          narrative: 'Цех 4 Рико отмечен на карте.',
        },
      },
    ],
  },

  dieter_farewell: {
    id: 'dieter_farewell',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Ладно. Иди. И если что — заходи. Мастерская работает с рассвета до заката.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  // =====================================
  // РИКО - ПОДРЫВНИК
  // =====================================

  rico_hideout_approach: {
    id: 'rico_hideout_approach',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Цех 4. Дверь украшена предупреждающими знаками: "Не курить", "Взрывоопасно", "Стучать громко — бомба может не услышать".',
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'БОМБА?! Мы войдём в место с БОМБАМИ?!',
        emotion: { primary: 'worried', intensity: 90 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '(Спокойно) Это шутка. Надпись нанесена краской от руки. Характерный юмор сапёров.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'knock',
        text: 'Постучать.',
        nextScene: 'rico_door_response',
      },
      {
        id: 'leave',
        text: 'Уйти. Это плохая идея.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  rico_door_response: {
    id: 'rico_door_response',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рико',
        text: '(Из-за двери, глухо) КТО ТАМ?! Если FJR — предупреждаю, дверь заминирована!',
      },
      {
        speaker: 'ЛОГИКА',
        text: '(Сомневаясь) Скорее всего — блеф. Но... может и нет.',
        emotion: { primary: 'worried', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'mention_dieter',
        text: '"Я от Дитера!"',
        nextScene: 'rico_lets_in',
        availability: {
          condition: { flag: 'need_talk_to_rico' },
        },
      },
      {
        id: 'introduce_calm',
        text: '"Я просто путник. Ищу работу."',
        nextScene: 'rico_suspicious',
      },
      {
        id: 'leave_scared',
        text: 'Медленно отойти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  rico_lets_in: {
    id: 'rico_lets_in',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Дверь открывается. За ней — невысокий человек с безумными глазами и руками, испачканными чем-то чёрным.',
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'От Дитера? А, тогда заходи! Только ничего не трогай. Особенно красные провода. И зелёные. И вообще никакие.',
        emotion: { primary: 'happy', intensity: 70 },
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Этот человек — гений. Или сумасшедший. Возможно, и то, и другое.',
        emotion: { primary: 'excited', intensity: 75 },
      },
    ],
    nextScene: 'rico_introduction',
  },

  rico_suspicious: {
    id: 'rico_suspicious',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'worried', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Дверь приоткрывается. В щели появляется настороженный глаз.',
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Путник? Работу? А почему именно ко мне? Кто тебя прислал?',
        emotion: { primary: 'worried', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'mention_board',
        text: '"Видел объявление на доске."',
        nextScene: 'rico_board_mention',
        availability: {
          condition: { flag: 'know_rico_job' },
        },
      },
      {
        id: 'be_honest',
        text: '"Просто исследую город."',
        nextScene: 'rico_reluctant_entry',
      },
    ],
  },

  rico_board_mention: {
    id: 'rico_board_mention',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'А, доска... Да, я искал детали от дронов. (Открывает дверь шире) Заходи. Но ничего не трогай.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    nextScene: 'rico_introduction',
  },

  rico_reluctant_entry: {
    id: 'rico_reluctant_entry',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: '(Долгая пауза) Ладно. Заходи. Но если ты шпион FJR — я успею нажать кнопку раньше, чем ты успеешь крикнуть.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'Какую кнопку?! КАКУЮ КНОПКУ?!',
        emotion: { primary: 'worried', intensity: 85 },
      },
    ],
    nextScene: 'rico_introduction',
  },

  rico_introduction: {
    id: 'rico_introduction',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Цех Рико — хаос из проводов, механизмов и... взрывчатки. Много взрывчатки. Везде.',
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Я Рико. Энрике, если формально, но все зовут Рико. Я... специалист по энергичным решениям.',
        emotion: { primary: 'happy', intensity: 65 },
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] "Энергичные решения" — эвфемизм для взрывов. Рико — подрывник. Один из лучших в городе.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Так что тебе нужно? Дитер что-то хочет взорвать? Или кого-то? (Хихикает) Шучу. Он не такой. К сожалению.',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'ask_about_schlossberg',
        text: '"Дитер сказал, ты знаешь про Шлосберг."',
        nextScene: 'rico_schlossberg_talk',
        availability: {
          condition: { flag: 'whispers_quest_active' },
        },
      },
      {
        id: 'ask_about_work',
        text: '"Есть ли у тебя работа?"',
        nextScene: 'rico_job_offer',
      },
      {
        id: 'ask_about_explosives',
        text: '"Ты правда делаешь бомбы?"',
        nextScene: 'rico_explosives_talk',
      },
    ],
  },

  rico_schlossberg_talk: {
    id: 'rico_schlossberg_talk',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'worried', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: '(Улыбка исчезает) Шлосберг? Дитер хочет, чтобы ты туда полез?',
        emotion: { primary: 'worried', intensity: 70 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Я был там. Один раз. Чуть не остался там навсегда.',
        emotion: { primary: 'worried', intensity: 65 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: '(Серьёзно) Слушай. Там... что-то есть. Не знаю что. Но оно реагирует на звук. На движение. На... страх, кажется.',
        emotion: { primary: 'worried', intensity: 70 },
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'РЕАГИРУЕТ НА СТРАХ. ОТЛИЧНО. МЫ ВСЕ УМРЁМ.',
        emotion: { primary: 'worried', intensity: 95 },
      },
    ],
    choices: [
      {
        id: 'ask_for_help',
        text: '"Можешь помочь подготовиться?"',
        nextScene: 'rico_preparation_offer',
      },
      {
        id: 'ask_what_happened',
        text: '"Что случилось, когда ты был там?"',
        nextScene: 'rico_schlossberg_story',
      },
    ],
  },

  rico_schlossberg_story: {
    id: 'rico_schlossberg_story',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'sad', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: '(Садится, вздыхает) Нас было трое. Хотели найти кристаллы. Лёгкие деньги, думали.',
        emotion: { primary: 'sad', intensity: 65 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Марко... он просто исчез. Буквально. Был — и нет. Никакого звука, ничего.',
        emotion: { primary: 'sad', intensity: 70 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Герт... он начал... смеяться. И не мог остановиться. Я его тащил на себе. Он до сих пор в медцентре. Не говорит.',
        emotion: { primary: 'sad', intensity: 75 },
      },
      {
        speaker: 'ИНТУИЦИЯ',
        text: '(Шёпот) ...он не лжёт... он всё ещё там, в тех воспоминаниях...',
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'still_want_go',
        text: '"Я всё равно пойду. Поможешь?"',
        nextScene: 'rico_preparation_offer',
      },
      {
        id: 'reconsider',
        text: '"Может, это плохая идея..."',
        nextScene: 'rico_farewell',
      },
    ],
  },

  rico_preparation_offer: {
    id: 'rico_preparation_offer',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: '(Долго смотрит на вас) Ты либо храбрый, либо идиот. Может, и то, и другое.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Ладно. Я дам тебе кое-что. Светошумовые гранаты. Там, наверху, они реагируют на внезапные вспышки. Даёт секунд пять, чтобы убежать.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'И ещё — надень что-нибудь тёмное. Без блестящих элементов. И не... не думай о плохом. Серьёзно.',
        emotion: { primary: 'worried', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'take_grenades',
        text: 'Принять гранаты и советы.',
        nextScene: 'rico_farewell_equipped',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'flashbang_grenade', amount: 3 } },
            { type: 'quest', data: { questId: 'whispers_of_rift', action: 'updateStep', stepId: 'go_to_schlossberg' } },
          ],
          flags: [
            { key: 'has_flashbangs', value: true },
            { key: 'rico_warned_about_schlossberg', value: true },
          ],
        },
      },
    ],
  },

  rico_farewell_equipped: {
    id: 'rico_farewell_equipped',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'worried', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Удачи. И... если найдёшь что-то интересное там — тащи сюда. Я хорошо заплачу.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'А если не вернёшься... ну, было приятно познакомиться.',
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'met_rico', value: true }],
        },
      },
    ],
  },

  rico_job_offer: {
    id: 'rico_job_offer',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Работа? Хм... Мне нужны детали от дронов. Сервоприводы, камеры, аккумуляторы.',
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Дроны можно найти на свалке за городом. Или... (Хитро улыбается) ...у FJR. Но это уже твой выбор.',
        emotion: { primary: 'happy', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'accept_drone_job',
        text: '"Я поищу детали."',
        nextScene: 'rico_farewell',
        effects: {
          flags: [
            { key: 'rico_drone_job_accepted', value: true },
            { key: 'met_rico', value: true },
          ],
        },
      },
      {
        id: 'ask_about_fjr_drones',
        text: '"Дроны FJR?"',
        nextScene: 'rico_fjr_drones_info',
      },
    ],
  },

  rico_fjr_drones_info: {
    id: 'rico_fjr_drones_info',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: '(Подмигивает) FJR использует дроны для патрулирования. Иногда они... падают. Случайно. От помех.',
        emotion: { primary: 'happy', intensity: 75 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Если ты умеешь создавать помехи — можешь заработать. Но я тебе этого не говорил.',
        emotion: { primary: 'happy', intensity: 70 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Он предлагает саботаж оборудования FJR. Опасно, но потенциально прибыльно.',
        emotion: { primary: 'determined', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'accept',
        text: '"Понял. Я подумаю."',
        nextScene: 'rico_farewell',
        effects: {
          flags: [
            { key: 'know_rico_fjr_sabotage', value: true },
            { key: 'met_rico', value: true },
          ],
        },
      },
    ],
  },

  rico_explosives_talk: {
    id: 'rico_explosives_talk',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'excited', intensity: 80 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: '(Глаза загораются) Бомбы? Я предпочитаю термин "устройства контролируемой деструкции".',
        emotion: { primary: 'excited', intensity: 85 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Но да. Гранаты, мины, детонаторы. Всё, что идёт БУМ — моя специальность.',
        emotion: { primary: 'excited', intensity: 80 },
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'Этот человек ЛЮБИТ взрывы. Мы должны УЙТИ. СЕЙЧАС.',
        emotion: { primary: 'worried', intensity: 90 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Хочешь что-то купить? У меня есть... кое-что в наличии.',
        emotion: { primary: 'happy', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'see_inventory',
        text: '"Покажи, что есть."',
        nextScene: 'rico_shop',
      },
      {
        id: 'decline_politely',
        text: '"Может, в другой раз."',
        nextScene: 'rico_introduction',
      },
    ],
  },

  rico_shop: {
    id: 'rico_shop',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Так... Гранаты — 20 кредитов штука. Мины — 50. Детонаторы — 15.',
        emotion: { primary: 'happy', intensity: 70 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'И есть... (Понижает голос) ...особые штуки. Но это только для проверенных клиентов.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'buy_grenades',
        text: 'Купить гранату (20 кредитов).',
        nextScene: 'rico_purchase_grenade',
        availability: {
          condition: { currency: 20 },
        },
        effects: {
          immediate: [
            { type: 'currency', data: { amount: -20 } },
            { type: 'item', data: { itemId: 'frag_grenade', amount: 1 } },
          ],
        },
      },
      {
        id: 'back',
        text: 'Вернуться к разговору.',
        nextScene: 'rico_introduction',
      },
    ],
  },

  rico_purchase_grenade: {
    id: 'rico_purchase_grenade',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: '(Передаёт гранату) Держи. Чека — красная. Дёргаешь, бросаешь, закрываешь уши. Просто, да?',
        emotion: { primary: 'happy', intensity: 75 },
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'И... не бросай её рядом со мной. Я и так слишком много слышу звон в ушах.',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    nextScene: 'rico_shop',
  },

  rico_farewell: {
    id: 'rico_farewell',
    background: '/images/backgrounds/rico_workshop.jpg',
    characters: [
      {
        id: 'rico',
        name: 'Рико',
        position: 'center',
        sprite: RICO_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Ладно. Заходи, если что. Только стучи громко — я иногда в наушниках.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'met_rico', value: true }],
        },
      },
    ],
  },

  // =====================================
  // ШЛОСБЕРГ — ВОЗВРАТ С КРИСТАЛЛОМ
  // =====================================

  dieter_schlossberg_return: {
    id: 'dieter_schlossberg_return',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'serious', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Мастерская встречает тебя привычным шумом: сварка, молоты, запах горячего металла. Только тебе кажется, что после горы здесь слишком… нормально.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Ну? Принёс?',
        emotion: { primary: 'serious', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты ставишь контейнер на стол. Дитер открывает крышку — и мастерская на секунду озаряется холодным голубым светом.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Выдыхает) Он… целый. Заряд полный. Парень… ты даже не представляешь, что ты сделал.',
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Он быстро убирает кристалл в ящик с инструментами, как будто боится, что свет привлечёт лишние глаза.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Договор есть договор. Держи награду. И вот — бумага. Постоянное разрешение на ношение. Я замолвил слово где надо.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        condition: { flag: 'schlossberg_amulet_obtained' },
        text: 'Когда ты двигаешься, из кармана на миг выглядывает грубый каменный амулет. Взгляд Дитера цепляется за него мгновенно.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        condition: { flag: 'schlossberg_amulet_obtained' },
        text: 'Стой. Это… откуда у тебя такое?',
        emotion: { primary: 'curious', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'return_complete_no_amulet',
        text: 'Поблагодарить и уйти.',
        nextScene: 'exit_to_map',
        availability: { condition: { notFlag: 'schlossberg_amulet_obtained' } },
        effects: {
          addFlags: [
            'schlossberg_crystal_delivered',
            'schlossberg_investigated',
            'weapon_permit_granted',
            'whispers_quest_completed',
          ],
          removeFlags: ['need_return_to_dieter', 'whispers_quest_active'],
          immediate: [{ type: 'open_map' }],
          xp: 30,
        },
      },
      {
        id: 'return_show_amulet',
        text: 'Показать амулет.',
        nextScene: 'dieter_amulet_buy_offer',
        availability: { condition: { flag: 'schlossberg_amulet_obtained' } },
        effects: {
          addFlags: [
            'schlossberg_crystal_delivered',
            'schlossberg_investigated',
            'weapon_permit_granted',
            'whispers_quest_completed',
          ],
          removeFlags: ['need_return_to_dieter', 'whispers_quest_active'],
          xp: 30,
        },
      },
      {
        id: 'return_hide_amulet',
        text: 'Сделать вид, что он ничего не видел, и уйти.',
        nextScene: 'exit_to_map',
        availability: { condition: { flag: 'schlossberg_amulet_obtained' } },
        effects: {
          addFlags: [
            'schlossberg_crystal_delivered',
            'schlossberg_investigated',
            'weapon_permit_granted',
            'whispers_quest_completed',
            'schlossberg_amulet_hidden_from_dieter',
          ],
          removeFlags: ['need_return_to_dieter', 'whispers_quest_active'],
          immediate: [{ type: 'open_map' }],
          xp: 30,
        },
      },
    ],
  },

  dieter_amulet_buy_offer: {
    id: 'dieter_amulet_buy_offer',
    background: WORKSHOP_BACKGROUND,
    characters: [
      {
        id: 'dieter',
        name: 'Мастер Дитер',
        position: 'center',
        sprite: DIETER_SPRITE,
        emotion: { primary: 'curious', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты достаёшь амулет. Камень тёплый, будто впитал чужие ладони и чужую ярость.',
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: '(Берёт, вертит в руках) Хм… очень старая работа. Я такое видел только в дневниках первых «лесных».',
        emotion: { primary: 'curious', intensity: 70 },
      },
      {
        speaker: 'Мастер Дитер',
        characterId: 'dieter',
        text: 'Слушай. Я дам тебе за него сотню кредитов сверху. Идёт?',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'sell_amulet',
        text: 'Идёт. Забирай.',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['schlossberg_amulet_sold_to_dieter'],
          removeFlags: ['schlossberg_amulet_obtained'],
          immediate: [{ type: 'open_map' }],
          xp: 10,
        },
      },
      {
        id: 'keep_amulet',
        text: 'Нет. Оставлю себе.',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['schlossberg_amulet_kept'],
          immediate: [{ type: 'open_map' }],
          xp: 10,
        },
      },
    ],
  },
}



















