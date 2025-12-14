import type { Scene } from '../../model/types'

export const sideQuestScenes: Record<string, Scene> = {
  lena_infirmary_help: {
    id: 'lena_infirmary_help',
    background: '/images/backgrounds/infirmary.png',
    characters: [
      {
        id: 'lena',
        name: 'Лейтенант Лена Рихтер',
        position: 'center',
        sprite: '/images/characters/lena.png',
        emotion: { primary: 'tired', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лейтенант Лена Рихтер',
        characterId: 'lena',
        text: 'Ты вовремя. У нас завал, а людей не хватает. Эти раненые с окраин... Я не успеваю ни за пациентами, ни за бумажками. Поможешь мне на пару часов?',
      },
    ],
    choices: [
      {
        id: 'help_lena',
        text: 'Согласиться помочь Лене (медицинская/организационная работа).',
        nextScene: 'lena_help_success',
        effects: {
          immediate: [{ type: 'skill_boost', data: { skillId: 'logic', amount: 1 } }],
          flags: [{ key: 'helped_lena_infirmary', value: true }],
          xp: 5,
        },
      },
      {
        id: 'leave_infirmary',
        text: 'Извини, сейчас не до этого.',
        nextScene: 'university_wait_evening',
      },
    ],
  },

  lena_help_success: {
    id: 'lena_help_success',
    background: '/images/backgrounds/infirmary.png',
    characters: [
      {
        id: 'lena',
        name: 'Лейтенант Лена Рихтер',
        position: 'center',
        sprite: '/images/characters/lena.png',
        emotion: { primary: 'happy', intensity: 50 },
      },
    ],
    dialogue: [
      {
        speaker: 'Лейтенант Лена Рихтер',
        characterId: 'lena',
        text: 'Спасибо. Ты вытащил сегодня не только пациентов, но и меня. Заходи вечером к главному корпусу — я замолвлю за тебя словечко перед Крюгером.',
      },
    ],
    choices: [
      {
        id: 'finish_help',
        text: 'Кивнуть и выйти из лазарета.',
        nextScene: 'university_wait_evening',
        effects: {
          xp: 15,
        },
      },
    ],
  },

  ludas_bar_visit: {
    id: 'ludas_bar_visit',
    background: '/images/backgrounds/freiburg_ludas_bar.jpg',
    characters: [
      {
        id: 'lyuda',
        name: 'Люда',
        position: 'center',
        sprite: '/images/characters/lyuda.png',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы входите в бар "Последний приют". Тепло, полумрак, запах еды и дешёвого алкоголя. Люда за стойкой поднимает на вас внимательный взгляд.',
      },
      {
        speaker: 'Люда',
        characterId: 'lyuda',
        text: 'Слышала, на воротах заворот. Не удивлена. Весь город на ушах. Тебе чего — выпить, поесть или сплетни?',
      },
      {
        speaker: 'Вы',
        text: 'Шмидт послал. Сказал, у тебя можно переждать.',
      },
      {
        speaker: 'Люда',
        characterId: 'lyuda',
        emotion: { primary: 'amused', intensity: 50 },
        text: 'Шмидт — мужик хороший, но болтливый. Переждать можно. Только у нас самообслуживание: хочешь сидеть — закажи что-нибудь.',
      },
      {
        speaker: 'Люда',
        characterId: 'lyuda',
        text: 'А если скучно... есть у меня одна проблема. Ларс, местный торговец, пропал. Должен был занести долг, и как сквозь землю провалился. Если найдёшь его или узнаешь, что случилось — с меня ужин и ночлег бесплатно.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Квест "Лавочник-прогульщик" активирован. Наводки: Рынок, Элке.',
      },
    ],
    choices: [
      {
        id: 'accept_lyuda_quest',
        text: 'Согласиться поискать Ларса.',
        nextScene: 'market_square_arrival',
        availability: {
          skillCheck: {
            skill: 'empathy',
            difficulty: 5,
            successText: 'Вы улавливаете за спокойной маской Люды усталость и тревогу — отказывать неудобно.',
            failureText: 'Вы не читаете её эмоций, но предложение ужина и ночлега звучит достаточно убедительно само по себе.',
          },
        },
        effects: {
          immediate: [{ type: 'quest', data: { questId: 'missing_shopkeeper', action: 'start' } }],
          xp: 5,
        },
      },
      {
        id: 'decline_lyuda_quest',
        text: 'Отказаться и просто посидеть в баре.',
        nextScene: 'market_square_arrival',
      },
    ],
  },

  karapuz_square_meeting: {
    id: 'karapuz_square_meeting',
    background: '/images/backgrounds/freiburg_shvabskaya_square.jpg',
    characters: [
      {
        id: 'karapuz',
        name: 'Карапуз',
        position: 'center',
        sprite: '/images/characters/karapuz.png',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Швабская площадь гудит, как улей. Палатки, костры, разношёрстный люд. На импровизированном "троне" из ящиков восседает Карапуз.',
      },
      {
        speaker: 'Карапуз',
        characterId: 'karapuz',
        text: 'О-хо-хо! Вижу, FJR тебя не пустили? У них сегодня нервный тик. Садись, рассказывай.',
      },
      {
        speaker: 'Вы',
        text: 'Мне бы работу найти. До вечера.',
      },
      {
        speaker: 'Карапуз',
        characterId: 'karapuz',
        text: 'Работа? Работы навалом. Вон, видишь ящики? Это гуманитарка для Артисанов. Мои парни ленивые, тащить не хотят. Донесёшь до цеха — получишь кредиты. А заодно и город посмотришь.',
      },
      {
        speaker: '[ЦИНИЗМ]',
        text: 'Использует тебя как мула. Но платит честно. В этом городе это уже немало.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Квест "Поставка в цех" активирован.',
      },
    ],
    choices: [
      {
        id: 'accept_karapuz_delivery',
        text: 'Согласиться тащить ящики для Артисанов.',
        nextScene: 'industrial_hub',
        availability: {
          skillCheck: {
            skill: 'analysis',
            difficulty: 4,
            successText: 'Вы прекрасно понимаете, что вас используют, но выгода перевешивает раздражение.',
            failureText: 'Вы не до конца просчитываете сделку, но всё равно киваете — деньги не лишние.',
          },
        },
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'artisan_delivery', action: 'start' } },
            { type: 'currency', data: { amount: 15 } },
          ],
          xp: 10,
        },
      },
      {
        id: 'decline_karapuz_delivery',
        text: 'Отказаться и остаться на площади.',
        nextScene: 'market_square_arrival',
      },
    ],
  },
}
