import type { Scene } from '../../model/types'

const POLICE_BACKGROUND = '/images/backgrounds/station_check.png'
const TOWNHALL_BACKGROUND = '/images/backgrounds/station1.png'
const OLD_REGISTRAR_SPRITE = '/images/npcs/trader.jpg'
const HANS_SPRITE = '/images/npcs/craftsman.jpg'

export const onboardingScenes: Record<string, Scene> = {
  onboarding_police_intro: {
    id: 'onboarding_police_intro',
    background: POLICE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Отряд правоохранителей',
        text: 'Стоять. Назовите ваше имя.',
      },
      {
        speaker: 'Отряд правоохранителей',
        text: 'Вас нет в реестре городской администрации. Порядок есть порядок.',
      },
      {
        speaker: 'Отряд правоохранителей',
        text: 'Если вы новоприбывший — сначала регистрация. Ратушная площадь.',
      },
    ],
    choices: [
      {
        id: 'onboarding_set_nickname',
        text: 'Назвать имя',
        nextScene: 'onboarding_police_direct',
        effects: {
          immediate: [{ type: 'prompt_nickname' }],
        },
      },
    ],
  },

  onboarding_police_direct: {
    id: 'onboarding_police_direct',
    background: POLICE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Отряд правоохранителей',
        text: 'Пройдите на Ратушную площадь для регистрации. Пока вы не зарегистрированы — городские QR-коды вам ничего не дадут.',
      },
    ],
    choices: [
      {
        id: 'onboarding_go_to_townhall',
        text: 'Понял(а)',
        effects: {
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },

  onboarding_townhall_registration: {
    id: 'onboarding_townhall_registration',
    background: TOWNHALL_BACKGROUND,
    characters: [
      {
        id: 'old_registrar',
        name: 'Старуха-регистратор',
        position: 'center',
        sprite: OLD_REGISTRAR_SPRITE,
        emotion: { primary: 'neutral', intensity: 75 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'От вокзала до Ратушной площади недалеко, но путь кажется длинным. Каменная мэрия XVI–XVII веков со временем обросла административным кварталом — теперь здесь решают судьбы новоприбывших.',
      },
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: '(Сухо, но без злобы) Следующий. С вокзала? Подойди ближе.',
      },
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'Слышала про инцидент с поездом. Говорят, там было жарко. То, что ты стоишь здесь на своих двоих — уже хорошая рекомендация.',
        condition: { flag: 'survived_train_crash' }
      },
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'Перед реестром — короткая анкета. Не из любопытства: по ответам видно, на что ты опираешься и куда тебе лучше не лезть.',
      },
    ],
    choices: [
      {
        id: 'onboarding_start_questionnaire',
        text: 'Начать регистрацию',
        nextScene: 'onboarding_townhall_question_1',
      },
      {
        id: 'onboarding_leave_townhall',
        text: 'Уйти',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  onboarding_townhall_question_1: {
    id: 'onboarding_townhall_question_1',
    background: TOWNHALL_BACKGROUND,
    characters: [
      {
        id: 'old_registrar',
        name: 'Старуха-регистратор',
        position: 'center',
        sprite: OLD_REGISTRAR_SPRITE,
        emotion: { primary: 'neutral', intensity: 75 },
      },
    ],
    dialogue: [
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'Когда становится по-настоящему опасно, на что ты полагаешься в первую очередь?',
      },
    ],
    choices: [
      {
        id: 'onboarding_build_body',
        text: 'На силу и выдержку.',
        nextScene: 'onboarding_townhall_question_2',
        effects: { addFlags: ['build_body'], removeFlags: ['build_mind', 'build_social'] },
      },
      {
        id: 'onboarding_build_mind',
        text: 'На расчёт и холодную голову.',
        nextScene: 'onboarding_townhall_question_2',
        effects: { addFlags: ['build_mind'], removeFlags: ['build_body', 'build_social'] },
      },
      {
        id: 'onboarding_build_social',
        text: 'На язык и умение договариваться.',
        nextScene: 'onboarding_townhall_question_2',
        effects: { addFlags: ['build_social'], removeFlags: ['build_body', 'build_mind'] },
      },
    ],
  },

  onboarding_townhall_question_2: {
    id: 'onboarding_townhall_question_2',
    background: TOWNHALL_BACKGROUND,
    characters: [
      {
        id: 'old_registrar',
        name: 'Старуха-регистратор',
        position: 'center',
        sprite: OLD_REGISTRAR_SPRITE,
        emotion: { primary: 'neutral', intensity: 75 },
      },
    ],
    dialogue: [
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'А на незнакомой улице ты сначала…',
      },
    ],
    choices: [
      {
        id: 'onboarding_style_observe',
        text: 'Оглядываюсь и слушаю.',
        nextScene: 'onboarding_townhall_method',
        effects: { addFlags: ['build_observer'], removeFlags: ['build_rusher', 'build_negotiator'] },
      },
      {
        id: 'onboarding_style_rush',
        text: 'Действую быстро, без лишних пауз.',
        nextScene: 'onboarding_townhall_method',
        effects: { addFlags: ['build_rusher'], removeFlags: ['build_observer', 'build_negotiator'] },
      },
      {
        id: 'onboarding_style_talk',
        text: 'Ищу, с кем поговорить и что узнать.',
        nextScene: 'onboarding_townhall_method',
        effects: { addFlags: ['build_negotiator'], removeFlags: ['build_observer', 'build_rusher'] },
      },
    ],
  },

  onboarding_townhall_method: {
    id: 'onboarding_townhall_method',
    background: TOWNHALL_BACKGROUND,
    characters: [
      {
        id: 'old_registrar',
        name: 'Старуха-регистратор',
        position: 'center',
        sprite: OLD_REGISTRAR_SPRITE,
        emotion: { primary: 'neutral', intensity: 75 },
      },
    ],
    dialogue: [
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'Ладно. Анкету записала. Теперь — официально: выбирай способ регистрации в городском реестре.',
      },
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'Clerk — это система аккаунтов и входа: позволит привязать прогресс к учётной записи и заходить с разных устройств.',
      },
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'Если выбираете регистрацию по паролю — запомните пароль и никнейм: функции восстановления пока нет.',
      },
    ],
    choices: [
      {
        id: 'onboarding_register_clerk',
        text: 'Зарегистрироваться через Clerk',
        effects: {
          immediate: [
            {
              type: 'open_registration',
              data: { method: 'clerk', returnScene: 'onboarding_factions_overview' },
            },
          ],
        },
      },
      {
        id: 'onboarding_register_password',
        text: 'Зарегистрироваться по паролю (без восстановления)',
        effects: {
          immediate: [
            {
              type: 'open_registration',
              data: { method: 'password', returnScene: 'onboarding_factions_overview' },
            },
          ],
        },
      },
      {
        id: 'onboarding_registration_cancel',
        text: 'Пока не готов(а)',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  onboarding_factions_overview: {
    id: 'onboarding_factions_overview',
    background: TOWNHALL_BACKGROUND,
    characters: [
      {
        id: 'old_registrar',
        name: 'Старуха-регистратор',
        position: 'center',
        sprite: OLD_REGISTRAR_SPRITE,
        emotion: { primary: 'neutral', intensity: 75 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'За мутным стеклом сидела старуха, иссохшая настолько, что казалась сделанной из пергамента и тонких веточек. Её глаза, однако, были живыми и невероятно проницательными.',
      },
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'Если руки у тебя из плеч растут, а в голове не только ветер, ступай к Артисанам. У них в промзоне всегда работа найдётся. Платят мало, но кормят исправно. Коли ты человек науки, мозговитый, иди к «Синтезу» в их кампус. Говорят, они там на пороге великого открытия, может, и тебе место найдётся — пробирки мыть.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Она перевела дух, кашлянула.',
      },
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'Ежели нужно просто убежище и тарелка супа, поговори с отцом Иоанном — он обычно хлопочет в старой кафедрали. Человек он добрый, приютит. И вот тебе мой совет, голубчик: держись подальше от района анархистов на Августинской площади. Там только блядство, разврат и наркотики — пропадёшь ни за грош.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Старуха сделала паузу, хитро прищурившись.',
      },
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'А если совсем прижмёт… если ты не боишься держать оружие и спать вполглаза… Обрати внимание на тех, кто тебя встретил. FJR всегда ищут новых добровольцев. Их призывной пункт прямо у старой Мэрии, где эта железная леди, Аурелия Фокс, заседает. Уж не знаю как, но только она одна умудряется найти управу на всех этих твердолобых лидеров фракций и не дать им перегрызть друг другу глотки.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Старуха ставит штамп и протягивает тонкий картонный талон.',
      },
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'Держи. Временный пропуск. А теперь — коммуникатор. Ганс! Подойди сюда!',
        emotion: { primary: 'excited', intensity: 80 },
      },
    ],
    choices: [
      {
        id: 'wait_for_hans',
        text: 'Подождать.',
        nextScene: 'onboarding_hans_introduction',
      },
    ],
  },

  onboarding_hans_introduction: {
    id: 'onboarding_hans_introduction',
    background: TOWNHALL_BACKGROUND,
    characters: [
      {
        id: 'old_registrar',
        name: 'Старуха-регистратор',
        position: 'center',
        sprite: OLD_REGISTRAR_SPRITE,
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
        speaker: 'Рассказчик',
        text: 'На зов откликается молодой патрульный FJR. Он отделяется от стены, подходит ближе и приподнимает защитный визор: усталое, но внимательное лицо без лишних эмоций.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Вызывали?',
      },
      {
        speaker: 'Старуха-регистратор',
        characterId: 'old_registrar',
        text: 'Новоприбывший. С вокзала направили — без реестра в городе шагу не сделаешь. Выдай ему коммуникатор и объясни основы.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ганс смотрит на тебя без грубости, но внимательно — так смотрят на тех, кто может стать проблемой. Или решением.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Понял.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    nextScene: 'onboarding_hans_give_pda',
  },

  onboarding_hans_give_pda: {
    id: 'onboarding_hans_give_pda',
    background: TOWNHALL_BACKGROUND,
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
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Вот. Городской коммуникатор. Здесь карта, QR‑сканер и канал связи с патрулём. Носи при себе и не теряй.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он протягивает тяжёлый, поцарапанный прибор — будто переживший несколько чужих историй.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Теперь — дело. Тебе понадобятся деньги и репутация. У меня есть простая проверка — без героизма.',
      },
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: 'Рынок. Лавочник Элиас. Заберёшь ящик и отнесёшь мастеру Дитеру в мастерскую «Опора».',
      },
    ],
    choices: [
      {
        id: 'accept_hans_quest',
        text: 'Принять поручение.',
        nextScene: 'onboarding_hans_departure',
        effects: {
          addFlags: [
            'met_hans',
            'got_communicator',
            'hans_gave_first_quest',
            'hans_is_testing_player',
            'chance_for_newbie_active',
            'received_first_quest',
          ],
        },
      },
      {
        id: 'refuse_hans_quest',
        text: 'Отказаться.',
        nextScene: 'onboarding_hans_departure_refused',
        effects: {
          addFlags: ['met_hans', 'got_communicator', 'refused_hans_test'],
        },
      },
    ],
  },

  onboarding_hans_departure: {
    id: 'onboarding_hans_departure',
    background: TOWNHALL_BACKGROUND,
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
        text: 'Хороший ответ. Выполнишь — поговорим о более серьёзных вещах.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ганс надевает шлем и уходит, растворяясь в потоке людей.',
      },
    ],
    choices: [
      {
        id: 'onboarding_open_map_after_hans',
        text: 'Открыть карту города',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  onboarding_hans_departure_refused: {
    id: 'onboarding_hans_departure_refused',
    background: TOWNHALL_BACKGROUND,
    characters: [
      {
        id: 'hans',
        name: 'Ганс',
        position: 'left',
        sprite: HANS_SPRITE,
        emotion: { primary: 'angry', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Ганс',
        characterId: 'hans',
        text: '...что ж. Это тоже будет ответ. И я его запомню.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он бросает на вас холодный взгляд и уходит, не прощаясь.',
      },
    ],
    choices: [
      {
        id: 'onboarding_open_map_after_refusal',
        text: 'Открыть карту города',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },
}
