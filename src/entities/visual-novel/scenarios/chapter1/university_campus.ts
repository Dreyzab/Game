import type { Scene } from '../../model/types'

export const universityCampusScenes: Record<string, Scene> = {
  university_gate_denial: {
    id: 'university_gate_denial',
    background: '/images/backgrounds/freiburg_university_gate.jpg',
    characters: [
      {
        id: 'lena',
        name: 'Лейтенант Лена Рихтер',
        position: 'left',
        sprite: '/images/characters/lena.png',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        id: 'guard',
        name: 'Охранник "Синтеза"',
        position: 'center',
        sprite: '/images/characters/guard_synthesis.png',
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы подходите к воротам Кампуса "Синтеза". После хаоса вокзала здесь царит пугающая тишина и порядок. Лена уверенно кивает охраннику, показывая свой ID.',
      },
      {
        speaker: 'Лейтенант Лена Рихтер',
        characterId: 'lena',
        text: 'Лейтенант Рихтер, возвращение из командировки. Со мной гражданский, курьер к профессору Штейнбаху.',
      },
      {
        speaker: 'Охранник "Синтеза"',
        characterId: 'guard',
        text: 'С возвращением, лейтенант. Проходите. А вот насчёт профессора...',
      },
      {
        speaker: 'Рассказчик',
        text: 'Охранник виновато разводит руками.',
      },
      {
        speaker: 'Охранник "Синтеза"',
        characterId: 'guard',
        text: 'Его нет. Экстренное совещание Совета по поводу инцидента на путях. Вернётся не раньше вечера.',
      },
      {
        speaker: '[ЛОГИКА]',
        text: 'Инцидент на путях — это ваш поезд. Круг замкнулся. Верхушка уже знает.',
      },
      {
        speaker: 'Лейтенант Лена Рихтер',
        characterId: 'lena',
        emotion: { primary: 'worried', intensity: 60 },
        text: 'Типично. Ладно.',
      },
      {
        speaker: 'Рассказчик',
        text: 'В этот момент к воротам подъезжает грузовик с красным крестом. Из кузова начинают выгружать носилки с ранеными — гражданскими и бойцами FJR.',
      },
      {
        speaker: '[ЭМПАТИЯ]',
        text: 'Кровь, стоны, запах гари. Это те, кто не успел укрыться.',
      },
      {
        speaker: 'Лейтенант Лена Рихтер',
        characterId: 'lena',
        emotion: { primary: 'angry', intensity: 65 },
        text: 'Чёрт... это с окраин. Я нужна им.',
      },
      {
        speaker: 'Лейтенант Лена Рихтер',
        characterId: 'lena',
        text: 'Слушай, я не могу сейчас вести тебя к лаборантам. Иди, займись своими делами. Погуляй по городу, найди ночлег. Вечером, как профессор освободится, приходи прямо к главному корпусу. Я буду в лазарете, если понадоблюсь. Не пропадай!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Лена убегает к грузовику, на ходу отдавая команды санитарам. Вы остаётесь одни у ворот.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Квест "Доставка посылки" обновлён: "Ждать до вечера / Заняться другими делами".',
      },
    ],
    choices: [
      {
        id: 'lena_runs_to_infirmary',
        text: 'Кивнуть Лене и отойти от ворот.',
        effects: {
          flags: [
            { key: 'waiting_for_kruger', value: true },
            { key: 'visited_synthesis_campus', value: true },
          ],
          removeFlags: ['lena_accompanies_to_campus'],
          narrative: 'Квест "Доставка посылки" обновлён: "Ждать до вечера / Заняться другими делами".',
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },

  university_wait_evening: {
    id: 'university_wait_evening',
    background: '/images/backgrounds/freiburg_university_gate_evening.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Днём вас не пускают дальше ворот. Кампус живёт своей закрытой жизнью, а город вокруг кипит тревогой.',
      },
      {
        speaker: 'Рассказчик',
        text: 'До вечера ещё далеко. Нужно не терять время: найти ночлег, познакомиться с городом, решить чужие и свои проблемы.',
      },
    ],
    choices: [
      {
        id: 'go_to_market_from_university',
        text: 'Отойти от ворот и направиться к рыночной площади.',
        nextScene: 'market_square_arrival',
      },
      {
        id: 'check_pda_from_university',
        text: 'Проверить КПК и карту города.',
        nextScene: 'market_square_arrival',
      },
    ],
  },
}
