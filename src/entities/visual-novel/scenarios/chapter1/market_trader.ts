import type { Scene } from '../../model/types'

/**
 * Сценарии визуальной новеллы для торговца Элиаса
 * Локация: Площадь старой синагоги
 * 
 * Квест: chance_for_a_newbie / delivery_for_dieter
 */

const MARKET_BACKGROUND = '/images/backgrounds/freiburg_market.jpg'
const ELIAS_SPRITE = '/images/npcs/trader.jpg'

export const marketTraderScenes: Record<string, Scene> = {
  // =====================================
  // ПЕРВАЯ ВСТРЕЧА С ЭЛИАСОМ
  // =====================================

  trader_meeting_dialog: {
    id: 'trader_meeting_dialog',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты оставляешь вокзал позади. Город встречает тебя шумом и запахами. Площадь Старой Синагоги — муравейник: сотни людей, палатки из брезента, запах жареного мяса и специй.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ] Лавка стоит так, что мимо неё проходит весь поток — и беженцы, и работяги, и патрули. Удобно для торговли. И для наблюдения.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты находишь «Ржавый Якорь» — лавку под навесом из красной парусины. За прилавком, заваленным всяким хламом, сидит седобородый старик с цепким взглядом. Рядом дремлет огромный пёс.',
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Не поднимая головы) Чего надо?',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Ну конечно. Улыбки — по талонам, гостеприимство — по расписанию.',
        emotion: { primary: 'sad', intensity: 45 },
      },
    ],
    choices: [
      {
        id: 'delivery_from_hans',
        text: '"Я от Ганса. За запчастями для Дитера."',
        nextScene: 'elias_delivery_pickup',
      },
      {
        id: 'scan_market',
        text: '[ВОСПРИЯТИЕ] Осмотреться, прежде чем говорить.',
        nextScene: 'elias_market_scan',
      },
      {
        id: 'dog_trade_joke',
        text: '[ТОРГОВЛЯ] "Хороший пёс. Сколько стоит?"',
        nextScene: 'elias_dog_joke',
      },
    ],
  },

  elias_market_scan: {
    id: 'elias_market_scan',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты не спешишь раскрывать карты. Оцениваешь лавку, людей вокруг, выходы. Пёс у прилавка не просто спит — он слушает.',
      },
      {
        speaker: 'ЛОГИКА',
        text: 'Правило рынка простое: сначала смотри, кто на кого смотрит. Потом говори.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'scan_to_business',
        text: 'Подойти ближе: "Я от Ганса."',
        nextScene: 'elias_delivery_pickup',
      },
      {
        id: 'scan_to_dog',
        text: 'Проверить почву шуткой про пса.',
        nextScene: 'elias_dog_joke',
      },
      {
        id: 'scan_leave',
        text: 'Передумать и отойти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  elias_dog_joke: {
    id: 'elias_dog_joke',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Вы',
        text: 'Хороший пёс. Сколько стоит?',
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Хмыкает, не глядя) Не продаётся. Он дешевле любого замка — и надёжнее.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Пёс приоткрывает один глаз, оценивает тебя и снова «засыпает».',
      },
    ],
    choices: [
      {
        id: 'dog_to_business',
        text: '"Я от Ганса. За запчастями для Дитера."',
        nextScene: 'elias_delivery_pickup',
      },
      {
        id: 'dog_leave',
        text: 'Не затягивать и уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  elias_delivery_pickup: {
    id: 'elias_delivery_pickup',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'От Ганса? Значит, курьер. Ну-ну.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Он наклоняется под прилавок и с кряхтением вытаскивает тяжёлый, промасленный деревянный ящик. Ставит перед тобой с глухим стуком.',
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Вот. Конденсаторы, предохранители, пара сервоприводов. Всё как заказывали. Только смотри — не разбей. Дитер шкуру спустит, если хоть одна лампа треснет.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Ящик тяжёлый — килограммов десять, не меньше.',
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Тише) И ещё. Передай Дитеру: Фленс недоволен задержкой оплаты. Пусть не тянет с кредитами. Понял?',
        emotion: { primary: 'serious', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'delivery_ack',
        text: '"Понял. Передам."',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['met_elias', 'has_dieter_parts', 'heard_flens_payment_warning'],
          immediate: [{ type: 'open_map' }],
        },
      },
      {
        id: 'delivery_only_courier',
        text: '"Это ваши дела. Я только ношу груз."',
        nextScene: 'elias_delivery_respect',
      },
      {
        id: 'delivery_force',
        text: '[СИЛА] "Ты мне угрожаешь, старик?"',
        nextScene: 'elias_delivery_force',
      },
    ],
  },

  elias_delivery_respect: {
    id: 'elias_delivery_respect',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Хмыкает) Деловое отношение. Мне нравится. Вали давай, пока я не передумал.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'elias_delivery_respect_leave',
        text: 'Уйти с ящиком.',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['met_elias', 'has_dieter_parts', 'heard_flens_payment_warning'],
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },

  elias_delivery_force: {
    id: 'elias_delivery_force',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'angry', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Сухо) Я предупреждаю, а не угрожаю. Тут разница — в том, кто потом остаётся целым.',
        emotion: { primary: 'angry', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Пёс приоткрывает глаз чуть шире. На секунду тебе кажется, что лучше не продолжать.',
      },
    ],
    choices: [
      {
        id: 'elias_delivery_force_leave',
        text: 'Забрать ящик и уйти.',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['met_elias', 'has_dieter_parts', 'heard_flens_payment_warning'],
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },

  trader_hans_mention: {
    id: 'trader_hans_mention',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'surprised', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Элиас открывает один глаз. Потом второй. Его взгляд становится острым, оценивающим.',
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'От Ганса, значит... (Медленно выпрямляется) Ты тот новенький? С последнего поезда?',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Он знал, что ты придёшь. Ганс, вероятно, предупредил его заранее. Это не случайная встреча — это проверка.',
        emotion: { primary: 'determined', intensity: 80 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Ладно. Ящик с конденсаторами, верно? Ганс сказал, что пришлёт кого-то толкового. (Он делает паузу, оглядывая вас) Слушай, парень. Ты здесь первый день, так что слушай внимательно.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Фрайбург — это не просто город, это болото. FJR контролируют стены, Артисаны — инструменты, а "Синтез"... ну, они контролируют то, что осталось от мозгов. Хочешь выжить — найди себе место побыстрее.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Кстати, если ищешь безопасный ночлег, ступай к Староверам в Собор. Отец Иоанн — мужик со странностями, но своих не бросает. У них там спокойнее всего.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'honest_answer',
        text: '[ЛОГИКА] Честно: "Доставить посылку. Больше мне знать не положено."',
        nextScene: 'trader_honest_response',
        effects: {
          flags: [{ key: 'elias_honest_answer', value: true }],
        },
      },
      {
        id: 'deflect',
        text: '"Это мои дела. Давай ящик, и разойдёмся."',
        nextScene: 'trader_deflect_response',
      },
      {
        id: 'ask_about_trains',
        text: '"А что с поездами? Когда они снова пойдут?"',
        nextScene: 'trader_trains_info',
      },
    ],
  },

  trader_honest_response: {
    id: 'trader_honest_response',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Хмыкает) Честный ответ. Редкость в наше время.',
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '(Едва слышно) Он... одобряет? Да. Честность — валюта, которую он уважает.',
        emotion: { primary: 'neutral', intensity: 40 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Курьер, значит. Посылка. Не спрашивай, не болтай. Понимаю. Такие, как ты, здесь нужны.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    nextScene: 'elias_trade_entry',
  },

  elias_trade_entry: {
    id: 'elias_trade_entry',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Вот ящик. Дитера найдёшь в Промзоне, мастерская "Опора". Но прежде чем уйдёшь... может, тебе нужно чего в дорогу? У меня лучший товар на этой площади.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'open_trade',
        text: 'Посмотреть товары.',
        nextScene: 'elias_shop_menu',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'dieter_parts_crate', amount: 1 } },
          ],
          flags: [{ key: 'has_dieter_parts', value: true }],
        },
      },
      {
        id: 'just_take_crate',
        text: 'Забрать ящик и идти к Дитеру.',
        nextScene: 'trader_departure',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'dieter_parts_crate', amount: 1 } },
          ],
          flags: [{ key: 'has_dieter_parts', value: true }],
        },
      },
    ],
  },

  trader_deflect_response: {
    id: 'trader_deflect_response',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'angry', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Холодно) Ясно. Ещё один молчун.',
        emotion: { primary: 'angry', intensity: 65 },
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Отлично. Теперь он точно будет помнить тебя как "того неприятного типа".',
        emotion: { primary: 'sad', intensity: 50 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Элиас молча достаёт ящик и с грохотом ставит его на прилавок.',
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Забирай. Дитер в Промзоне. Мастерская "Опора". И скажи ему, что следующий раз пусть шлёт кого-то повежливее.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'take_and_leave',
        text: 'Забрать ящик и уйти.',
        nextScene: 'trader_departure_cold',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'dieter_parts_crate', amount: 1 } },
            { type: 'reputation', data: { faction: 'traders', delta: -5 } },
          ],
          flags: [{ key: 'has_dieter_parts', value: true }],
        },
      },
      {
        id: 'apologize',
        text: '[ЭМПАТИЯ] Извиниться: "Прости. День был тяжёлый. Я не хотел грубить."',
        presentation: {
          color: 'cautious',
          icon: '💙',
          tooltip: 'Требуется ЭМПАТИЯ',
        },
        availability: {
          skillCheck: {
            skill: 'empathy',
            difficulty: 7,
            successText: 'Элиас смягчается...',
            failureText: 'Твои слова звучат неискренне.',
          },
        },
        effects: {
          onSuccess: { nextScene: 'trader_apologize_success' },
          onFailure: { nextScene: 'trader_departure_cold' },
        },
      },
    ],
  },

  trader_apologize_success: {
    id: 'trader_apologize_success',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Вздыхает) Ладно, ладно. Я тоже не сахар. День был тяжёлый.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Слушай... у меня тут бывает работа. Для тех, кто умеет держать язык за зубами. Если что — заходи.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    nextScene: 'trader_advice',
  },

  trader_trains_info: {
    id: 'trader_trains_info',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'sad', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Качает головой) Поезда? Забудь. Третий месяц стоят. Говорят, пути разрушены дальше по линии. Или аномалия. Или твари. Никто толком не знает.',
        emotion: { primary: 'sad', intensity: 60 },
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Железнодорожное сообщение — артерия цивилизации. Если оно прервано на месяцы, значит, ситуация гораздо серьёзнее, чем "технические проблемы".',
        emotion: { primary: 'neutral', intensity: 75 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Так что устраивайся поудобнее, парень. Ты здесь надолго.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'back_to_business',
        text: '"Ладно. Вернёмся к делу. Ящик для Дитера?"',
        nextScene: 'trader_hans_mention',
      },
    ],
  },

  trader_authority_success: {
    id: 'trader_authority_success',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'surprised', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Что-то в вашем голосе заставляет Элиаса мгновенно открыть глаза. Он смотрит на вас с новым интересом.',
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ АВТОРИТЕТА] Вот так. Теперь он знает, что ты не просто очередной беженец.',
        emotion: { primary: 'determined', intensity: 80 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Медленно) Ну-ну... Характер есть. Это хорошо. Здесь слабины не прощают.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Ладно, ладно. Ты от Ганса, верно? Он предупреждал, что кто-то придёт.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    nextScene: 'trader_advice',
  },

  trader_authority_fail: {
    id: 'trader_authority_fail',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'happy', intensity: 45 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ваш голос звучит... неубедительно. Элиас даже не шевельнулся.',
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '[ПРОВАЛ] Позор. Ты звучишь как щенок, который пытается рычать.',
        emotion: { primary: 'sad', intensity: 40 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Усмехается, не открывая глаз) Милый. Попробуй ещё раз лет через десять.',
        emotion: { primary: 'happy', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'mention_hans_after_fail',
        text: '"...Я от Ганса."',
        nextScene: 'trader_hans_mention',
      },
    ],
  },

  trader_advice: {
    id: 'trader_advice',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Совет бесплатно, раз уж ты от Ганса. В этом городе четыре силы. FJR — это порядок и кулак. Артисаны — это работа и еда. "Синтез" — это знания и странности. А Анархисты...',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '...Анархисты — это хаос. Они тебе улыбнутся, а потом зарежут. Или наоборот. Держись от Августинерплац подальше, пока не освоишься.',
        emotion: { primary: 'worried', intensity: 65 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Он даёт тебе карту политического ландшафта. Это ценная информация от человека, который явно видел многое.',
        emotion: { primary: 'determined', intensity: 80 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'И ещё. Если кто-то предложит тебе "лёгкие деньги" — подумай дважды. В этом городе ничего лёгкого нет.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Он подталкивает ящик к вам.',
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Всё. Иди к Дитеру. И не урони — там хрупкое.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'take_crate',
        text: 'Забрать ящик с запчастями.',
        nextScene: 'trader_departure',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'dieter_parts_crate', amount: 1 } },
            { type: 'quest', data: { questId: 'delivery_for_dieter', action: 'progress', stepId: 'talk_to_elias' } },
          ],
          flags: [
            { key: 'has_dieter_parts', value: true },
            { key: 'met_elias', value: true },
            { key: 'elias_advice_received', value: true },
          ],
        },
      },
      {
        id: 'ask_about_shadow_work',
        text: '"Ты упоминал работу для молчунов. Что за работа?"',
        nextScene: 'trader_shadow_work',
      },
    ],
  },

  trader_shadow_work: {
    id: 'trader_shadow_work',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Понижает голос) Любопытный, значит. Это может быть и хорошо, и плохо.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: '(Шипит) Он заманивает тебя! Не верь ему! Это ловушка!',
        emotion: { primary: 'worried', intensity: 70 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Иногда мне нужно... переместить кое-что. Без лишних глаз. FJR контролируют официальные каналы, но город большой, а патрули не везде.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Сначала докажи, что умеешь работать. Отнеси ящик Дитеру. Вернёшься — поговорим о большем.',
        emotion: { primary: 'determined', intensity: 70 },
      },
    ],
    choices: [
      {
        id: 'agree_future_work',
        text: '"Договорились. Вернусь после Дитера."',
        nextScene: 'trader_departure',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'dieter_parts_crate', amount: 1 } },
          ],
          flags: [
            { key: 'has_dieter_parts', value: true },
            { key: 'met_elias', value: true },
            { key: 'elias_shadow_work_interest', value: true },
          ],
        },
      },
      {
        id: 'decline_shadow_work',
        text: '"Нет, спасибо. Я предпочитаю чистую работу."',
        nextScene: 'trader_departure',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'dieter_parts_crate', amount: 1 } },
          ],
          flags: [
            { key: 'has_dieter_parts', value: true },
            { key: 'met_elias', value: true },
            { key: 'declined_shadow_work', value: true },
          ],
        },
      },
    ],
  },

  trader_departure: {
    id: 'trader_departure',
    background: MARKET_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы берёте тяжёлый ящик. Он весит больше, чем кажется. Внутри что-то позвякивает — конденсаторы, судя по всему.',
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Судя по весу и звуку — высоковольтные конденсаторы. Редкая вещь. Дитер, должно быть, работает над чем-то серьёзным.',
        emotion: { primary: 'excited', intensity: 70 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Элиас уже закрыл глаза, вернувшись к своей дрёме. Но вы чувствуете, что он следит за вами даже сквозь веки.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Промзона ждёт. Дитер ждёт. Пора двигаться.',
      },
    ],
    choices: [
      {
        id: 'go_to_industrial',
        text: 'Отправиться в Промзону к Дитеру.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'destination_industrial_zone', value: true }],
          narrative: 'На карте отмечена мастерская "Опора" в Промзоне Артисанов.',
        },
      },
    ],
  },

  trader_departure_cold: {
    id: 'trader_departure_cold',
    background: MARKET_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы хватаете ящик и уходите без лишних слов. За спиной слышится презрительное хмыканье Элиаса.',
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Отличное начало. Враг номер один в списке — местный торговец. Гениально.',
        emotion: { primary: 'sad', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'go_to_industrial_cold',
        text: 'Отправиться в Промзону.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'destination_industrial_zone', value: true }],
        },
      },
    ],
  },

  trader_browse_goods: {
    id: 'trader_browse_goods',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Лениво) Смотри, смотри. Руками не трогай.',
        emotion: { primary: 'neutral', intensity: 50 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Прилавок завален разнообразным хламом: старые инструменты, запчасти, консервы, несколько тусклых ножей.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Среди хлама — несколько интересных предметов. Старый военный фонарь. Катушка медной проволоки. Потёртая карта района.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Медная проволока! Идеально для импровизированных ловушек или ремонта электроники.',
        emotion: { primary: 'excited', intensity: 65 },
      },
    ],
    choices: [
      {
        id: 'back_to_business',
        text: '"Впечатляет. Но я пришёл по делу — от Ганса."',
        nextScene: 'trader_hans_mention',
      },
      {
        id: 'ask_prices',
        text: '"Сколько за карту района?"',
        nextScene: 'trader_map_price',
      },
    ],
  },

  trader_map_price: {
    id: 'trader_map_price',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Карта? Двадцать кредитов. На ней отмечены основные маршруты и "горячие точки". Может спасти жизнь.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Двадцать кредитов — это почти всё, что у тебя есть. Но карта действительно может быть полезна.',
        emotion: { primary: 'determined', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'buy_map',
        text: 'Купить карту за 20 кредитов.',
        nextScene: 'trader_hans_mention',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: -20 } },
            { type: 'item', data: { itemId: 'freiburg_map', amount: 1 } },
          ],
          flags: [{ key: 'bought_elias_map', value: true }],
        },
      },
      {
        id: 'decline_map',
        text: 'Отказаться и перейти к делу.',
        nextScene: 'trader_hans_mention',
      },
    ],
  },

  // =====================================
  // ПОВТОРНЫЕ ВИЗИТЫ К ЭЛИАСУ
  // =====================================

  elias_return_visit: {
    id: 'elias_return_visit',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'О, снова ты. Как там Дитер? Получил свои железки?',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'report_delivery',
        text: '"Да, всё доставлено."',
        nextScene: 'elias_pleased',
        availability: {
          condition: { flag: 'completed_dieter_delivery' },
        },
      },
      {
        id: 'still_working',
        text: '"Ещё в процессе."',
        nextScene: 'elias_waiting',
        availability: {
          condition: { notFlag: 'completed_dieter_delivery' },
        },
      },
      {
        id: 'ask_shadow_work_now',
        text: '"Помнишь, ты говорил о работе?"',
        nextScene: 'elias_shadow_job',
        availability: {
          condition: { flag: 'elias_shadow_work_interest' },
        },
      },
      {
        id: 'browse_goods',
        text: 'Посмотреть товары.',
        nextScene: 'elias_shop_menu',
      },
    ],
  },

  elias_pleased: {
    id: 'elias_pleased',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Хорошо. Быстро работаешь. Это ценится.',
        emotion: { primary: 'happy', intensity: 65 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Ганс был прав насчёт тебя. Может, и правда есть у меня кое-что для надёжного человека...',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'hear_job',
        text: '"Слушаю."',
        nextScene: 'elias_shadow_job',
      },
      {
        id: 'later',
        text: '"Потом. Сейчас другие дела."',
        nextScene: 'exit_to_map',
      },
    ],
  },

  elias_waiting: {
    id: 'elias_waiting',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Тогда чего стоишь? Дитер ждать не любит.',
        emotion: { primary: 'neutral', intensity: 50 },
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

  elias_shadow_job: {
    id: 'elias_shadow_job',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Понижает голос) Есть груз. Небольшой. Нужно доставить в Торговый квартал. Без вопросов.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Контрабанда. Очевидно. Вопрос в том, насколько это опасно и сколько платят.',
        emotion: { primary: 'determined', intensity: 80 },
      },
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Тридцать кредитов. И никаких проблем, если не попадёшься патрулю.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'accept_shadow_job',
        text: 'Принять работу.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'shadow_delivery', action: 'start' } },
            { type: 'item', data: { itemId: 'suspicious_package', amount: 1 } },
          ],
          flags: [{ key: 'shadow_delivery_active', value: true }],
        },
      },
      {
        id: 'decline_shadow_job',
        text: 'Отказаться.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'declined_elias_job', value: true }],
        },
      },
      {
        id: 'ask_details',
        text: '"Что в грузе?"',
        nextScene: 'elias_shadow_job_details',
      },
    ],
  },

  elias_shadow_job_details: {
    id: 'elias_shadow_job_details',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'angry', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: '(Холодно) Я сказал — без вопросов. Если это проблема, найду другого курьера.',
        emotion: { primary: 'angry', intensity: 65 },
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Классика. Меньше знаешь — крепче спишь. Или быстрее сдохнешь.',
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'accept_anyway',
        text: '"Ладно. Беру."',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'shadow_delivery', action: 'start' } },
            { type: 'item', data: { itemId: 'suspicious_package', amount: 1 } },
          ],
          flags: [{ key: 'shadow_delivery_active', value: true }],
        },
      },
      {
        id: 'walk_away',
        text: 'Уйти без лишних слов.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'declined_elias_job', value: true }],
          immediate: [
            { type: 'reputation', data: { faction: 'traders', delta: -3 } },
          ],
        },
      },
    ],
  },

  elias_shop: {
    id: 'elias_shop',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Чего надо? Торговаться будем или просто время тратить?',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'elias_shop_open_menu',
        text: 'Посмотреть товары.',
        nextScene: 'elias_shop_menu',
        effects: {
          addFlags: ['met_elias'],
        },
      },
      {
        id: 'elias_shop_leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['met_elias'],
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },

  elias_shop_menu: {
    id: 'elias_shop_menu',
    background: MARKET_BACKGROUND,
    characters: [
      {
        id: 'elias',
        name: 'Элиас',
        position: 'center',
        sprite: ELIAS_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Элиас',
        characterId: 'elias',
        text: 'Смотри. Цены честные. Ну, почти.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'Рассказчик',
        text: 'На прилавке разложены товары: инструменты, консервы, медикаменты, редкие компоненты.',
      },
    ],
    choices: [
      {
        id: 'buy_medkit',
        text: 'Аптечка (15 кредитов)',
        nextScene: 'elias_shop_menu',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: -15 } },
            { type: 'item', data: { itemId: 'medkit_basic', amount: 1 } },
          ],
        },
      },
      {
        id: 'buy_flashlight',
        text: 'Фонарик (10 кредитов)',
        nextScene: 'elias_shop_menu',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: -10 } },
            { type: 'item', data: { itemId: 'flashlight', amount: 1 } },
          ],
        },
      },
      {
        id: 'buy_wire',
        text: 'Медная проволока (8 кредитов)',
        nextScene: 'elias_shop_menu',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: -8 } },
            { type: 'item', data: { itemId: 'copper_wire', amount: 1 } },
          ],
        },
      },
      {
        id: 'done_shopping',
        text: 'Закончить покупки.',
        nextScene: 'elias_return_visit',
      },
    ],
  },
}
