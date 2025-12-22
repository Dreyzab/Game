import type { Scene } from '../../model/types'

const TRAIN_CIGAR_BACKGROUND = '/images/trainCigar.png'
const TRAIN_CARDS_BACKGROUND = '/images/trainCards.png'
const COUPE_BACKGROUND = '/images/trainCigar.png' // Placeholder for coupes
const TAMBOUR_BACKGROUND = '/images/trainCigar.png'
const CORRIDOR_BACKGROUND = '/images/trainCigar.png' // Placeholder

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
      { id: 'adele', name: 'Адель', position: 'center', emotion: { primary: 'calm' } },
      { id: 'otto', name: 'Отто Кляйн', position: 'left', emotion: { primary: 'grim' } },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Мерный, убаюкивающий стук колёс. Дребезжание ложки в пустом стакане. Тесное купе пропахло табаком и усталостью.',
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
      },
    ],
  },

  prologue_coupe_bruno: {
    id: 'prologue_coupe_bruno',
    background: COUPE_BACKGROUND,
    characters: [{ id: 'bruno', name: 'Бруно Вебер', position: 'left' }],
    dialogue: [
      {
        speaker: 'Бруно Вебер',
        text: 'Подъезжаем. Я узнаю этот дым. Промышленный Север, Зона Гамма. Там воздух на вкус как жженая резина... Хех, пахнет домом.',
      },
      {
        speaker: 'Бруно Вебер',
        text: 'Надеюсь, старина Дитер не забыл меня встретить. Он писал, что устроился у Артисанов. "Приезжай, — говорит, — Бруно, тут есть работа для тех, кто отличает детонатор от суппозитория".',
      },
    ],
    choices: [
      {
        id: 'prologue_coupe_bruno_next',
        text: 'Слушать Лену.',
        nextScene: 'prologue_coupe_lena',
      },
    ],
  },

  prologue_coupe_lena: {
    id: 'prologue_coupe_lena',
    background: COUPE_BACKGROUND,
    characters: [{ id: 'lena', name: 'Лена Рихтер', position: 'right' }],
    dialogue: [
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
    choices: [
      {
        id: 'prologue_coupe_lena_next',
        text: 'Взглянуть на Адель.',
        nextScene: 'prologue_coupe_adele',
      },
    ],
  },

  prologue_coupe_adele: {
    id: 'prologue_coupe_adele',
    background: COUPE_BACKGROUND,
    characters: [{ id: 'adele', name: 'Адель', position: 'center' }],
    dialogue: [
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
        id: 'prologue_coupe_adele_next',
        text: 'Посмотреть на Отто.',
        nextScene: 'prologue_coupe_otto',
      },
    ],
  },

  prologue_coupe_otto: {
    id: 'prologue_coupe_otto',
    background: COUPE_BACKGROUND,
    characters: [{ id: 'otto', name: 'Отто Кляйн', position: 'left' }],
    dialogue: [
      {
        speaker: 'Отто Кляйн',
        text: 'Стейки, ванны... Вы как дети, честное слово.',
      },
      {
        speaker: 'Отто Кляйн',
        text: 'В Фрайбурге есть FJR, есть ОРДНУНГ, и есть комендантский час. Всё, что мне нужно — это кабак, где не разбавляют шнапс.',
      },
      {
        speaker: 'Отто Кляйн',
        text: 'Я хочу выпить. Так, чтобы внутри всё выжгло. Чтобы этот гул в голове заткнулся хотя бы на пару часов. А потом пойду в вербовочный пункт. "Железная леди" платит тем, кто умеет держать строй.',
      },
    ],
    choices: [
      {
        id: 'prologue_coupe_finish',
        text: 'Встать и выйти.',
        nextScene: 'prologue_coupe_exit',
      },
    ],
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
    choices: [
      {
        id: 'prologue_go_to_tambour',
        text: 'Выйти в тамбур.',
        nextScene: 'prologue_tambour_arrival',
      },
    ],
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
        effects: { addFlags: ['prologue_smoke'] },
      },
    ],
  },

  // --- PATH: KNIFE ---
  prologue_tambour_knife: {
    id: 'prologue_tambour_knife',
    background: TAMBOUR_BACKGROUND,
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
    background: TAMBOUR_BACKGROUND,
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
    background: TAMBOUR_BACKGROUND,
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
        speaker: 'Рассказчик',
        text: 'Твоё чутьё вопит об опасности за секунду до удара. Стекло лопается!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Существо раздувает ноздри, готовясь плюнуть кислотой!',
      },
    ],
    choices: [
      {
        id: 'prologue_smoke_reaction',
        text: 'Бросить сигарету, сбивая прицел!',
        nextScene: 'prologue_tambour_smoke_fight',
      },
    ],
  },

  prologue_tambour_smoke_fight: {
    id: 'prologue_tambour_smoke_fight',
    background: TRAIN_CIGAR_BACKGROUND,
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
    background: TAMBOUR_BACKGROUND,
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
    background: TAMBOUR_BACKGROUND,
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
    background: CORRIDOR_BACKGROUND,
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
    background: COUPE_BACKGROUND,
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
    background: COUPE_BACKGROUND,
    characters: [{ id: 'lena', name: 'Лена Рихтер', position: 'right' }],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        text: 'Чисто... пока что. Спасибо за помощь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Лена быстро перевязывает тебе царапину. Её движения точные, профессиональные.',
      },
      {
        speaker: 'Отто Кляйн',
        text: 'Сзади — чисто! Но их там тьма!',
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
    background: COUPE_BACKGROUND,
    characters: [{ id: 'otto', name: 'Отто Кляйн', position: 'left' }],
    dialogue: [
      {
        speaker: 'Отто Кляйн',
        text: 'С хвоста прёт орда! Надо уходить, быстро!',
      },
      {
        speaker: 'Рассказчик',
        text: 'В этот момент стену вагона сотрясает чудовищный удар. Из соседнего тамбура выламывая дверь, вваливается Тварь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Она огромная. Хитин блестит как броня танка. Это не разведчик. Это Палач.',
      }
    ],
    choices: [
      {
        id: 'prologue_boss_reaction',
        text: 'Приготовиться к смерти...',
        nextScene: 'prologue_bruno_boom',
      }
    ]
  },

  prologue_bruno_boom: {
    id: 'prologue_bruno_boom',
    background: COUPE_BACKGROUND,
    characters: [{ id: 'bruno', name: 'Бруно Вебер', position: 'center' }],
    dialogue: [
      {
        speaker: 'Бруно Вебер',
        text: 'Эй, урод! Лови "привет" из Зоны Гамма!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Бруно швыряет связку самодельных трубок под ноги монстра. ВЗРЫВ! Вагон наполняется едким дымом.',
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
    background: TAMBOUR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Монстр повержен. Его туша еще бьется в конвульсиях, когда вагон содрогается от резкого торможения.',
      },
      {
        speaker: 'Голос из динамика',
        text: '«Фрайбург-Центральный. Конечная. Всем оставаться на местах! Работает FJR!»',
      },
      {
        speaker: 'Рассказчик',
        text: 'Двери тамбура вылетают с грохотом. В вагон врываются фигуры в тяжелой броне и с автоматическими винтовками. Свет тактических фонарей ослепляет.',
      },
      {
        speaker: 'Спецназ FJR',
        text: 'ОРУЖИЕ НА ПОЛ! РУКИ ЗА ГОЛОВУ! ДВИЖЕНИЕ — СТРЕЛЬБА НА ПОРАЖЕНИЕ!',
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
    background: TAMBOUR_BACKGROUND, // Или другой фон, если есть
    characters: [
      { id: 'fjr_commander', name: 'Командир FJR', position: 'center' }
    ],
    dialogue: [
      {
        speaker: 'Командир FJR',
        text: 'Чисто. Био-угроза устранена. (Смотрит на труп монстра, потом на вас) Выжившие? В этом поезде? Вам дьявольски повезло.',
      },
      {
        speaker: 'Командир FJR',
        text: 'Медики — осмотреть раненых. Остальные — на выход, живо! Регистрация беженцев в Ратуше. Не толпиться!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вас грубо, но эффективно выталкивают на перрон. Свежий, холодный воздух Фрайбурга ударяет в лицо.',
      },
    ],
    choices: [
      {
        id: 'prologue_to_registration',
        text: 'Идти к Ратуше.',
        effects: {
          addFlags: ['arrived_at_freiburg', 'prologue_complete', 'survived_train_crash'],
          immediate: [{ type: 'open_map' }], // Переход на карту, где игрок должен будет пойти в Ратушу (или авто-запуск сцены)
        },
      },
    ],
  },

  prologue_defeat: {
    id: 'prologue_defeat',
    background: TAMBOUR_BACKGROUND,
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
