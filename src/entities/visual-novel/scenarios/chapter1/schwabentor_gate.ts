import type { Scene } from '../../model/types'

export const schwabentorGateScenes: Record<string, Scene> = {
  schwabentor_morning_denial: {
    id: 'schwabentor_morning_denial',
    background: '/images/backgrounds/freiburg_schwabentor_gate.jpg',
    characters: [
      {
        id: 'schmidt',
        name: 'Капрал Шмидт',
        position: 'center',
        sprite: '/images/characters/schmidt.png',
        emotion: { primary: 'angry', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Утро. Туман цепляется за стены Швабентор. Усиленный патруль FJR проверяет документы у очереди желающих покинуть город.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вы подходите к воротам с запиской от Дитера. Капрал Шмидт бросает на неё быстрый взгляд и возвращает вам.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'Не сегодня. Приказ коменданта: "Красный код". Никого не выпускать, никого не впускать. На горе что-то случилось. Иди гуляй до завтра, парень.',
      },
      {
        speaker: 'Вы',
        text: 'Дитер сказал, это срочно.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        emotion: { primary: 'tired', intensity: 60 },
        text: 'Для Дитера всё срочно. А для меня срочно — это когда мутанты на стены лезут. Свободен.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'Если некуда деться — иди к Люде в бар "Последний приют" или найди Карапуза на площади. Они подскажут, чем заняться.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Цель обновлена: "Убить время до вечера. Посетить Люду или Карапуза".',
      },
    ],
    choices: [
      {
        id: 'leave_gate_to_market',
        text: 'Отойти от ворот и вернуться к площади.',
        nextScene: 'market_square_arrival',
        effects: {
          flags: [{ key: 'schwabentor_blocked', value: true }],
          xp: 5,
        },
      },
    ],
  },
}
