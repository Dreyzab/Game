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
        id: 'bruno',
        name: 'Бруно',
        position: 'right',
        sprite: '/images/characters/rico.png', // Assuming sprite stays the same for now
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы входите в мастерскую с тяжёлым ящиком от Элиаса. Мастерская Дитера — это огромный ангар с распахнутыми воротами. Внутри гудит сварка, летят искры.',
      },
      {
        speaker: 'Рассказчик',
        text: 'В глубине цеха, у разобранного генератора, вы видите две фигуры. Одна — сгорбленный старик в сварочных очках (Дитер). Вторая — молодая, подвижная, в куртке, увешанной инструментами.',
      },
      {
        speaker: '[ВОСПРИЯТИЕ]',
        text: 'Этот силуэт... вы знаете его. Это Бруно — тот самый парень с поезда, который кинул взрывчатку в монстра.',
      },
      {
        speaker: 'Бруно',
        characterId: 'bruno',
        text: 'Опа! Кого я вижу! Живой! А я думал, тебя Густав на запчасти разобрал.',
        emotion: { primary: 'happy', intensity: 80 },
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Вы знакомы?',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'Бруно',
        characterId: 'bruno',
        text: 'Да это тот самый парень с поезда! — Бруно подмигивает. — Дитер смотрит на тебя с новым интересом.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Вот как? Полезное качество в наше время. Ну, давай сюда ящик.',
      },
    ],
    choices: [
      {
        id: 'give_parts_user_script',
        text: 'Поставить груз на верстак.',
        nextScene: 'dieter_quest_complete_script',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'dieter_parts_crate', amount: -1 } },
            { type: 'quest', data: { questId: 'delivery_for_dieter', action: 'complete' } },
            { type: 'currency', data: { amount: 30 } },
          ],
          flags: [
            { key: 'completed_dieter_delivery', value: true },
            { key: 'met_bruno', value: true },
          ],
          xp: 15,
        },
      },
    ],
  },

  dieter_quest_complete_script: {
    id: 'dieter_quest_complete_script',
    background: '/images/backgrounds/freiburg_workshop.jpg',
    characters: [
      {
        id: 'dieter',
        name: 'Дитер',
        position: 'center',
        sprite: '/images/characters/dieter.png',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        id: 'bruno',
        name: 'Бруно',
        position: 'right',
        sprite: '/images/characters/rico.png',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Дитер быстро проверяет содержимое ящика.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Всё на месте. Отлично. — Он достаёт кошелёк и отсчитывает тебе 30 кредитов. — Держи. Заслужил.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Слушай, — он смотрит на тебя серьёзно. — Раз уж вы с Бруно друг друга знаете, и он тебя хвалит... есть у меня к тебе разговор. Дело посложнее, чем коробки таскать.',
      },
      {
        speaker: 'Бруно',
        characterId: 'bruno',
        text: 'Старик, ты же не хочешь его на Шлосберг послать?',
        emotion: { primary: 'serious', intensity: 80 },
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Цыц! Не пугай парня. Там, на горе, у подножия старого замка, есть мой схрон. Старая смотровая площадка. Я оставил там... кое‑какие кристаллы. Заряжаться. Нужно их забрать.',
      },
    ],
    choices: [
      {
        id: 'ask_danger',
        text: '"На гору? Я слышал, там опасно. И проход закрыт."',
        nextScene: 'dieter_schlossberg_reward_offer',
      },
      {
        id: 'ask_payment',
        text: '"Сколько платишь?"',
        nextScene: 'dieter_schlossberg_reward_offer',
      },
      {
        id: 'ask_why_not_bruno',
        text: '"Почему ты не пошлёшь Бруно?"',
        nextScene: 'dieter_schlossberg_reward_offer',
      },
    ],
  },

  dieter_schlossberg_reward_offer: {
    id: 'dieter_schlossberg_reward_offer',
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
        id: 'bruno',
        name: 'Бруно',
        position: 'right',
        sprite: '/images/characters/rico.png',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Кредитов много не дам. Полтинник накину, не больше. — Он делает паузу. — Но! Я могу предложить кое-что получше.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он лезет под верстак и достаёт пистолет. Старый, потёртый, но ухоженный. Ствол удлинён, рукоять обмотана кожей.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Модифицированный "Шершень". Бьёт точнее, отдача меньше. И главное — я посодействую с разрешением.',
      },
      {
        speaker: 'Вы',
        text: 'Разрешение?',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Именно. На выходе к горе, на КПП Швабентор, тебе выдадут временное. Скажешь, что работаешь на Артисанов по спецзаказу. А если вернёшься с кристаллами... постоянное у тебя в кармане.',
      },
      {
        speaker: 'Бруно',
        characterId: 'bruno',
        text: 'Неплохое предложение, брат. С такой игрушкой и по ночам гулять не страшно.',
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'accept_schlossberg_ready',
        text: '"По рукам. Где этот схрон?"',
        nextScene: 'dieter_schlossberg_instructions',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'whispers_of_rift', action: 'start' } },
            { type: 'item', data: { itemId: 'schmidt_note', amount: 1 } },
          ],
        },
      },
      {
        id: 'accept_schlossberg_cautious',
        text: '"Ладно. Но если там будет жарко, я разворачиваюсь."',
        nextScene: 'dieter_schlossberg_instructions',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'whispers_of_rift', action: 'start' } },
            { type: 'item', data: { itemId: 'schmidt_note', amount: 1 } },
          ],
        },
      },
      {
        id: 'decline_schlossberg_later',
        text: '"Мне нужно подумать. Я зайду позже."',
        nextScene: 'industrial_hub',
      },
    ],
  },

  dieter_schlossberg_instructions: {
    id: 'dieter_schlossberg_instructions',
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
        id: 'bruno',
        name: 'Бруно',
        position: 'right',
        sprite: '/images/characters/rico.png',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Вот это разговор. — Он достаёт клочок бумаги и быстро чертит схему. — Смотри. Идешь к воротам Швабентор. Там покажешь эту записку — это для Шмидта, начальника караула. Он пропустит.',
      },
      {
        speaker: 'Дитер',
        characterId: 'dieter',
        text: 'Дальше по старой туристической тропе. Не сворачивай в лес, там... нестабильно. Дойдешь до смотровой площадки. Там под старой скамьёй тайник. Код: 4-5-1.',
      },
      {
        speaker: 'Бруно',
        characterId: 'bruno',
        text: 'Эй, герой! — Бруно окликает тебя у выхода. — Если выживешь на горе... загляни ко мне потом. Я тут неподалёку обосновался, в подвале "Цех 4". Может, подгоню тебе пару гранат.',
      },
    ],
    choices: [
      {
        id: 'go_to_schwabentor_after_instruct',
        text: 'Направиться к воротам Швабентор.',
        nextScene: 'schwabentor_arrival',
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
        text: 'Направиться к воротам Швабентор.',
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
