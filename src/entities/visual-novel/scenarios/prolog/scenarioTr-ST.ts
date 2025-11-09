import type { Scene } from '../model/types'

/**
 * Сценарии визуальной новеллы для пролога игры
 *
 * Особенности пролога для Рационалиста:
 * - МЫСЛЬ (4): ЛОГИКА, ТЕХНОФИЛ, ЭНЦИКЛОПЕДИЯ
 * - ТЕЛО (2): РЕФЛЕКСЫ, ВОСПРИЯТИЕ
 * - ПСИХЕ (1): ИНТУИЦИЯ (слабый голос)
 * - СОЦИУМ (1): АВТОРИТЕТ, ЭМПАТИЯ (почти не работают)
 */
export const scenarios: Record<string, Scene> = {
  // =====================================
  // ПРОЛОГ: ПЕРЕПИСАННЫЕ СЦЕНЫ
  // =====================================

  prologue_start: {
    id: 'prologue_start',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Тамбур. Ржавчина. Ритмичный перестук. Редкие лучи солнца пробиваются сквозь мутное окно.'
      },
      {
        speaker: 'Рассказчик',
        text: 'За стеклом проносятся голые силуэты деревьев. В руке — почти пустая пачка сигарет, и лишь одна сиротливо перекатывается внутри под вибрацию состава.'
      }
    ],
    choices: [
      {
        id: 'look_window',
        text: 'Посмотреть в окно.',
        nextScene: 'prologue_look_window'
      },
      {
        id: 'get_cigarette',
        text: 'Достать сигарету.',
        nextScene: 'prologue_get_cigarette'
      }
    ]
  },

  prologue_look_window: {
    id: 'prologue_look_window',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы прижимаетесь лбом к холодному стеклу. Серые деревья и пустые поля. Резкий контраст с бурым небом, подсвеченным восходящим солнцем. Мёртвые Земли.'
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Ничего не движется. Ни птиц. Ни зверей. Даже ветер, кажется, умер здесь.',
        emotion: { primary: 'neutral', intensity: 70 }
      }
    ],
    choices: [
      {
        id: 'return_from_window',
        text: 'Отвернуться от окна.',
        nextScene: 'prologue_start_return'
      }
    ]
  },

  prologue_start_return: {
    id: 'prologue_start_return',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Хватит самокопаний. Пачка сигарет в руке почти пуста. Лишь одна сиротливо перекатывается внутри.'
      }
    ],
    choices: [
      {
        id: 'get_cigarette_after_window',
        text: 'Достать её.',
        nextScene: 'prologue_get_cigarette'
      }
    ]
  },

  prologue_get_cigarette: {
    id: 'prologue_get_cigarette',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы вытряхиваете из пачки последнюю сигарету. Фильтр потемнел от влаги. Она зажата между ваших пальцев.'
      },
      {
        speaker: 'Рассказчик',
        text: 'Теперь — огонь.'
      }
    ],
    choices: [
      {
        id: 'search_pockets_fire',
        text: 'Поискать зажигалку в карманах.',
        nextScene: 'prologue_check_pockets'
      }
    ]
  },

  prologue_check_pockets: {
    id: 'prologue_check_pockets',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ваша рука хлопает по карманам куртки. В одном — бумажник. Внутри удостоверение курьера на ваше имя и несколько мятых энергокредитов.'
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Этого не хватит и на трое суток во Фрайбурге. Первый же заработок — критически важен.',
        emotion: { primary: 'determined', intensity: 80 }
      },
      {
        speaker: 'Рассказчик',
        text: 'В другом — ржавый мультитул. Зажигалки нет. Рука машинально проскальзывает глубже, нащупывая шов на подкладке. Потайной карман. Там... что-то твёрдое. Тяжёлое.'
      },
      {
        speaker: 'Рассказчик',
        text: 'Посылка.'
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: '(Шепот становится громче) СПРЯТАНО! ЗНАЧИТ ЦЕННОЕ! ЗНАЧИТ ОПАСНОЕ! ЗАЧЕМ ТЫ ВООБЩЕ ЭТО ВЗЯЛ?!',
        emotion: { primary: 'worried', intensity: 75 }
      }
    ],
    choices: [
      {
        id: 'examine_package',
        text: 'Внимательно осмотреть упаковку.',
        nextScene: 'prologue_examine_package',
        effects: {
          addFlags: ['has_package']
        }
      },
      {
        id: 'remember_order',
        text: 'Попытаться вспомнить, как ты получил этот заказ.',
        nextScene: 'prologue_memory_order'
      }
    ]
  },

  prologue_memory_order: {
    id: 'prologue_memory_order',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Воспоминание. Нечёткое. Запах озона и дорогих сигар. Полумрак. Голос без лица.'
      },
      {
        speaker: 'Незнакомец',
        text: '«Никаких вопросов. Никаких задержек. Доставьте. Оплата по прибытии будет... щедрой. И не вскрывать. Ни в коем случае».',
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '(Глухо) Он... спокоен? Нет. Под спокойствием что-то ещё. Холод. Расчёт. Я не могу прочесть его... Стена.',
        emotion: { primary: 'confused', intensity: 35 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Воспоминание тает. Вы снова в поезде. Посылка в руке кажется ещё тяжелее.'
      }
    ],
    choices: [
      {
        id: 'examine_package_after_memory',
        text: 'Теперь осмотреть эту чёртову вещь.',
        nextScene: 'prologue_examine_package',
        effects: {
          addFlags: ['remembered_order']
        }
      }
    ]
  },

  prologue_examine_package: {
    id: 'prologue_examine_package',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы вертите в руках тяжёлый металлический портсигар. Он обёрнут чёрной шёлковой лентой. Место узла залито тёмно-синим воском. Печать.'
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Вес... не сходится. Слишком тяжёлый для простого портсигара. Внутри что-то плотное и, вероятно, экранированное.',
        emotion: { primary: 'neutral', intensity: 70 }
      },
      {
        speaker: 'ИНТУИЦИЯ',
        text: '(Едва слышный шепот) ...холод... нет, тепло? Оно не живое... но и не мертвое...',
        emotion: { primary: 'confused', intensity: 30 }
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Восковая печать? Анахронизм. Умышленная маскировка под старину. Зачем скрывать технологическую природу груза?',
        emotion: { primary: 'excited', intensity: 75 }
      },
      {
        speaker: 'Рассказчик',
        text: 'На печати выдавлены два латинских слова.'
      }
    ],
    choices: [
      {
        id: 'read_seal',
        text: 'Попытаться прочесть надпись.',
        nextScene: 'prologue_read_seal'
      },
      {
        id: 'shake_guess_logic',
        text: '[ЛОГИКА] Потрясти портсигар, пытаясь угадать содержимое (Сложность 7)',
        presentation: {
          color: 'skill',
          icon: '🧠',
          tooltip: 'Требуется ЛОГИКА 3+'
        },
        availability: {
          skillCheck: {
            skill: 'logic',
            difficulty: 7,
            successText: 'Логическая цепочка выстроена!',
            failureText: 'Переменных слишком много...'
          }
        },
        effects: {
          onSuccess: { nextScene: 'prologue_deduce_success' },
          onFailure: { nextScene: 'prologue_deduce_failure' }
        }
      },
      {
        id: 'pry_seal_tech',
        text: '[ТЕХНОФИЛ] Попытаться поддеть печать мультитулом (Сложность 9)',
        presentation: {
          color: 'skill',
          icon: '🔧',
          tooltip: 'Требуется ТЕХНОФИЛ 3+'
        },
        availability: {
          skillCheck: {
            skill: 'technophile',
            difficulty: 9,
            successText: 'Печать аккуратно снята!',
            failureText: 'Воск раскрошился...'
          }
        },
        effects: {
          onSuccess: { nextScene: 'prologue_open_package_success' },
          onFailure: { nextScene: 'prologue_open_package_failure' }
        }
      }
    ]
  },

  prologue_read_seal: {
    id: 'prologue_read_seal',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы подносите печать ближе к тусклому свету из окна. "Acta, non verba".'
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Древняя латынь. "Дела, а не слова". Классическая сентенция.',
        emotion: { primary: 'neutral', intensity: 70 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Дела, а не слова. Заказчик был немногословен. И щедр. Билет до Фрайбурга — целое состояние.'
      }
    ],
    choices: [
      {
        id: 'return_to_examine',
        text: 'Вернуться к осмотру.',
        nextScene: 'prologue_examine_package',
        effects: {
          addFlags: ['examined_seal']
        }
      }
    ]
  },

  prologue_deduce_success: {
    id: 'prologue_deduce_success',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'ЛОГИКА',
        text: '[КРИТИЧЕСКИЙ УСПЕХ ЛОГИКИ] Если груз тяжёлый и экранированный, он либо радиоактивен (нелогично для курьера), либо содержит высокотехнологичную электронику, которую нельзя сканировать. "Дела, а не слова" – это отказ от пафоса и бюрократии FJR. Заказчик, вероятно, связан с **Артисанами** или **Синтезом**.',
        emotion: { primary: 'determined', intensity: 85 }
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: 'Экранированная электроника! Это может быть прототип. Если вскрыть его, мы потеряем гарантию, но получим доступ к неизвестной технологии!',
        emotion: { primary: 'excited', intensity: 75 }
      }
    ],
    choices: [
      {
        id: 'continue_journey',
        text: 'Продолжить путешествие с нераспечатанной посылкой',
        nextScene: 'prologue_train_stop'
      },
      {
        id: 'try_open',
        text: 'Попробовать вскрыть печать',
        nextScene: 'prologue_examine_package'
      }
    ]
  },

  prologue_deduce_failure: {
    id: 'prologue_deduce_failure',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Провал)] Переменных слишком много. Это может быть что угодно: от золотого слитка до сжатого газа. Анализ невозможен без вскрытия.',
        emotion: { primary: 'sad', intensity: 50 }
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Блестяще. Всю жизнь учился, а портсигар потрясти не можешь. Возвращайся к своим играм в детектива.',
        emotion: { primary: 'sad', intensity: 40 }
      }
    ],
    choices: [
      {
        id: 'return_after_fail',
        text: 'Попробовать что-то другое.',
        nextScene: 'prologue_examine_package'
      }
    ]
  },

  prologue_open_package_success: {
    id: 'prologue_open_package_success',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Печать аккуратно снята! Вы разворачиваете шёлковую ленту. Внутри — небольшой, но тяжелый металлический контейнер с матовым покрытием.'
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: 'Потрясающе! Это не просто контейнер — это высокотехнологичный сейф с биометрическим замком. Кто-то очень не хочет, чтобы это попало не в те руки.',
        emotion: { primary: 'excited', intensity: 85 }
      }
    ],
    choices: [
      {
        id: 'examine_container',
        text: 'Осмотреть контейнер внимательнее.',
        nextScene: 'prologue_container_examination'
      },
      {
        id: 'close_and_forget',
        text: 'Быстро закрыть и сделать вид, что ничего не было.',
        nextScene: 'prologue_train_stop',
        effects: {
          addFlags: ['opened_and_closed']
        }
      }
    ]
  },

  prologue_open_package_failure: {
    id: 'prologue_open_package_failure',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Воск крошится под мультитулом. Печать безнадёжно испорчена. Лента обрывается неровно.'
      },
      {
        speaker: 'ЛОГИКА',
        text: 'Доказательства взлома теперь очевидны. Если заказчик заметит — это конец контракта.',
        emotion: { primary: 'neutral', intensity: 70 }
      }
    ],
    choices: [
      {
        id: 'continue_anyway',
        text: 'Продолжить вскрытие.',
        nextScene: 'prologue_container_examination'
      },
      {
        id: 'try_repair',
        text: '[ТЕХНОФИЛ] Попытаться починить печать (Сложность 12)',
        presentation: {
          color: 'skill',
          icon: '🔧',
          tooltip: 'Требуется ТЕХНОФИЛ 4+'
        },
        availability: {
          skillCheck: {
            skill: 'technophile',
            difficulty: 12,
            successText: 'Печать выглядит почти как новая!',
            failureText: 'Стало только хуже...'
          }
        },
        effects: {
          onSuccess: {
            nextScene: 'prologue_train_stop'
          },
          onFailure: { nextScene: 'prologue_container_examination' },
          addFlags: ['seal_repaired']
        }
      }
    ]
  },

  prologue_container_examination: {
    id: 'prologue_container_examination',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы осторожно открываете контейнер. Внутри — небольшой чип или устройство размером с монету. Оно пульсирует слабым синим светом.'
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Это... нейрочип? Или что-то вроде интерфейса ИИ. Но почему такая секретность? Это может стоить целое состояние на чёрном рынке!',
        emotion: { primary: 'excited', intensity: 90 }
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'Оно живое! Оно смотрит на нас! Закрой! ЗАКРОЙ СЕЙЧАС ЖЕ!',
        emotion: { primary: 'worried', intensity: 85 }
      }
    ],
    choices: [
      {
        id: 'take_chip',
        text: 'Взять чип с собой.',
        nextScene: 'prologue_train_stop',
        effects: {
          addFlags: ['has_neurochip', 'betrayed_employer']
        }
      },
      {
        id: 'leave_in_container',
        text: 'Оставить в контейнере и закрыть.',
        nextScene: 'prologue_train_stop',
        effects: {
          addFlags: ['investigated_only']
        }
      }
    ]
  },

  prologue_train_stop: {
    id: 'prologue_train_stop',
    background: '/public/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Резкий, оглушительный визг металла о металл. Весь вагон дёргается, сбрасывая вас с ног.'
      },
      {
        speaker: 'РЕФЛЕКСЫ',
        text: '[ПАРАМЕТР: ТЕЛО/РЕФЛЕКСЫ (Успех)] Руки инстинктивно находят опору. Ноги — равновесие. Вы устояли.',
        emotion: { primary: 'neutral', intensity: 75 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Скрежет затихает. За окном — массивное здание вокзала. Приехали.'
      }
    ],
    choices: [
      {
        id: 'exit_train',
        text: 'Выйти на платформу.',
        nextScene: 'arrival_platform',
      }
    ]
  },

  // =====================================
  // ГЛАВА 1: ПРИБЫТИЕ В ФРАЙБУРГ
  // =====================================

  arrival_platform: {
    id: 'arrival_platform',
    background: '/public/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Двери с шипением разъезжаются. Вас бьёт по лицу стена звуков и запахов.'
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Жареный лук. Невозможно! Запах настоящей, горячей еды, а не протеиновых батончиков и чёрствых галет.',
        emotion: { primary: 'surprised', intensity: 75 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Гул. Живой. Скрежет металла, крики грузчиков, шипение пара. После недель в тишине Мёртвых Земель, станция Фрайбурга — это лихорадочно бьющееся сердце цивилизации.'
      },
      {
        speaker: 'РЕФЛЕКСЫ',
        text: '[ПАРАМЕТР: ТЕЛО/РЕФЛЕКСЫ (Успех)] Слишком много движения. Слева. Справа. Мозг успевает отследить критические траектории. Держи равновесие.',
        emotion: { primary: 'neutral', intensity: 70 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Толпа подхватывает вас и несёт. Нужно двигаться, или вас сомнут.'
      }
    ],
    choices: [
      {
        id: 'overwhelmed',
        text: 'Опешить от количества людей.',
        nextScene: 'arrival_overwhelmed'
      },
      {
        id: 'push_forward_force',
        text: '[СИЛА] Попытаться пробиться вперёд, расталкивая толпу (Сложность 12)',
        presentation: {
          color: 'negative',
          icon: '💪',
          tooltip: 'Слишком сложно для вашей СИЛЫ'
        },
        availability: {
          skillCheck: {
            skill: 'strength',
            difficulty: 12,
            failureText: 'Ваш толчок похож на прикосновение комара...',
          }
        },
        effects: {
          onSuccess: { nextScene: 'arrival_push_forward_success' },
          onFailure: { nextScene: 'arrival_push_forward_failure_rationalist' }
        }
      },
      {
        id: 'observe_logic',
        text: '[ЛОГИКА] Отступить и попытаться понять структуру движения.',
        nextScene: 'arrival_observe_logic'
      }
    ]
  },

  arrival_push_forward_failure_rationalist: {
    id: 'arrival_push_forward_failure_rationalist',
    background: '/public/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы пытаетесь грубо растолкать толпу, но ваш тощий корпус едва ощущается. Вы натыкаетесь на плечо грузчика, который смотрит на вас как на муху. «Потерялся, Пробирка?» — усмехается он. Вам приходится извиниться и отойти.'
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '(Тонкая, дрожащая нота) Это... унизительно. Мы должны были настоять на своём.',
        emotion: { primary: 'sad', intensity: 40 }
      },
      {
        speaker: 'ЛОГИКА',
        text: 'Провал. Энергия потрачена неэффективно. Всегда используй минимальное достаточное усилие. Теперь мы привлекли ненужное внимание.',
        emotion: { primary: 'neutral', intensity: 65 }
      }
    ],
    choices: [
      {
        id: 'continue_to_control',
        text: 'Проглотить обиду и двигаться к зоне досмотра.',
        nextScene: 'arrival_control'
      }
    ]
  },

  arrival_observe_logic: {
    id: 'arrival_observe_logic',
    background: '/public/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Нужно понять правила этого места, прежде чем делать ход. Вы отступаете к стене, становясь наблюдателем.'
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Хаос только кажется хаосом. Это работающий механизм. Прибывшие — к центру. Грузчики — вдоль путей. Патрули — по периметру. Основная масса избегает зоны досмотра FJR. Нам нужно двигаться по пути наименьшего сопротивления.',
        emotion: { primary: 'determined', intensity: 85 }
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Все суетятся, как опарыши в банке. Конечная цель одна — быть съеденным. Вопрос лишь в том, кем и когда.',
        emotion: { primary: 'sad', intensity: 50 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Анализ завершён. Вы видите оптимальный маршрут к зоне досмотра — туда, куда направляется меньше всего людей.'
      }
    ],
    choices: [
      {
        id: 'proceed_logically',
        text: 'Двигаться к зоне досмотра.',
        nextScene: 'arrival_control',
        effects: {
          addFlags: ['gained_situational_awareness']
        }
      }
    ]
  },

  arrival_overwhelmed: {
    id: 'arrival_overwhelmed',
    background: '/public/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'На мгновение вы замираете. Слишком много... всего. Слишком много жизни.'
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '(Тихо) Столько людей... столько мыслей... я... я ничего не слышу...',
        emotion: { primary: 'confused', intensity: 25 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Грубый толчок в спину возвращает вас в реальность. Впереди — зона досмотра. Единственный путь.'
      }
    ],
    choices: [
      {
        id: 'continue',
        text: 'Продолжить.',
        nextScene: 'arrival_control'
      }
    ]
  },

  arrival_push_forward_success: {
    id: 'arrival_push_forward_success',
    background: '/public/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы работаете плечами, находя бреши в потоке людей. Пара недовольных взглядов, но вы уверенно продвигаетесь вперёд, к единственному выходу — зоне досмотра FJR.'
      }
    ],
    choices: [
      {
        id: 'continue',
        text: 'Продолжить.',
        nextScene: 'arrival_control'
      }
    ]
  },

  arrival_control: {
    id: 'arrival_control',
    background: '/public/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'center',
        sprite: '/public/images/characters/gustav.png',
        emotion: { primary: 'neutral', intensity: 70 }
      }
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ваш путь заканчивается у стола досмотра FJR. За ним сидит уставший мужчина в форме с нашивкой «Густав». Его взгляд скользит по вам без всякого интереса.'
      },
      {
        speaker: 'Контролёр Густав',
        text: 'Следующий. Вещи на стол. Удостоверение наготове.',
        characterId: 'gustav',
        emotion: { primary: 'determined', intensity: 60 }
      }
    ],
    choices: [
      {
        id: 'comply',
        text: 'Подойти и положить вещи на стол.',
        nextScene: 'gustav_inspection_start'
      },
      {
        id: 'authority_check',
        text: '[АВТОРИТЕТ] Уверенно спросить, в чём дело.',
        presentation: {
          color: 'bold',
          icon: '👑',
          tooltip: 'Попытка доминировать над представителем власти...'
        },
        nextScene: 'gustav_authority_fail'
      }
    ]
  },

  gustav_inspection_start: {
    id: 'gustav_inspection_start',
    background: '/public/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'center',
        sprite: '/public/images/characters/gustav.png',
        emotion: { primary: 'neutral', intensity: 65 }
      }
    ],
    dialogue: [
      {
        speaker: 'Контролёр Густав',
        text: 'Что везёте?',
        characterId: 'gustav',
        emotion: { primary: 'neutral', intensity: 60 }
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: '(Кричит) Как быть?! Заберут же! Они знают, что это ценно!',
        emotion: { primary: 'worried', intensity: 80 }
      },
      {
        speaker: 'ЛОГИКА',
        text: '(Спокойно) Нервозность — худшая тактика. Сохраняй самообладание. Играй по правилам, пока не докажешь, что они нарушены.',
        emotion: { primary: 'neutral', intensity: 85 }
      }
    ],
    choices: [
      {
        id: 'honest_answer',
        text: '[ЛОГИКА] Честно: "Понятия не имею. Я просто курьер. Доставляю по контракту." (Сложность 5)',
        presentation: {
          color: 'skill',
          icon: '🧠',
          tooltip: 'Требуется ЛОГИКА 3+'
        },
        availability: {
          skillCheck: {
            skill: 'logic',
            difficulty: 5,
            successText: 'Густав принимает рациональное объяснение',
            failureText: 'Логика даёт сбой...'
          }
        },
        effects: {
          onSuccess: { nextScene: 'gustav_lets_pass' },
          onFailure: { nextScene: 'gustav_inspects_anyway' }
        }
      },
      {
        id: 'deflect_authority',
        text: '[АВТОРИТЕТ] С вызовом: "А у вас есть ордер на обыск личных вещей?" (Сложность 14)',
        presentation: {
          color: 'bold',
          icon: '👑',
          tooltip: 'Почти невозможно с вашим слабым авторитетом'
        },
        availability: {
          skillCheck: {
            skill: 'authority',
            difficulty: 14,
            failureText: 'Вас легко проигнорировали...'
          }
        },
        effects: {
          onFailure: { nextScene: 'gustav_authority_fail' }
        }
      },
      {
        id: 'empathy_plea',
        text: '[ЭМПАТИЯ] Разжалобить: "Это мой единственный шанс выбраться из нищеты..." (Сложность 12)',
        presentation: {
          color: 'cautious',
          icon: '💙',
          tooltip: 'Сложно с вашей слабой эмпатией'
        },
        availability: {
          skillCheck: {
            skill: 'empathy',
            difficulty: 12,
            failureText: 'Он остался равнодушен...'
          }
        },
        effects: {
          onFailure: { nextScene: 'gustav_empathy_fail' }
        }
      }
    ]
  },

  gustav_lets_pass: {
    id: 'gustav_lets_pass',
    background: '/public/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'center',
        sprite: '/public/images/characters/gustav.png',
        emotion: { primary: 'neutral', intensity: 55 }
      }
    ],
    dialogue: [
      {
        speaker: 'Контролёр Густав',
        text: 'Ладно, курьер. Я не ищу проблем. Проходи.',
        characterId: 'gustav',
        emotion: { primary: 'neutral', intensity: 50 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Он машет рукой, пропуская вас дальше. Досмотр пройден.'
      }
    ],
    choices: [
      {
        id: 'exit_station',
        text: 'Выйти со станции.',
        nextScene: 'gustav_aftermath'
      }
    ]
  },

  gustav_inspects_anyway: {
    id: 'gustav_inspects_anyway',
    background: '/public/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'center',
        sprite: '/public/images/characters/gustav.png',
        emotion: { primary: 'angry', intensity: 70 }
      }
    ],
    dialogue: [
      {
        speaker: 'Контролёр Густав',
        text: 'Не имеете понятия? Это не ответ. Показывайте.',
        characterId: 'gustav',
        emotion: { primary: 'angry', intensity: 75 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Он тянется к вашим вещам. Сопротивление бесполезно.'
      }
    ],
    choices: [
      {
        id: 'show_package',
        text: 'Показать посылку.',
        nextScene: 'gustav_examines_package'
      }
    ]
  },

  gustav_examines_package: {
    id: 'gustav_examines_package',
    background: '/public/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'center',
        sprite: '/public/images/characters/gustav.png',
        emotion: { primary: 'neutral', intensity: 60 }
      }
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Густав вертит посылку в руках, хмурясь.',
        characterId: 'gustav'
      },
      {
        speaker: 'Контролёр Густав',
        text: 'Хм. Печать не тронута. Ладно, забирай свою игрушку.',
        characterId: 'gustav',
        emotion: { primary: 'neutral', intensity: 55 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Он возвращает посылку. Досмотр завершён.'
      }
    ],
    choices: [
      {
        id: 'exit_station',
        text: 'Выйти со станции.',
        nextScene: 'gustav_aftermath'
      }
    ]
  },

  gustav_aftermath: {
    id: 'gustav_aftermath',
    // Use existing background asset (station.png) to avoid missing file warning
    background: '/public/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Густав махнул рукой, отпуская вас. Вы выходите из зоны досмотра на платформу станции.'
      },
      {
        speaker: 'Рассказчик',
        text: 'Толпа, шум, запах горячей еды. После недель в поезде через Мёртвые Земли это кажется другим миром.'
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Приоритеты: Во-первых, нужно выяснить ситуацию с поездом. Когда мы сможем продолжить путь? Информационное бюро — логичное место для начала.',
        emotion: { primary: 'determined', intensity: 80 }
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] На каждой крупной станции есть информационное бюро. Обычно это окошко с надписью "ИНФОРМАЦИЯ" и скучающим служащим за стеклом.',
        emotion: { primary: 'neutral', intensity: 70 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Решено. Первым делом — информационное бюро. Нужно узнать, что происходит с поездами.'
      }
    ],
    choices: [
      {
        id: 'open_map',
        text: 'Осмотреться и найти информационное бюро',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['arrived_at_freiburg', 'gustav_inspection_passed', 'need_info_bureau']
        }
      }
    ]
  },

  gustav_authority_fail: {
    id: 'gustav_authority_fail',
    background: '/public/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'center',
        sprite: '/public/images/characters/gustav.png',
        emotion: { primary: 'angry', intensity: 75 }
      }
    ],
    dialogue: [
      {
        speaker: 'АВТОРИТЕТ',
        text: '[ПРОВАЛ] Позор. Ваш голос прозвучал как писк. Он даже не обратил внимания.',
        emotion: { primary: 'sad', intensity: 45 }
      },
      {
        speaker: 'Контролёр Густав',
        text: 'Ордер? Мой ордер — это значок на груди. Вещи на стол, или я вызову подкрепление.',
        characterId: 'gustav',
        emotion: { primary: 'angry', intensity: 80 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Сопротивление бесполезно. Он осматривает ваши вещи.'
      }
    ],
    choices: [
      {
        id: 'show_package',
        text: 'Показать посылку.',
        nextScene: 'gustav_examines_package'
      }
    ]
  },

  gustav_empathy_fail: {
    id: 'gustav_empathy_fail',
    background: '/public/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'center',
        sprite: '/public/images/characters/gustav.png',
        emotion: { primary: 'neutral', intensity: 55 }
      }
    ],
    dialogue: [
      {
        speaker: 'ЭМПАТИЯ',
        text: '[ПРОВАЛ] Вы не смогли установить эмоциональную связь. Он вас не слышит.',
        emotion: { primary: 'sad', intensity: 40 }
      },
      {
        speaker: 'Контролёр Густав',
        text: 'У каждого тут "единственный шанс". Показывай вещи.',
        characterId: 'gustav',
        emotion: { primary: 'neutral', intensity: 60 }
      },
      {
        speaker: 'Рассказчик',
        text: 'Он осматривает ваши вещи без жалости.'
      }
    ],
    choices: [
      {
        id: 'show_package',
        text: 'Показать посылку.',
        nextScene: 'gustav_examines_package'
      }
    ]
  },

}
