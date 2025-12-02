import type { Scene } from '../../model/types'

export const industrialZoneScenes: Record<string, Scene> = {
  industrial_dieter_workshop: {
    id: 'industrial_dieter_workshop',
    background: '/images/backgrounds/freiburg_workshop.jpg',
    characters: [
      {
        id: 'dieter',
        name: 'Дитер',
        position: 'center',
        sprite: '/images/characters/dieter.png',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        id: 'rico',
        name: 'Рико',
        position: 'right',
        sprite: '/images/characters/rico.png',
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы входите в мастерскую с тяжёлым ящиком от Элиаса. В глубине цеха, у разобранного генератора, вы видите две фигуры. Одна — сгорбленный Дитер. Вторая — молодая, подвижная, в куртке, увешанной инструментами.',
      },
      {
        speaker: '[ВОСПРИЯТИЕ]',
        text: 'Этот силуэт... эта манера двигаться. Вы знаете его.',
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Опа! Кого я вижу! Живой! А я думал, тебя Густав на запчасти разобрал.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Вы знакомы? Рико, не отвлекайся, держи контакт.',
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Да держу я, держу. Старик, это тот самый парень с поезда! Тот, что не зассал, когда твари попёрли.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Вот как? Полезное качество.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вы ставите ящик на верстак.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Наконец-то. Элиас не подвёл. — Он вскрывает ящик. — Рико, глянь, те самые конденсаторы. Теперь твой "бум-сюрприз" будет работать как часы.',
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Для хорошего дела стараемся. Артисаны любят фейерверки.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Держи оплату. Ты заслужил. И раз уж вы с Рико друг друга знаете, и он тебя хвалит... есть у меня к тебе разговор.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Дитер отводит взгляд в сторону, туда, где через грязные окна виден силуэт Шлосберга.',
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'На Шлосберг? Ууу, старик, ты его на смерть посылаешь. Там сейчас фонит так, что у меня зубы ноют.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Цыц! Не пугай парня. Тропа безопасная. Если всё сделать быстро.',
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Ладно-ладно. Слушай, друг. Если пойдёшь — загляни ко мне потом. Я тут неподалёку обосновался, в подвале "Цех 4". Подгоню тебе пару гранат. На всякий пожарный.',
      },
    ],
    choices: [
      {
        id: 'give_parts',
        text: 'Поставить ящик на верстак и дождаться оплаты.',
        nextScene: 'dieter_quest_complete',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'dieter_parts_crate', amount: -1 } },
            { type: 'quest', data: { questId: 'delivery_for_dieter', action: 'complete' } },
            { type: 'currency', data: { amount: 50 } },
          ],
          flags: [
            { key: 'completed_dieter_delivery', value: true },
            { key: 'rico_hideout_marker', value: true },
          ],
          xp: 15,
        },
      },
    ],
  },

  dieter_quest_complete: {
    id: 'dieter_quest_complete',
    background: '/images/backgrounds/freiburg_workshop.jpg',
    characters: [
      {
        id: 'dieter',
        name: 'Дитер',
        position: 'center',
        sprite: '/images/characters/dieter.png',
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        id: 'rico',
        name: 'Рико',
        position: 'right',
        sprite: '/images/characters/rico.png',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Хорошая работа. Видно, что поезда тебя не сломали. Элиас знает, кому доверять.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Есть ещё одно дело. Там, на Шлосберге, у старых кристаллических колодцев, что-то случилось. Люди слышат шёпот, приборы сходят с ума. Мне нужны образцы, пока "Синтез" не закрыл всё наглухо.',
      },
      {
        speaker: 'Рико',
        characterId: 'rico',
        text: 'Да, звучит как обычный день во Фрайбурге. Если соберёшься туда — загляни ко мне в "Цех 4". Я подготовлю тебе кое-какие игрушки.',
      },
    ],
    choices: [
      {
        id: 'accept_schlossberg',
        text: 'Согласиться выслушать подробности про Шлосберг.',
        nextScene: 'industrial_hub',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'whispers_of_rift', action: 'start' } },
            { type: 'item', data: { itemId: 'schmidt_note', amount: 1 } },
            { type: 'map_marker', data: { markerId: 'rico_hideout', revealed: true } },
          ],
          xp: 10,
        },
      },
    ],
  },

  industrial_hub: {
    id: 'industrial_hub',
    background: '/images/backgrounds/industrial_zone.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Шум, искры и запах масла остаются за спиной. Промзона тянется лабиринтом цехов и труб, где-то вдали виднеется силуэт Шлосберга. Пора решать, куда двигаться дальше.',
      },
    ],
    choices: [
      {
        id: 'go_to_schwabentor',
        text: 'Направиться к воротам Швабентор с запиской от Дитера.',
        nextScene: 'schwabentor_arrival',
      },
      {
        id: 'go_to_market',
        text: 'Вернуться к рыночной площади.',
        nextScene: 'market_square_arrival',
      },
    ],
  },
}
