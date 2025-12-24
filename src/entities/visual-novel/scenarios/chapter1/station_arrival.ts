import type { Scene } from '../../model/types'

const STATION_BACKGROUND = '/images/backgrounds/station1.png'
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
        text: 'Вас выводят на платформу. Вокзал огромен: своды уходят в темноту, но везде свет, люди, суета. Запах угольного дыма и жареного лука. После кошмара в поезде это кажется раем.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вас выстраивают в линию у стены. Где-то рядом Проводник что-то объясняет офицеру, активно жестикулируя. Лена помогает санитарам грузить раненых на носилки.',
      },
      {
        speaker: 'Контролёр Густав',
        characterId: 'gustav',
        text: 'Контролёр Густав. Очередной рейс из ада… Кто старший?',
      },
      {
        speaker: 'Лена',
        text: 'Я врач. Лейтенант медицинской службы Рихтер. Мы ехали транзитом в Карлсруэ.',
      },
      {
        speaker: 'Контролёр Густав',
        characterId: 'gustav',
        text: 'Карлсруэ закрыт. Пути взорваны. Вы конечная, лейтенант. Добро пожаловать во Фрайбург.',
      },
      {
        speaker: 'Контролёр Густав',
        characterId: 'gustav',
        emotion: { primary: 'serious', intensity: 70 },
        text: 'А ты кто такой? Наёмник?',
      },
    ],
    choices: [
      {
        id: 'gustav_answer_force',
        text: '[СИЛА] "Тот, кто прикрывал их спины, пока вы пили кофе."',
        nextScene: 'freiburg_platform_portcigar',
        effects: { addFlags: ['gustav_answer_force'] },
      },
      {
        id: 'gustav_answer_logic',
        text: '[ЛОГИКА] "Пассажир. Документы в порядке."',
        nextScene: 'freiburg_platform_portcigar',
        effects: { addFlags: ['gustav_answer_logic'] },
      },
      {
        id: 'gustav_answer_rhetoric',
        text: '[ХАРИЗМА] "Просто попутчик, которому не повезло с билетом."',
        nextScene: 'freiburg_platform_portcigar',
        effects: { addFlags: ['gustav_answer_rhetoric'] },
      },
    ],
  },

  freiburg_platform_portcigar: {
    id: 'freiburg_platform_portcigar',
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
        text: 'Ты протягиваешь мятое удостоверение. Густав мельком глядит на него, затем делает пометку в планшете.',
      },
      {
        speaker: 'Контролёр Густав',
        characterId: 'gustav',
        text: 'Чист. Пока что.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Его взгляд скользит по твоей одежде и останавливается на груди, где под курткой угадываются очертания портсигара.',
      },
      {
        speaker: 'Контролёр Густав',
        characterId: 'gustav',
        text: 'А это что? Контрабанда? Оружие?',
      },
      {
        speaker: '[ПАРАНОЙЯ]',
        text: 'Он знает! Он видит насквозь! Если он откроет его — всё пропало!',
      },
      {
        speaker: '[ЛОГИКА]',
        text: 'Спокойно. У тебя есть легенда. Имя адресата — твоя защита.',
      },
    ],
    choices: [
      {
        id: 'portcigar_honest',
        text: '[ЧЕСТЬ] Достать портсигар и показать этикетку. "Личное поручение. Для профессора Йонаса Крюгера."',
        nextScene: 'info_bureau_meeting',
        effects: { addFlags: ['showed_kruger_label'] },
      },
      {
        id: 'portcigar_stealth',
        text: '[СКРЫТНОСТЬ] "Личные вещи. Память о деде."',
        nextScene: 'info_bureau_meeting',
        effects: { addFlags: ['hid_portcigar_story'] },
      },
      {
        id: 'portcigar_diplomacy',
        text: '[ДИПЛОМАТИЯ] "Ничего запрещенного. Можете проверить металлоискателем."',
        nextScene: 'info_bureau_meeting',
        effects: { addFlags: ['portcigar_checked'] },
      },
    ],
  },

  info_bureau_meeting: {
    id: 'info_bureau_meeting',
    background: STATION_BACKGROUND,
    characters: [
      {
        id: 'marta',
        name: 'Марта',
        position: 'center',
        sprite: MARTA_SPRITE,
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты, прижимая к себе немногочисленные вещи, подходишь к Информационному бюро — пыльному окошку в стене.',
      },
      {
        speaker: 'Марта',
        characterId: 'marta',
        text: 'О, доктор Рихтер. Живая. А это кто с тобой?',
      },
      {
        speaker: 'Лена',
        text: 'Курьер к профессору Крюгеру. Скажи, он у себя?',
      },
      {
        speaker: 'Марта',
        characterId: 'marta',
        text: 'Крюгер-то? У себя. Сидит в своей башне, как сыч. Никого не принимает… кроме курьеров, видимо.',
      },
      {
        speaker: 'Марта',
        characterId: 'marta',
        emotion: { primary: 'determined', intensity: 70 },
        text: 'Только вот посылка твоя подождёт. Он сейчас на экстренном совещании Совета — по поводу вашего поезда и того, что творится на путях. Вернётся не раньше вечера.',
      },
      {
        speaker: 'Лена',
        emotion: { primary: 'worried', intensity: 60 },
        text: 'Я не могу с тобой ждать. Мне нужно в лазарет — там ад творится. Ты иди, осмотрись. А вечером приходи к главному корпусу. Я буду там. И… спасибо. За то, что прикрыл спину.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Лена протягивает тебе армейскую аптечку — небольшую коробочку с потертым знаком медслужбы.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Лена уходит, растворяясь в толпе медиков. Ты остаёшься один перед окошком Марты.',
      },
      {
        speaker: 'Марта',
        characterId: 'marta',
        text: 'Ну что, «попутчик»? Застрял? Добро пожаловать во Фрайбург. Прежде чем начнёшь бегать по городу — неплохо бы оформить тебя по-человечески.',
      },
    ],
    choices: [
      {
        id: 'info_bureau_register_now',
        text: 'Пройти регистрацию.',
        nextScene: 'info_bureau_hans_arrival',
        effects: {
          addFlags: ['visited_info_bureau', 'know_lena_richter'],
          immediate: [
            {
              type: 'open_registration',
              data: { method: 'password', returnScene: 'info_bureau_hans_arrival' },
            },
          ],
        },
      },
      {
        id: 'info_bureau_skip_registration',
        text: 'Пока пропустить. Разберусь позже.',
        nextScene: 'info_bureau_hans_arrival',
        effects: {
          addFlags: ['visited_info_bureau', 'know_lena_richter'],
        },
      },
    ],
  },

  info_bureau_hans_arrival: {
    id: 'info_bureau_hans_arrival',
    background: STATION_BACKGROUND,
    characters: [
      {
        id: 'marta',
        name: 'Марта',
        position: 'right',
        sprite: MARTA_SPRITE,
        emotion: { primary: 'neutral', intensity: 65 },
      },
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
        speaker: 'Рассказчик',
        text: 'К вам подходит патрульный FJR. Он снимает шлем, и ты видишь внимательный взгляд — цепкий, как у человека, который привык оценивать угрозы за секунды.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Бабушка, не пугай человека. Ему и так досталось.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Я видел, как ты держался при досмотре. И в поезде. Неплохо.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        emotion: { primary: 'serious', intensity: 70 },
        text: 'У меня есть для тебя дело. Неофициальное. Раз уж тебе всё равно ждать до вечера… хочешь заработать?',
      },
    ],
    choices: [
      {
        id: 'hans_hear_offer',
        text: '"Я слушаю. Деньги не помешают."',
        nextScene: 'info_bureau_hans_offer',
      },
      {
        id: 'hans_ask_whats_going_on',
        text: '"Сначала расскажите, что здесь вообще происходит."',
        nextScene: 'info_bureau_factions_briefing',
      },
      {
        id: 'hans_refuse_offer_early',
        text: '"Нет. Я лучше отдохну."',
        nextScene: 'info_bureau_hans_refusal',
      },
    ],
  },

  info_bureau_factions_briefing: {
    id: 'info_bureau_factions_briefing',
    background: STATION_BACKGROUND,
    characters: [
      {
        id: 'marta',
        name: 'Марта',
        position: 'center',
        sprite: MARTA_SPRITE,
        emotion: { primary: 'neutral', intensity: 70 },
      },
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
        speaker: 'Вы',
        text: 'Я только что с поезда, где нас чуть не сожрали. А теперь вы говорите, что я застрял. Где я? И кто здесь главный?',
      },
      {
        speaker: 'Марта',
        characterId: 'marta',
        text: 'Главный? Официально — Мэрия и железная леди, Аурелия Фокс. Она держит город за глотку. Благодаря ей у нас есть стены и патрули FJR.',
      },
      {
        speaker: 'Марта',
        characterId: 'marta',
        text: 'Если руки не из задницы — иди к Артисанам. Чинят всё, что ломается. Платят мало, но кормят густо. Главный у них Дитер — мужик суровый, но честный.',
      },
      {
        speaker: 'Марта',
        characterId: 'marta',
        text: 'Если ты из «умников» — тебе в «Синтез». Наука, медицина, эксперименты. Думают, что спасут мир пробирками.',
      },
      {
        speaker: 'Марта',
        characterId: 'marta',
        text: 'Жить по-людски хочешь — иди к Староверам в Собор. Отец Иоанн всех примет. Суп жидкий, зато слово доброе.',
      },
      {
        speaker: 'Марта',
        characterId: 'marta',
        emotion: { primary: 'tense', intensity: 70 },
        text: 'А вот куда тебе не надо — так это в «Дыру» к Анархистам. Наркоманы, бандиты, сброд. Если жизнь дорога — обходи стороной.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'В общем, расклад ты понял. Работы навалом, но платить никто не спешит.',
      },
    ],
    choices: [
      {
        id: 'back_to_hans_offer',
        text: 'Вернуться к разговору с Гансом.',
        nextScene: 'info_bureau_hans_offer',
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
