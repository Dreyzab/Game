import type { Scene } from '../../model/types'

const STATION_BACKGROUND = '/images/backgrounds/station.png'
const STATION_CHECK_BACKGROUND = '/images/backgrounds/station_check.png'
const MARTA_SPRITE = '/images/npcs/trader.jpg'
const HANS_SPRITE = '/images/npcs/craftsman.jpg'

export const stationArrivalScenes: Record<string, Scene> = {
  freiburg_platform_gustav: {
    id: 'freiburg_platform_gustav',
    background: STATION_BACKGROUND,
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'center',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вас выводят на платформу. Вокзал огромен: своды уходят в темноту, но везде свет, люди, суета. Звуки суеты и запах жареного лука. После кошмара в поезде это кажется раем.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вас выстраивают в линию у вагона. Где-то рядом Проводник что-то объясняет офицеру, активно жестикулируя. Лена помогает санитарам грузить раненых на носилки.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        background: STATION_CHECK_BACKGROUND,
        text: 'Этой ночью поезда подверглись нападению. Нам требуеться установить личность каждого пассажира. Есть тут офицеры?',
      },
      {
        speaker: 'Лена',
        background: STATION_CHECK_BACKGROUND,
        text: 'Я врач. Лейтенант медицинской службы Рихтер. Мы ехали транзитом в Карлсруэ.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        background: STATION_CHECK_BACKGROUND,
        text: 'Движение остановилось, дальнейший путь закрыт. Вы на конечной, лейтенант. Добро пожаловать во Фрайбург.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        emotion: { primary: 'serious', intensity: 70 },
        background: STATION_CHECK_BACKGROUND,
        text: 'А ты кто такой? ',
      },
    ],
    choices: [
      {
        id: 'gustav_answer_force',
        text: '[Сила] "Тот, кто спас ситуацию."',
        nextScene: 'freiburg_platform_gustav_force_reaction',
        effects: { addFlags: ['gustav_answer_force'] },
      },
      {
        id: 'gustav_answer_mind',
        text: '[Разум] "Пассажир. Вот документы."',
        nextScene: 'freiburg_platform_gustav_mind_reaction',
        effects: { addFlags: ['gustav_answer_mind'] },
      },
      {
        id: 'gustav_answer_heart',
        text: '[Азарт] "А кто спрашивает?"',
        nextScene: 'freiburg_platform_gustav_heart_reaction',
        effects: { addFlags: ['gustav_answer_heart'] },
      },
    ],
  },

  freiburg_platform_gustav_force_reaction: {
    id: 'freiburg_platform_gustav_force_reaction',
    background: STATION_CHECK_BACKGROUND,
    characters: [{ id: 'gustav', name: 'Контролёр', position: 'center' }],
    dialogue: [
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        text: '«Спас ситуацию»? Громкое заявление. Надеюсь, твои документы так же надёжны, как и твоё самомнение. Давай их сюда.',
      },
    ],
    nextScene: 'freiburg_platform_portcigar',
  },

  freiburg_platform_gustav_mind_reaction: {
    id: 'freiburg_platform_gustav_mind_reaction',
    background: STATION_CHECK_BACKGROUND,
    characters: [{ id: 'gustav', name: 'Контролёр', position: 'center' }],
    dialogue: [
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        text: 'Разумный подход. Мы ценим порядок и тех, кто не создаёт лишних проблем.',
      },
    ],
    nextScene: 'freiburg_platform_portcigar',
  },

  freiburg_platform_gustav_heart_reaction: {
    id: 'freiburg_platform_gustav_heart_reaction',
    background: STATION_CHECK_BACKGROUND,
    characters: [{ id: 'gustav', name: 'Контролёр', position: 'center' }],
    dialogue: [
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        text: 'Вопросы здесь задаю я. И если не хочешь провести остаток дня в изоляторе — советую сменить тон и предъявить документы.',
      },
    ],
    nextScene: 'freiburg_platform_portcigar',
  },

  freiburg_platform_portcigar: {
    id: 'freiburg_platform_portcigar',
    background: STATION_CHECK_BACKGROUND,
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр',
        position: 'center',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты протягиваешь мятое удостоверение. Контролёр мельком глядит на него, затем делает пометку в планшете.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        text: 'Так,так,так - Вьехал через западную границу 2 дня назад и уже здесь. Какую цель преследуешь?',
      },
      {
        speaker: 'Рассказчик',
        text: 'Его взгляд скользит по твоей одежде и останавливается на груди, где под курткой угадываются очертания портсигара.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        text: 'А это что? Контрабанда? Оружие?',
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: ' Замечена провокация. Не поддаваться. Не ускорять дыхание. Держать тон ровным.',
      },
      {
        speaker: 'ЛОГИКА',
        text: ' Спокойно. У тебя есть легенда. Имя адресата — твоя защита.',
      },
    ],
    choices: [
      {
        id: 'portcigar_honest',
        text: '[ЧЕСТЬ] Достать портсигар и показать этикетку. "Личное поручение. Для профессора Йонаса Штейнбаха."',
        nextScene: 'freiburg_platform_portcigar_honest_reaction',
        effects: {
          addFlags: ['showed_steinbach_label', 'has_package'],
          removeFlags: ['hid_portcigar_story', 'portcigar_checked'],
        },
      },
      {
        id: 'portcigar_stealth',
        text: '[ВНУШЕНИЕ] "Личные вещи. Память о деде."',
        nextScene: 'freiburg_platform_portcigar_stealth_reaction',
        effects: {
          addFlags: ['hid_portcigar_story', 'has_package'],
          removeFlags: ['showed_steinbach_label', 'portcigar_checked'],
        },
      },
      {
        id: 'portcigar_diplomacy',
        text: '[РИТОРИКА] "Ничего запрещенного. Однако разве вам не следует разбираться с нападением на поезд?."',
        nextScene: 'freiburg_platform_portcigar_diplomacy_reaction',
        effects: {
          addFlags: ['portcigar_checked', 'has_package'],
          removeFlags: ['showed_steinbach_label', 'hid_portcigar_story'],
        },
      },
    ],
  },

  freiburg_platform_portcigar_honest_reaction: {
    id: 'freiburg_platform_portcigar_honest_reaction',
    background: STATION_CHECK_BACKGROUND,
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр',
        position: 'center',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Игрок',
        text: '(Достаёт портсигар и показывает край этикетки) Личное поручение. Для профессора Йонаса Штейнбаха.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        emotion: { primary: 'surprised', intensity: 70 },
        text: 'Штейнбаха?.. Хм.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        emotion: { primary: 'serious', intensity: 70 },
        text: 'Профессор сейчас в Университете, в кампусе «Синтеза». Говорят, он знает, почему атаки участились.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Контролёр быстро заполняет бланк, ставит штамп и выдёргивает из пачки тонкую карточку.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        text: 'Хорошо. Проходи. Вот разрешение на временное пребывание. Зарегистрируйся в мэрии как можно скорее — иначе с документами будут проблемы.',
      },
    ],
    nextScene: 'station_party_split',
  },

  freiburg_platform_portcigar_stealth_reaction: {
    id: 'freiburg_platform_portcigar_stealth_reaction',
    background: STATION_CHECK_BACKGROUND,
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр',
        position: 'center',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Игрок',
        text: 'Личные вещи. Память о деде.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        emotion: { primary: 'serious', intensity: 70 },
        text: 'Память, говоришь… В такие времена у всех «память».',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он смотрит на тебя долгую секунду — и, наконец, отводит взгляд, будто решил не раскручивать эту нитку.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        text: 'Ладно. Но если это окажется не «память» — портсигар я вспомню. И тебя тоже.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Контролёр ставит штамп на бланк и протягивает тонкую карточку.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        text: 'Разрешение на временное пребывание. В мэрию — как можно скорее. Порядок есть порядок.',
      },
    ],
    nextScene: 'station_party_split',
  },

  freiburg_platform_portcigar_diplomacy_reaction: {
    id: 'freiburg_platform_portcigar_diplomacy_reaction',
    background: STATION_CHECK_BACKGROUND,
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр',
        position: 'center',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Игрок',
        text: 'Ничего запрещённого. Однако разве вам не следует разбираться с нападением на поезд?',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        emotion: { primary: 'angry', intensity: 65 },
        text: 'И разбираемся. Именно поэтому ты сейчас отвечаешь на вопросы.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он протягивает руку. Не просит — требует.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Контролёр приоткрывает портсигар, быстро осматривает содержимое и цепляется взглядом за этикетку.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        emotion: { primary: 'surprised', intensity: 70 },
        text: 'Штейнбах… Так бы сразу и сказал.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        emotion: { primary: 'serious', intensity: 70 },
        text: 'Профессор сейчас в Университете, в кампусе «Синтеза».',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он возвращает портсигар, ставит штамп и протягивает тебе карточку.',
      },
      {
        speaker: 'Контролёр',
        characterId: 'gustav',
        text: 'Разрешение на временное пребывание. Иди в мэрию и зарегистрируйся. А поучать будешь — когда сам в форме окажешься.',
      },
    ],
    nextScene: 'station_party_split',
  },

  station_party_split: {
    id: 'station_party_split',
    background: STATION_BACKGROUND,
    characters: [
      {
        id: 'otto',
        name: 'Отто Кляйн',
        position: 'left',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        id: 'bruno',
        name: 'Бруно Вебер',
        position: 'center',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        id: 'lena',
        name: 'Лена Рихтер',
        position: 'right',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Поток людей размывает перрон. Вокзал проглатывает вас — и, кажется, вместе с ним заканчивается и общая дорога.',
      },
      {
        speaker: 'Отто Кляйн',
        characterId: 'otto',
        text: 'Ну, бывайте. У меня тут… дела в «нижнем городе».',
      },
      {
        speaker: 'Бруно Вебер',
        characterId: 'bruno',
        text: 'А я должен встретиться с дядей в районе мастерских. Надеюсь, ещё встретимся!',
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'Мне всё равно нужно в Университет, в штаб «Синтеза». А тебе нужно найти профессора. Пойдём вместе?',
      },
    ],
    choices: [
      {
        id: 'station_split_yes',
        text: 'Да. Пойдём вместе.',
        effects: {
          addFlags: ['lena_accompanies_to_campus', 'know_lena_richter'],
          removeFlags: ['lena_declined_company'],
          narrative: 'На карте отмечены: Кампус «Синтез» и Ратушная площадь.',
          immediate: [{ type: 'open_map' }],
        },
      },
      {
        id: 'station_split_no',
        text: 'Нет. Я разберусь сам(а).',
        effects: {
          addFlags: ['lena_declined_company', 'know_lena_richter'],
          removeFlags: ['lena_accompanies_to_campus'],
          narrative: 'На карте отмечены: Кампус «Синтез» и Ратушная площадь.',
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },


  info_bureau_hans_offer: {
    id: 'info_bureau_hans_offer',
    background: STATION_BACKGROUND,
    characters: [
      {
        id: 'hans',
        name: 'Ганс',
        position: 'left',
        sprite: HANS_SPRITE,
        emotion: { primary: 'determined', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ганс достаёт из подсумка тяжёлый прибор, похожий на старый КПК. Экран загорается холодным зелёным светом.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Держи. «Эхо-7». Здесь карта, связь, новости. Подарок от мэрии для всех беженцев.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Только не пытайся его разобрать — там трекер. Мы любим знать, где наши гости.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Теперь к делу. Нужно забрать запчасти на Базаре — это площадь Старой Синагоги. Лавка «Ржавый Якорь». Торговца зовут Элиас, он работает на Фленса. Скажешь, что от меня.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Потом отнесёшь ящик в Промзону мастеру Дитеру. Дело на час, а кредитов хватит на нормальный ужин и ночлег. Берёшься?',
      },
    ],
    choices: [
      {
        id: 'accept_chance_for_newbie',
        text: 'Берусь. Где искать этого Элиаса?',
        nextScene: 'info_bureau_hans_accept',
        effects: {
          addFlags: [
            'met_hans',
            'got_communicator',
            'hans_gave_first_quest',
            'received_first_quest',
            'chance_for_newbie_active',
          ],
        },
      },
      {
        id: 'decline_chance_for_newbie',
        text: 'Я подумаю. Мне нужно осмотреться.',
        nextScene: 'info_bureau_hans_refusal',
        effects: {
          addFlags: ['met_hans', 'got_communicator'],
        },
      },
    ],
  },

  info_bureau_hans_accept: {
    id: 'info_bureau_hans_accept',
    background: STATION_BACKGROUND,
    characters: [
      {
        id: 'hans',
        name: 'Ганс',
        position: 'left',
        sprite: HANS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Отлично. Маркер уже на карте. И не геройствуй — просто донеси ящик.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Твой КПК пищит: [Новое задание: «Шанс для новичка»]. Маркер указывает на центр города.',
      },
    ],
    choices: [
      {
        id: 'open_map_after_hans',
        text: 'Открыть карту города.',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  info_bureau_hans_refusal: {
    id: 'info_bureau_hans_refusal',
    background: STATION_BACKGROUND,
    characters: [
      {
        id: 'hans',
        name: 'Ганс',
        position: 'left',
        sprite: HANS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Твоё право. Но «Эхо-7» всё равно держи при себе. Без него в городе — как без глаз.',
      },
    ],
    choices: [
      {
        id: 'open_map_after_refusal',
        text: 'Открыть карту города.',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  info_bureau_return: {
    id: 'info_bureau_return',
    background: STATION_BACKGROUND,
    characters: [
      {
        id: 'marta',
        name: 'Марта',
        position: 'center',
        sprite: MARTA_SPRITE,
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Марта',
        characterId: 'marta',
        text: 'Опять ты. Ганс уже всё объяснил. Смотри по сторонам и не суйся туда, где пахнет бедой.',
      },
    ],
    choices: [
      {
        id: 'info_bureau_return_to_map',
        text: 'Вернуться к карте.',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  hans_reminder_dialog: {
    id: 'hans_reminder_dialog',
    background: '/images/backgrounds/station.png',
    characters: [
      {
        id: 'hans',
        name: 'Ганс',
        position: 'center',
        sprite: HANS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Элиас на Базаре, лавка «Ржавый Якорь». Забираешь ящик — и сразу к Дитеру в Промзону. Дело простое, но мне важно, чтобы ты довёл его до конца.',
      },
      {
        speaker: '[ЛОГИКА]',
        text: 'Он проверяет не твою силу. Он проверяет, можно ли тебе доверять.',
      },
    ],
    choices: [
      {
        id: 'hans_reminder_back_to_map',
        text: 'Понял. Вернуться к карте.',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },
}
