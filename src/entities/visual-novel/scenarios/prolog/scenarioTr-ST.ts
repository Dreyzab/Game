import type { Scene } from '../../model/types'

const TRAIN_CIGAR_BACKGROUND = '/images/trainCigar.png'
const TRAIN_CARDS_BACKGROUND = '/images/trainCards.png'
const TRAIN_KNIFE_BACKGROUND = '/images/trainKnife.png'
const COUPE_BACKGROUND = '/video/Анимация_пейзажа_и_планшета.mp4'
const TAMBOUR_BACKGROUND = '/images/trainCigar.png'// Placeholder

/**
 * Cinematic Prologue: Coupe interaction -> Tambour choices -> Creature Attack -> Tutorials
 */
export const scenarios: Record<string, Scene> = {
  // ============================================================================
  // STAGE 1: THE COUPE (Человек чего-то хочет)
  // ============================================================================

  prologue_coupe_intro: {
    id: 'prologue_coupe_intro',
    background: COUPE_BACKGROUND,
    music: 'train_ambience',
    characters: [
      { id: 'bruno', name: 'Бруно Вебер', position: 'left', emotion: { primary: 'nervous' } },
      { id: 'lena', name: 'Лена Рихтер', position: 'right', emotion: { primary: 'tired' } },
      { id: 'adele', name: 'Адель', position: 'right', emotion: { primary: 'calm' } },
      { id: 'otto', name: 'Отто Кляйн', position: 'left', emotion: { primary: 'grim' } },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Мерный, убаюкивающий стук колёс. Дребезжание ложки в пустом стакане. Тесное купе пропахло табаком и усталостью.',
        condition: { notFlag: 'prologue_visited_any' },
      },
      {
        speaker: 'Рассказчик',
        text: 'Вы возвращаетесь к обсуждению.',
        condition: { flag: 'prologue_visited_any' },
      },
      {
        speaker: 'Рассказчик',
        text: 'На столике — порезанное яблоко, роскошь в этих краях, и замусоленная колода карт. Четверо попутчиков, спаянных дорогой. Не друзья, но и не чужие.',
      },
    ],
    choices: [
      {
        id: 'prologue_coupe_look_bruno',
        text: 'Посмотреть на Бруно.',
        nextScene: 'prologue_coupe_bruno',
        effects: {
          addFlags: ['prologue_visited_bruno', 'prologue_visited_any'],
        },
        availability: {
          condition: {
            notFlag: 'prologue_visited_bruno',
          },
        },
      },
      {
        id: 'prologue_coupe_look_lena',
        text: 'Слушать Лену.',
        nextScene: 'prologue_coupe_lena',
        effects: {
          addFlags: ['prologue_visited_lena', 'prologue_visited_any'],
        },
        availability: {
          condition: {
            notFlag: 'prologue_visited_lena',
          },
        },
      },
      {
        id: 'prologue_coupe_look_adele',
        text: 'Взглянуть на Адель.',
        nextScene: 'prologue_coupe_adele',
        effects: {
          addFlags: ['prologue_visited_adele', 'prologue_visited_any'],
        },
        availability: {
          condition: {
            flags: ['prologue_visited_lena'],
            notFlag: 'prologue_visited_adele',
          },
        },
      },
      {
        id: 'prologue_coupe_look_otto',
        text: 'Посмотреть на Отто.',
        nextScene: 'prologue_coupe_otto',
        availability: {
          condition: {
            flags: ['prologue_visited_bruno', 'prologue_visited_lena', 'prologue_visited_adele'],
          },
        },
      },
    ],
  },

  prologue_coupe_bruno: {
    id: 'prologue_coupe_bruno',
    background: COUPE_BACKGROUND,
    characters: [{ id: 'bruno', name: 'Бруно Вебер', position: 'left' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Крепко сбитый мужчина средних лет. Его лицо изрезано мелкими шрамами, а руки, испачканные в мазуте, нервно теребят край старого плаща.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Бруно прерывает тишину.',
      },
      {
        speaker: 'Бруно Вебер',
        text: 'Подъезжаем. Я узнаю этот дым. Промышленный Север, Зона Гамма. Там воздух на вкус как жженая резина... Хех, пахнет домом.',
      },
      {
        speaker: 'Бруно Вебер',
        text: 'Надеюсь, старина Дитер не забыл меня встретить. Он писал, что устроился у Артисанов. "Приезжай, — говорит, — Бруно, тут есть работа для тех, кто отличает детонатор от суппозитория".',
      },
    ],
    nextScene: 'prologue_coupe_intro',
  },

  prologue_coupe_lena: {
    id: 'prologue_coupe_lena',
    background: COUPE_BACKGROUND,
    characters: [{ id: 'lena', name: 'Лена Рихтер', position: 'right' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Женщина с уставшими глазами, в безупречно чистом, несмотря на дорожную пыль, медицинском халате под пальто. Она сосредоточенно пересчитывает ампулы в небольшой сумке.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Лена тяжело вздыхает и обращается к Бруно.',
      },
      {
        speaker: 'Лена Рихтер',
        text: 'Работу ты найдешь, Бруно. А вот найдешь ли ты горячую воду?',
      },
      {
        speaker: 'Лена Рихтер',
        text: 'Я сейчас душу бы продала не за работу, а за ванну. Настоящую, фаянсовую ванну. Полную кипятка. Чтобы смыть с себя эту... "Красную зону".',
      },
      {
        speaker: 'Лена Рихтер',
        text: 'Если в этом хваленом Фрайбурге есть ванна и кусок мыла, который пахнет лавандой, а не хлоркой — я остаюсь.',
      },
    ],
    nextScene: 'prologue_coupe_intro',
  },

  prologue_coupe_adele: {
    id: 'prologue_coupe_adele',
    background: COUPE_BACKGROUND,
    characters: [{ id: 'adele', name: 'Адель', position: 'right' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Молодая особа с дерзким взглядом, одетая в яркую, но поношенную куртку. Она вальяжно развалилась на сиденье, закинув ногу на ногу.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Адель усмехается, не глядя на остальных.',
      },
      {
        speaker: 'Адель',
        text: 'Мелко плаваешь, док. Ванна — это гигиена. А жить надо ради удовольствия.',
      },
      {
        speaker: 'Адель',
        text: 'Я слышала, Мэр Фокс держит настоящих поваров. Настоящий стейк. С кровью. И бокал красного.',
      },
      {
        speaker: 'Адель',
        text: 'Говорят, на "Теневом рынке" за кредиты можно купить даже свежие овощи. Вот это — цель. А помыться можно и в Рейне.',
      },
    ],
    choices: [
      {
        id: 'prologue_adele_to_lena',
        text: 'Слушать Лену.',
        nextScene: 'prologue_coupe_lena_from_adele',
        effects: {
          addFlags: ['prologue_visited_lena', 'prologue_visited_adele', 'prologue_visited_any'],
        },
      },
      {
        id: 'prologue_adele_back',
        text: 'Вернуться к общему разговору.',
        nextScene: 'prologue_coupe_intro',
      },
    ],
  },

  prologue_coupe_lena_from_adele: {
    id: 'prologue_coupe_lena_from_adele',
    background: COUPE_BACKGROUND,
    characters: [{ id: 'lena', name: 'Лена Рихтер', position: 'right' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Лена Рихтер кривится, явно не разделяя энтузиазма Адель.',
      },
      {
        speaker: 'Лена Рихтер',
        text: 'В Рейне? Ты хоть представляешь, сколько там заразы сейчас? После таких "купаний" мне придется лечить тебя не от удовольствия, а от сыпи по всему телу.',
      },
      {
        speaker: 'Лена Рихтер',
        text: 'Но... ты права в одном. В этом городе каждый ищет что-то своё. Кто-то стейки, кто-то выживание. Я же просто хочу покоя.',
      },
    ],
    nextScene: 'prologue_coupe_intro',
  },

  prologue_coupe_otto: {
    id: 'prologue_coupe_otto',
    background: '/images/prolog/1сцена4p.png',
    characters: [{ id: 'otto', name: 'Отто Кляйн', position: 'left' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Массивный старик с седой щетиной. Его военная выправка выдает в нем бывшего солдата, а тяжелый взгляд прикован к окну, за которым мелькают тени.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Голос Отто звучит подобно треску сухого дерева.',
      },
      {
        speaker: 'Отто Кляйн',
        characterId: 'otto',
        text: 'Стейки, ванны... Вы как дети, честное слово.',
      },
      {
        speaker: 'Отто Кляйн',
        characterId: 'otto',
        text: 'В Фрайбурге есть FJR, есть ОРДНУНГ, и есть комендантский час. Всё, что мне нужно — это кабак, где не разбавляют шнапс.',
      },
      {
        speaker: 'Отто Кляйн',
        characterId: 'otto',
        text: 'Я хочу выпить. Так, чтобы внутри всё выжгло. Чтобы этот гул в голове заткнулся хотя бы на пару часов. А потом пойду в вербовочный пункт. "Железная леди" платит тем, кто умеет держать строй.',
      },
    ],
    nextScene: 'prologue_coupe_exit',
  },

  prologue_coupe_exit: {
    id: 'prologue_coupe_exit',
    background: COUPE_BACKGROUND,
    characters: [{ id: 'bruno', name: 'Бруно Вебер', position: 'left' }],
    dialogue: [
      {
        speaker: 'Бруно Вебер',
        text: 'Ну, каждому своё. Главное — мы почти доехали. Дальше — проще. Ладно, пойду спрошу у контролёра почему мы еле плетёмся.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Бруно выходит из купе. Тебе тоже становится тесно. Хочется уединиться, подумать.',
      },
    ],
    nextScene: 'prologue_tambour_arrival',
  },

  // ============================================================================
  // STAGE 2: THE TAMBOUR (Выбор пути)
  // ============================================================================

  prologue_tambour_arrival: {
    id: 'prologue_tambour_arrival',
    background: TAMBOUR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Внутренний голос',
        text: '«Пора. Ганс сказал, связной будет на платформе. Но сначала — успокоить нервы.»',
      },
    ],
    choices: [
      {
        id: 'prologue_choice_cards',
        text: 'Достать потрёпанную колоду карт (Психика / Азарт).',
        nextScene: 'prologue_tambour_cards',
        effects: { addFlags: ['prologue_cards'] },
      },
      {
        id: 'prologue_choice_knife',
        text: 'Вытащить армейский нож (Сила / Бой).',
        nextScene: 'prologue_tambour_knife',
        effects: { addFlags: ['prologue_knife'] },
      },
      {
        id: 'prologue_choice_smoke',
        text: 'Прикурить последнюю сигарету (Улица / Осторожность).',
        nextScene: 'prologue_tambour_smoke',
        effects: {
          addFlags: ['prologue_smoke'],
          immediate: [
            // +1 Разум (интерпретируем как +1 к ключевому навыку группы mind: logic)
            { type: 'skill_boost', data: { skillId: 'logic', amount: 1 } },
            // +2 Анализ
            { type: 'skill_boost', data: { skillId: 'analysis', amount: 2 } },
          ],
        },
      },
    ],
  },

  // --- PATH: KNIFE ---
  prologue_tambour_knife: {
    id: 'prologue_tambour_knife',
    background: TRAIN_KNIFE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Тяжелая рукоять привычно ложится в ладонь. Ты балансируешь нож, наслаждаясь идеальным равновесием стали.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вдруг по потолку начинает что-то вибрировать и скрести. Скрежет металла о хитин.',
      },
      {
        speaker: 'Рассказчик',
        background: '/images/oknorazbil.png',
        text: 'Окно тамбура разлетается вдребезги! Жуткие конечности, фасеточные глаза, нос, готовый выстрелить ядом!',
      },
    ],
    choices: [
      {
        id: 'prologue_knife_reaction',
        text: 'Метнуть нож прямо в глаз твари!',
        nextScene: 'prologue_tambour_knife_fight',
      },
    ],
  },

  prologue_tambour_knife_fight: {
    id: 'prologue_tambour_knife_fight',
    background: '/images/oknorazbil.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Лезвие входит точно в цель. Тварь визжит! Ты добиваешь её мощным ударом ноги, отправляя в полёт прочь из поезда.',
      },
    ],
    choices: [
      {
        id: 'prologue_knife_post_fight',
        text: 'Отдышаться.',
        nextScene: 'prologue_conductor_enter',
        effects: { addFlags: ['prologue_monster_killed_solo'] }
      }
    ]
  },

  // --- PATH: CARDS ---
  prologue_tambour_cards: {
    id: 'prologue_tambour_cards',
    background: TRAIN_CARDS_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Карты мелькают в руках. Ты показываешь невидимой публике трюк с исчезновением Туза.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вдруг по потолку начинает что-то вибрировать. Стекло тамбура взрывается осколками!',
      },
      {
        speaker: 'Рассказчик',
        background: '/images/oknorazbil.png',
        text: 'Чудовище врывается внутрь, готовясь к атаке.',
      },
    ],
    choices: [
      {
        id: 'prologue_cards_reaction',
        text: 'Фокус "Исчезающий свет" (Фонарик из рукава).',
        nextScene: 'prologue_tambour_cards_fight',
      },
    ],
  },

  prologue_tambour_cards_fight: {
    id: 'prologue_tambour_cards_fight',
    background: '/images/oknorazbil.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Резкое движение — и в руке вспыхивает фонарь. Луч бьёт прямо в чувствительные глаза твари. Дезориентация мгновенная!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты используешь момент и выпинываешь ослепленного монстра наружу.',
      }
    ],
    choices: [
      {
        id: 'prologue_cards_post_fight',
        text: 'Спрятать фонарик.',
        nextScene: 'prologue_conductor_enter',
        effects: { addFlags: ['prologue_monster_blinded'] }
      }
    ]
  },

  // --- PATH: SMOKE ---
  prologue_tambour_smoke: {
    id: 'prologue_tambour_smoke',
    background: TRAIN_CIGAR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Дым медленно поднимается к потолку. Ты внимательно следишь за тенями за окном.',
      },
      {
        speaker: 'ЛОГИКА',
        characterId: 'logic',
        text: 'Где-то в соседнем проходе скрипит дверь. Слишком уверенно. Это не пассажир — это Проводник.',
      },
      {
        speaker: 'АНАЛИЗ',
        characterId: 'analysis',
        text: 'Постукивания сверху. По крыше. Ритмично. Кто-то движется над тамбуром.',
      },
      {
        speaker: 'Рассказчик',
        background: '/images/oknorazbil.png',
        text: 'Твоё чутьё вопит об опасности за секунду до удара. Стекло лопается!',
      },
      {
        speaker: 'Рассказчик',
        background: '/images/oknorazbil.png',
        text: 'Существо раздувает ноздри, готовясь плюнуть кислотой!',
      },
    ],
    choices: [
      {
        id: 'prologue_smoke_reaction',
        text: 'Бросить сигарету, сбивая прицел!',
        nextScene: 'prologue_tambour_smoke_fight',
      },
      {
        id: 'prologue_smoke_grab_trunk',
        text: 'Схватить за хобот!',
        nextScene: 'prologue_tambour_smoke_grab',
      },
      {
        id: 'prologue_smoke_escape',
        text: 'Попытаться сбежать.',
        nextScene: 'prologue_tambour_smoke_escape',
        effects: {
          addFlags: ['prologue_acid_burn'],
          immediate: [{ type: 'hp_delta', data: { amount: -5 } }],
        },
      },
    ],
  },

  prologue_tambour_smoke_grab: {
    id: 'prologue_tambour_smoke_grab',
    background: '/images/oknorazbil.png',
    characters: [{ id: 'conductor', name: 'Проводник', position: 'right' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты хватаешь существо за хобот и, напрягаясь всем телом, разворачиваешь его в сторону.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Едкая жижа ударяет в стену и начинает шипеть, проедая металл.',
      },
      {
        speaker: 'Рассказчик',
        text: 'В этот момент дверь распахивается — в тамбур влетает Проводник.',
      },
      {
        speaker: 'Герой',
        text: 'ФОНАРЬ!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Проводник включает прожектор, ослепляя тварь. Ты ловишь момент и ударом ноги отправляешь её прочь — в ночь за окном.',
      },
    ],
    nextScene: 'prologue_conductor_dialogue_plan',
  },

  prologue_tambour_smoke_escape: {
    id: 'prologue_tambour_smoke_escape',
    background: '/images/oknorazbil.png',
    characters: [{ id: 'conductor', name: 'Проводник', position: 'right' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты ловко распахиваешь дверь и просачиваешься в проход.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Но в судорожной попытке захлопнуть её — едкая жижа, выпущенная тварью, пролетает в щель и попадает тебе в шею.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ощущение — как раскалённые капли металла. Дыхание сбивается, глаза слезятся.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Дверь распахивается вновь — Проводник уже здесь. Ты, стиснув зубы, киваешь на тамбур.',
      },
      {
        speaker: 'Герой',
        text: 'ФОНАРЬ!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Яркий луч прожектора ослепляет тварь. Проводник держит свет, а ты отталкиваешь её прочь ударом ноги.',
      },
    ],
    nextScene: 'prologue_conductor_dialogue_plan',
  },

  prologue_tambour_smoke_fight: {
    id: 'prologue_tambour_smoke_fight',
    background: '/images/oknorazbil.png',
    characters: [{ id: 'conductor', name: 'Проводник', position: 'right' }],
    dialogue: [
      {
        speaker: 'Герой',
        text: 'ФОНАРЬ!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Тлеющий бычок летит в морду твари. В ту же секунду дверь распахивается — Проводник с мощным прожектором заливает тамбур светом.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Монстр, ослепленный и сбитый с толку, получает удар прикладом и вылетает в ночь.',
      }
    ],
    choices: [
      {
        id: 'prologue_smoke_post_fight',
        text: 'Кивнуть проводнику.',
        nextScene: 'prologue_conductor_dialogue_plan',
        effects: { addFlags: ['prologue_conductor_saved'] }
      }
    ]
  },


  // ============================================================================
  // STAGE 3: ESCORT & CRISIS
  // ============================================================================

  prologue_conductor_enter: {
    id: 'prologue_conductor_enter',
    background: '/images/arena/boivpoezde.png',
    characters: [{ id: 'conductor', name: 'Проводник', position: 'center' }],
    dialogue: [
      {
        speaker: 'Проводник',
        text: 'Неплохая реакция, парень! Но это только разведчик. Они сейчас везде полезут.',
      },
    ],
    choices: [
      {
        id: 'prologue_conductor_enter_next',
        text: 'Что делаем?',
        nextScene: 'prologue_conductor_dialogue_plan'
      }
    ]
  },

  prologue_conductor_dialogue_plan: {
    id: 'prologue_conductor_dialogue_plan',
    background: '/images/arena/boivpoezde.png',
    characters: [{ id: 'conductor', name: 'Проводник', position: 'center' }],
    dialogue: [
      {
        speaker: 'Проводник',
        text: 'Надо двигаться к голове поезда. Собираем всех живых в безопасных вагонах.',
      },
      {
        speaker: 'Проводник',
        text: 'И главное — не стрелять без нужды. Шум их только злит и сзывает стаю.',
      },
      {
        speaker: 'Проводник',
        text: 'Если в вагоне тихо — значит там или порядок, или уже кладбище. Пошли.',
      }
    ],
    choices: [
      {
        id: 'prologue_move_to_next_car',
        text: 'Идти в следующий вагон.',
        nextScene: 'prologue_next_car_noise',
      }
    ]
  },

  prologue_next_car_noise: {
    id: 'prologue_next_car_noise',
    background: '/images/arena/boivpoezde.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Из следующего вагона доносится грохот. Крик, звон стекла.',
      },
    ],
    choices: [
      {
        id: 'prologue_open_door_noise',
        text: 'Выбить дверь!',
        nextScene: 'prologue_find_lena',
      }
    ]
  },

  prologue_find_lena: {
    id: 'prologue_find_lena',
    background: '/images/backgrounds/NashelLeny.png',
    characters: [{ id: 'lena', name: 'Лена Рихтер', position: 'center' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Внутри хаос. Пассажиры забились в углы. Посреди вагона Лена Рихтер "колдует" над раненым. В её руке блестит хирургический зажим... или стилет?',
      },
      {
        speaker: 'Рассказчик',
        text: 'Окно разбито. В проёмах появляются новые твари. Мелкие, быстрые.',
      },
    ],
    choices: [
      {
        id: 'prologue_start_tutorial_1',
        text: 'К бою! (Учебный бой)',
        effects: {
          immediate: [{
            type: 'start_tutorial_battle',
            data: {
              returnScene: 'prologue_after_tutorial_1', // Победа
              defeatScene: 'prologue_defeat'            // Поражение (опционально)
            }
          }]
        }
      }
    ]
  },

  // ============================================================================
  // STAGE 4: BOSS AMBUSH & BRUNO
  // ============================================================================

  prologue_after_tutorial_1: {
    id: 'prologue_after_tutorial_1',
    background: '/images/backgrounds/NashelLeny.png',
    characters: [{ id: 'lena', name: 'Лена Рихтер', position: 'right' }],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        text: 'Вроде пока что отбились. Спасибо за помощь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Лена быстро перевязывает тебе царапину. Её движения точные, профессиональные. Тут вы замечаете открывающуюся дверь позади вас и готовитесь к худшему, однако в проёме появляется Отто.',
      }
    ],
    choices: [
      {
        id: 'prologue_otto_entrance',
        text: 'Обернуться.',
        nextScene: 'prologue_otto_warning',
      }
    ]
  },

  prologue_otto_warning: {
    id: 'prologue_otto_warning',
    background: '/images/backgrounds/NashelLeny.png',
    characters: [{ id: 'otto', name: 'Отто Кляйн', position: 'left' }],
    dialogue: [
      {
        speaker: 'Отто Кляйн',
        text: 'С хвоста прёт орда! Надо двигаться дальше, быстро!',
      },
      {
        speaker: 'Рассказчик',
        text: 'В этот момент стену вагона сотрясает чудовищный удар. Из соседнего тамбура выламывая дверь, вваливается Тварь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Она огромная. Хитин блестит как броня танка. Это не разведчик. Это Палач. Вы понимаете, что ситуация не на вашей стороне.',
      }
    ],
    choices: [
      {
        id: 'prologue_boss_reaction',
        text: 'Приготовиться к худшему.',
        nextScene: 'prologue_bruno_boom',
      }
    ]
  },

  prologue_bruno_boom: {
    id: 'prologue_bruno_boom',
    background: '/images/backgrounds/NashelLeny.png',
    characters: [{ id: 'bruno', name: 'Бруно Вебер', position: 'left' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: ' Монстр отбрасывает пасажиров на своём пути без промедления приближаясь к вам.',
      },
      {
        speaker: 'Бруно Вебер',
        text: 'Эй, чудовище! Лови "привет" из Зоны Гамма!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Бруно швыряет связку самодельных трубок на шею монстра. ВЗРЫВ! Вагон наполняется едким дымом.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Тварь ревёт. Ей оторвало часть щупалец, броня треснула, но она всё ещё жива. И она в ярости.',
      }
    ],
    choices: [
      {
        id: 'prologue_start_tutorial_boss',
        text: 'Добить её! (Бой с боссом)',
        effects: {
          immediate: [{
            type: 'start_tutorial_battle',
            data: {
              returnScene: 'prologue_fjr_storming', // Изменено: переход к сцене с FJR
              defeatScene: 'prologue_defeat',
              enemyKey: 'boss_train_prologue'
            }
          }]
        }
      }
    ]
  },

  // ============================================================================
  // STAGE 5: FJR DEPLOYMENT & INSPECTION
  // ============================================================================

  prologue_fjr_storming: {
    id: 'prologue_fjr_storming',
    background: '/images/prolog/PosleBoyasbossom.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Монстр повержен. Его туша еще бьется в конвульсиях, когда вагон содрогается от резкого торможения.',
      },
      {
        speaker: 'Голос из динамика',
        text: '«Фрайбург-Центральный. Конечная.»',
      },
      {
        speaker: 'Рассказчик',
        text: 'Двери тамбура вылетают с грохотом. В вагон врывается штурмовая группа FJR в тяжёлой броне. Красные лазерные целеуказатели разрезают пороховой дым, выискивая цели.',
      },
      {
        speaker: 'Спецназ',
        text: '(Через вокодер) ОРУЖИЕ НА ПОЛ! ЛИЦОМ К СТЕНЕ!',
      },
      {
        speaker: 'Лена Рихтер',
        text: 'Здесь раненые! Им нужна срочная помощь!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Лена высоко поднимает руки, показывая медицинский патч на рукаве. Её голос звучит твёрдо, перекрывая шум.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Бруно, сохраняя ледяное спокойствие, медленно опускает руки, незаметно скрывая самодельную бомбу в глубине широкого рукава.',
      },
    ],
    choices: [
      {
        id: 'prologue_fjr_surrender',
        text: 'Поднять руки.',
        nextScene: 'prologue_fjr_inspection',
      },
    ],
  },

  prologue_fjr_inspection: {
    id: 'prologue_fjr_inspection',
    background: '/images/prolog/PosleBoyasbossom.png',
    characters: [
      { id: 'fjr_commander', name: 'Командир FJR', position: 'center' }
    ],
    dialogue: [
      {
        speaker: 'Командир FJR',
        text: 'Продолжать зачистку поезда! (После отданой команды, он смотрит на останки монстра, потом на вас) Вам дьявольски повезло .',
      },
      {
        speaker: 'Командир FJR',
        text: 'Медики — осмотреть раненых. Остальные — на выход, живо!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вас грубо подхватывают под руки и выталкивают на перрон. Свежий, холодный воздух обдаёт лицо, рассветные лучи освещают людей на перроне.',
      },
    ],
    choices: [
      {
        id: 'prologue_to_registration',
        text: 'Сойти на перрон.',
        nextScene: 'freiburg_platform_gustav',
        effects: {
          addFlags: ['arrived_at_freiburg', 'prologue_complete', 'survived_train_crash'],
        },
      },
    ],
  },

  prologue_defeat: {
    id: 'prologue_defeat',
    background: '/images/prolog/PosleBoyasbossom.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Тьма смыкается. Твой путь заканчивается здесь, в грязном тамбуре поезда, так и не доехавшего до мечты.',
      }
    ],
    choices: [
      {
        id: 'try_again',
        text: 'Попробовать снова',
        nextScene: 'prologue_awakening' // Или рестарт боя
      }
    ]
  }

}
