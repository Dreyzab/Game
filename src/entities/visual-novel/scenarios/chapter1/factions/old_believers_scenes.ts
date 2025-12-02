import type { Scene } from '../../../model/types'

/**
 * Сценарии для фракции Староверы (Old Believers)
 * 
 * Ключевые NPC: Отец Иоанн
 * Квесты: sanctuary_blessing
 * Локация: Кафедральный собор (Мюнстер)
 */

const CATHEDRAL_BACKGROUND = '/images/backgrounds/cathedral_interior.jpg'
const FATHER_JOHANN_SPRITE = '/images/npcs/father_johann.jpg'

export const oldBelieversScenes: Record<string, Scene> = {
  // =====================================
  // ПЕРВАЯ ВСТРЕЧА С ОТЦОМ ИОАННОМ
  // =====================================

  father_johann_meeting: {
    id: 'father_johann_meeting',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Кафедральный собор встречает вас полумраком и запахом ладана. Свет свечей играет на древних витражах, создавая причудливые тени.',
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Фрайбургский Мюнстер — готический собор XIII века. Его шпиль пережил все войны. Теперь он служит убежищем для тех, кто ищет покоя.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'У алтаря стоит старик в простой рясе. Его лицо изборождено морщинами, но глаза светятся удивительной добротой.',
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Не оборачиваясь) Путник... Я слышу твои шаги. Они тяжелы. Не от груза за спиной — от груза на душе.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'ИНТУИЦИЯ',
        text: '(Шёпот) ...он знает... он чувствует...',
        emotion: { primary: 'confused', intensity: 45 },
      },
    ],
    choices: [
      {
        id: 'approach_respectfully',
        text: 'Подойти с почтением.',
        nextScene: 'johann_greeting',
      },
      {
        id: 'stay_silent',
        text: 'Молча ждать.',
        nextScene: 'johann_turns',
      },
      {
        id: 'ask_about_soul',
        text: '"Откуда вы знаете о моей душе?"',
        nextScene: 'johann_wisdom',
      },
    ],
  },

  johann_greeting: {
    id: 'johann_greeting',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы подходите, склоняя голову в знак уважения.',
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Поворачивается, его лицо озаряется мягкой улыбкой) Почтение... Редкая добродетель в наши дни. Добро пожаловать в Святилище, дитя.',
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '[ПАРАМЕТР: ГУМАНИСТЫ/ЭМПАТИЯ (Успех)] Его тепло искреннее. Он не играет роль — он живёт ею.',
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    nextScene: 'johann_introduction',
  },

  johann_turns: {
    id: 'johann_turns',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Тишина затягивается. Наконец, старик медленно поворачивается.',
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Молчание тоже ответ. Иногда — самый честный. Я отец Иоанн. А ты — ещё один потерянный, которого привело сюда течение.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    nextScene: 'johann_introduction',
  },

  johann_wisdom: {
    id: 'johann_wisdom',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Тихий смех) Знаю? Я ничего не знаю, дитя. Я лишь слушаю. Этот собор — он дышит. И он говорит мне о тех, кто входит.',
        emotion: { primary: 'happy', intensity: 55 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Акустика. Резонанс шагов отражается от стен по-разному в зависимости от веса и походки. Он научился читать эти звуки.',
        emotion: { primary: 'neutral', intensity: 75 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Или, может быть, Он подсказывает мне. Кто знает? В конце концов, вера — это принятие того, что нельзя объяснить.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    nextScene: 'johann_introduction',
  },

  johann_introduction: {
    id: 'johann_introduction',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Этот собор — убежище. Здесь мы лечим тела и души. FJR защищает стены, Артисаны чинят крыши, а мы... мы храним то, что невозможно потрогать.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Здесь всегда найдётся место для усталого путника. Тёплый суп, крыша над головой, и... молитва, если душа того просит.',
        emotion: { primary: 'happy', intensity: 55 },
      },
      {
        speaker: 'СОСТРАДАНИЕ',
        text: '(Тепло) Он предлагает помощь без условий. Это... редко.',
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'ask_about_beliefs',
        text: '"Кто такие Староверы?"',
        nextScene: 'johann_beliefs',
      },
      {
        id: 'ask_about_help',
        text: '"Могу ли я чем-то помочь?"',
        nextScene: 'johann_quest_offer',
      },
      {
        id: 'ask_about_blessing',
        text: '"Вы упоминали благословение..."',
        nextScene: 'johann_blessing_info',
      },
      {
        id: 'thank_and_leave',
        text: '"Благодарю. Мне пора."',
        nextScene: 'johann_farewell',
        effects: {
          flags: [{ key: 'met_father_johann', value: true }],
        },
      },
    ],
  },

  johann_beliefs: {
    id: 'johann_beliefs',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'determined', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Нас называют "Староверами", хотя мы не держимся за старое ради старого. Мы верим в то, что было до катастрофы. В человечность.',
        emotion: { primary: 'determined', intensity: 65 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'FJR говорит о порядке. Синтез — о прогрессе. Анархисты — о свободе. А мы... мы говорим о милосердии.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Староверы — не религиозные фанатики. Они сохранители. Их архивы содержат знания, которые иначе были бы утеряны.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Когда мир рушится, легко потерять себя. Мы помогаем людям оставаться людьми. Это наша миссия.',
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'back_to_talk',
        text: 'Продолжить разговор.',
        nextScene: 'johann_introduction',
      },
    ],
  },

  johann_quest_offer: {
    id: 'johann_quest_offer',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Глаза светлеют) Помочь? Какое благое намерение. Да, есть кое-что.',
        emotion: { primary: 'happy', intensity: 65 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Скоро мы проводим церемонию благословения для новоприбывших. Традиция, которую мы бережём. Но для неё нужны свечи — особые, освящённые.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Торговцы на рынке иногда имеют их в запасе. Пять свечей — не так много, но для нас это значит многое.',
        emotion: { primary: 'determined', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'accept_quest',
        text: '"Я принесу свечи."',
        nextScene: 'johann_quest_accepted',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'sanctuary_blessing', action: 'start' } },
          ],
          flags: [
            { key: 'sanctuary_blessing_active', value: true },
            { key: 'met_father_johann', value: true },
          ],
        },
      },
      {
        id: 'ask_reward',
        text: '"Что я получу взамен?"',
        nextScene: 'johann_reward_question',
      },
      {
        id: 'decline',
        text: '"Извините, но у меня свои дела."',
        nextScene: 'johann_decline',
      },
    ],
  },

  johann_reward_question: {
    id: 'johann_reward_question',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Вздыхает) Материальные награды... Мир приучил нас искать выгоду во всём.',
        emotion: { primary: 'sad', intensity: 55 },
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Конечно. Он хочет, чтобы ты работал бесплатно. Типичные святоши.',
        emotion: { primary: 'sad', intensity: 45 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Но я не осуждаю. Мы дадим тебе еду и ночлег, когда понадобится. А ещё... (Он достаёт из-под рясы маленький флакон) ...святую воду. Она не творит чудес, но... приносит покой.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Анализ жидкости показал бы травяной настой с лёгким седативным эффектом. "Чудо" — в голове того, кто верит.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'accept_after_all',
        text: '"Хорошо. Я помогу."',
        nextScene: 'johann_quest_accepted',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'sanctuary_blessing', action: 'start' } },
          ],
          flags: [
            { key: 'sanctuary_blessing_active', value: true },
            { key: 'met_father_johann', value: true },
          ],
        },
      },
      {
        id: 'still_decline',
        text: '"Нет, спасибо."',
        nextScene: 'johann_decline',
      },
    ],
  },

  johann_quest_accepted: {
    id: 'johann_quest_accepted',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'happy', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Кланяется) Благодарю тебя, дитя. Да хранит тебя свет на этом пути.',
        emotion: { primary: 'happy', intensity: 70 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Ищи свечи у Элиаса на рынке. Он знает, какие нам нужны. Скажи, что от меня — он не будет задирать цену.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Отец Иоанн благословляет вас жестом и возвращается к своим молитвам.',
      },
    ],
    choices: [
      {
        id: 'go_to_market',
        text: 'Отправиться на рынок за свечами.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'need_candles_for_johann', value: true }],
          narrative: 'Лавка Элиаса отмечена на карте.',
        },
      },
    ],
  },

  johann_decline: {
    id: 'johann_decline',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Кивает) Я понимаю. У каждого свой путь. Помни — двери Святилища всегда открыты.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'met_father_johann', value: true }],
        },
      },
    ],
  },

  johann_blessing_info: {
    id: 'johann_blessing_info',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Благословение... Старый обряд. Мы собираем тех, кто прибыл во Фрайбург, и даём им слова надежды. Свечи символизируют свет в темноте.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Если хочешь — приходи на церемонию. Она состоится через три дня. Но сначала... нам нужны свечи.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    nextScene: 'johann_quest_offer',
  },

  johann_farewell: {
    id: 'johann_farewell',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Иди с миром, дитя. И помни — когда тьма станет слишком густой, здесь всегда горит свет.',
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'leave',
        text: 'Выйти из собора.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  // =====================================
  // ЗАВЕРШЕНИЕ КВЕСТА БЛАГОСЛОВЕНИЯ
  // =====================================

  johann_candles_return: {
    id: 'johann_candles_return',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Принимает свечи) Ты вернулся. И с полным набором. Благодарю тебя, дитя.',
        emotion: { primary: 'happy', intensity: 75 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Он бережно укладывает свечи на алтарь, каждую — с молитвой.',
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Теперь церемония состоится. И ты... ты заслужил участие в ней. Если хочешь — приходи.',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'accept_blessing',
        text: 'Принять приглашение на благословение.',
        nextScene: 'johann_blessing_ceremony',
      },
      {
        id: 'decline_politely',
        text: '"Благодарю, но мне пора."',
        nextScene: 'johann_quest_complete',
      },
    ],
  },

  johann_blessing_ceremony: {
    id: 'johann_blessing_ceremony',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Собор наполняется мягким светом свечей. Несколько десятков людей — беженцы, путники, потерянные души — собираются вокруг алтаря.',
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Братья и сёстры... Мы собрались здесь не потому, что мир добр к нам. Мы собрались потому, что мы добры друг к другу.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '[ПАРАМЕТР: ГУМАНИСТЫ/ЭМПАТИЯ (Успех)] Люди вокруг... их напряжение отступает. Страх сменяется чем-то тёплым.',
        emotion: { primary: 'happy', intensity: 65 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Подходит к вам, возлагает руку на голову) Да будет свет твоим спутником в тёмные времена. Да найдёшь ты силу в добре и покой в истине.',
        emotion: { primary: 'happy', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Странное тепло разливается по телу. Возможно, это просто психология. Возможно — нечто большее.',
      },
    ],
    nextScene: 'johann_quest_complete',
  },

  johann_quest_complete: {
    id: 'johann_quest_complete',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'happy', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Держи. (Протягивает флакон и небольшой мешочек) Святая вода и немного трав. Пригодится в дороге.',
        emotion: { primary: 'happy', intensity: 65 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'И знай — если когда-нибудь понадобится помощь или совет, двери Святилища открыты для тебя.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'take_reward',
        text: 'Принять награду с благодарностью.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'holy_water', amount: 1 } },
            { type: 'item', data: { itemId: 'herbal_pouch', amount: 1 } },
            { type: 'quest', data: { questId: 'sanctuary_blessing', action: 'complete' } },
            { type: 'reputation', data: { faction: 'old_believers', delta: 20 } },
          ],
          flags: [
            { key: 'old_believers_contact', value: true },
            { key: 'blessed_by_johann', value: true },
          ],
          xp: 20,
        },
      },
    ],
  },

  // =====================================
  // ПОВТОРНЫЕ ВИЗИТЫ
  // =====================================

  johann_return_visit: {
    id: 'johann_return_visit',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'А, это снова ты. Как твой путь, дитя? Мир не слишком жесток к тебе?',
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'ask_for_rest',
        text: '"Можно переночевать здесь?"',
        nextScene: 'johann_rest_offer',
      },
      {
        id: 'ask_for_healing',
        text: '"Мне нужна помощь с ранами."',
        nextScene: 'johann_healing',
      },
      {
        id: 'ask_for_advice',
        text: '"Мне нужен совет."',
        nextScene: 'johann_advice',
      },
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  johann_rest_offer: {
    id: 'johann_rest_offer',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Конечно. В крипте есть свободные койки. Не роскошь, но тепло и безопасно.',
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'rest',
        text: 'Отдохнуть.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'rested_at_cathedral', value: true }],
        },
      },
    ],
  },

  johann_healing: {
    id: 'johann_healing',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'worried', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Осматривает вас) Позволь взглянуть... Да, это требует внимания. Сестра Мария поможет.',
        emotion: { primary: 'worried', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Он зовёт пожилую женщину, которая умело обрабатывает ваши раны.',
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Мы не просим платы за исцеление. Но если хочешь помочь собору — есть ящик для пожертвований.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'donate',
        text: 'Пожертвовать 5 кредитов.',
        nextScene: 'johann_return_visit',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: -5 } },
            { type: 'reputation', data: { faction: 'old_believers', delta: 3 } },
          ],
        },
      },
      {
        id: 'just_heal',
        text: 'Просто поблагодарить.',
        nextScene: 'johann_return_visit',
      },
    ],
  },

  johann_advice: {
    id: 'johann_advice',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Совет? Я не мудрец, но слушаю хорошо. О чём болит твоя душа?',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'ask_about_factions',
        text: '"Как выжить среди фракций?"',
        nextScene: 'johann_factions_advice',
      },
      {
        id: 'ask_about_professor',
        text: '"Что вы знаете о профессоре Шмидте?"',
        nextScene: 'johann_professor_info',
        availability: {
          condition: { flag: 'know_professor_missing' },
        },
      },
      {
        id: 'nevermind',
        text: '"Ничего. Спасибо."',
        nextScene: 'johann_return_visit',
      },
    ],
  },

  johann_factions_advice: {
    id: 'johann_factions_advice',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Вздыхает) Фракции... Каждая верит, что знает правду. FJR — в силе. Синтез — в знании. Анархисты — в свободе. А Артисаны — в труде.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Мой совет прост: слушай всех, но не верь слепо никому. Правда — где-то посередине. И помни — люди важнее идей.',
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'thank',
        text: 'Поблагодарить за совет.',
        nextScene: 'johann_return_visit',
      },
    ],
  },

  johann_professor_info: {
    id: 'johann_professor_info',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'worried', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Его лицо становится серьёзным) Шмидт... Он приходил сюда. Несколько раз. Искал что-то в наших архивах.',
        emotion: { primary: 'worried', intensity: 70 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'Говорят, он исчез. Но я видел его... три дня назад. Здесь, в соборе. Он спускался в крипту. Один.',
        emotion: { primary: 'worried', intensity: 65 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Крипта собора. Ещё одна зацепка. Профессор что-то искал в старых записях.',
        emotion: { primary: 'determined', intensity: 80 },
      },
    ],
    choices: [
      {
        id: 'ask_about_crypt',
        text: '"Можно мне спуститься в крипту?"',
        nextScene: 'johann_crypt_permission',
      },
      {
        id: 'thank_for_info',
        text: '"Спасибо за информацию."',
        nextScene: 'johann_return_visit',
        effects: {
          flags: [{ key: 'know_professor_visited_cathedral', value: true }],
        },
      },
    ],
  },

  johann_crypt_permission: {
    id: 'johann_crypt_permission',
    background: CATHEDRAL_BACKGROUND,
    characters: [
      {
        id: 'father_johann',
        name: 'Отец Иоанн',
        position: 'center',
        sprite: FATHER_JOHANN_SPRITE,
        emotion: { primary: 'worried', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: '(Колеблется) Крипта... Там наши архивы. И кое-что ещё. Но... если это поможет найти профессора... Хорошо. Только будь осторожен.',
        emotion: { primary: 'worried', intensity: 65 },
      },
      {
        speaker: 'Отец Иоанн',
        characterId: 'father_johann',
        text: 'И... если увидишь что-то странное... не трогай. Просто уходи.',
        emotion: { primary: 'worried', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'go_to_crypt',
        text: 'Спуститься в крипту.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'crypt_access_granted', value: true },
            { key: 'know_professor_visited_cathedral', value: true },
          ],
          narrative: 'Вход в крипту собора отмечен на карте.',
        },
      },
    ],
  },
}







