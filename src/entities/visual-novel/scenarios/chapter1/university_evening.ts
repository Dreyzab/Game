import type { Scene } from '../../model/types'

export const universityEveningScenes: Record<string, Scene> = {
  university_evening_meeting: {
    id: 'university_evening_meeting',
    background: '/images/backgrounds/university_office.png',
    characters: [
      {
        id: 'kruger',
        name: 'Профессор Крюгер',
        position: 'center',
        sprite: '/images/characters/kruger.png',
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'К вечеру коридоры Кампуса пустеют. Охрана пропускает вас по списку, и вскоре вы оказываетесь в кабинете с высокими окнами и стеллажами, забитыми папками и аппаратурой.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Профессор Крюгер, седой, но собранный, какое-то время изучает вас поверх очков, словно сверяя картинку с внутренним списком.',
      },
      {
        speaker: 'Профессор Крюгер',
        characterId: 'kruger',
        text: 'Значит, это вы тот курьер, о котором писала Рихтер. И тот, кто оказался в самом центре инцидента на путях.',
      },
      {
        speaker: 'Профессор Крюгер',
        characterId: 'kruger',
        emotion: { primary: 'curious', intensity: 60 },
        text: 'Не переживайте, я не следователь. Меня интересуют последствия, а не протоколы. У вас с собой посылка Элиаса?',
      },
      {
        speaker: '[ИНТУИЦИЯ]',
        text: 'Он смотрит не на вас, а как будто сквозь — туда, где расходятся круги от того самого “инцидента”.',
      },
    ],
    choices: [
      {
        id: 'give_package',
        text: 'Поставить посылку на стол Крюгера.',
        nextScene: 'package_delivery',
        effects: {
          immediate: [
            { type: 'item', data: { itemId: 'mystery_package', amount: -1 } },
            { type: 'quest', data: { questId: 'delivery_for_professor', action: 'complete' } },
          ],
          xp: 20,
        },
      },
    ],
  },

  package_delivery: {
    id: 'package_delivery',
    background: '/images/backgrounds/university_office.png',
    characters: [
      {
        id: 'kruger',
        name: 'Профессор Крюгер',
        position: 'center',
        sprite: '/images/characters/kruger.png',
        emotion: { primary: 'surprised', intensity: 80 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Крюгер осторожно вскрывает посылку. Белые пальцы в перчатках двигаются быстро и уверенно, как будто он уже десятки раз делал это в голове.',
      },
      {
        speaker: 'Профессор Крюгер',
        characterId: 'kruger',
        text: 'Так… Эти кристаллы Элиас прятал от Совета ещё со времён первых экспериментов в промзоне. И всё же он решился прислать их обратно.',
      },
      {
        speaker: '[ЛОГИКА]',
        text: 'Если это возвращается в Кампус — значит, история с инцидентом только начинается. И вы в ней — не статист.',
      },
      {
        speaker: 'Профессор Крюгер',
        characterId: 'kruger',
        text: 'Вы хорошо поработали. И, признаюсь, вы мне нужны живым и относительно вменяемым. Город будет трещать по швам, а я не могу покинуть университет.',
      },
      {
        speaker: 'Профессор Крюгер',
        characterId: 'kruger',
        emotion: { primary: 'thoughtful', intensity: 70 },
        text: 'Отдохните сегодня. Переварите всё, что произошло. Завтра поговорим о том, что вы видели на путях… и о том, что шепчет под Фрайбургом.',
      },
    ],
    choices: [
      {
        id: 'end_day_1',
        text: 'Кивнуть и покинуть кабинет.',
        nextScene: 'chapter1_day1_end',
        effects: {
          xp: 10,
        },
      },
    ],
  },

  chapter1_day1_end: {
    id: 'chapter1_day1_end',
    background: '/images/backgrounds/night_city.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ночь опускается на Фрайбург. Вдали гудят поезда, вспыхивают и гаснут редкие огни дронов, ветер гонит по брусчатке обрывки объявлений.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Город гудит тревогой, но вы наконец позволяете себе закрыть глаза. Завтра придётся снова делать вид, что всё под контролем.',
      },
    ],
    choices: [
      {
        id: 'sleep',
        text: 'Пойти спать и встретить второй день.',
        nextScene: 'chapter1_day2_start', // Заглушка для следующего дня
      },
    ],
  },
}
