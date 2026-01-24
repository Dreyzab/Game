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
        text: 'Ты направляешься к воротам. Город живёт своей жизнью, но чем ближе ты к окраине, тем меньше людей и больше патрулей FJR. Ворота Швабентор — это массивная арка, перекрытая баррикадами.',
      },
      {
        speaker: 'Рассказчик',
        text: 'У шлагбаума стоит капрал Шмидт. Он выглядит усталым, курит, глядя на туман, ползущий с горы. Ты подходишь и протягиваешь записку Дитера. Шмидт берёт её, читает, и его лицо мрачнеет.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'От Дитера? Неугомонный старик... Слушай, парень. Не сегодня.',
      },
      {
        speaker: 'Вы',
        text: 'Что значит "не сегодня"?',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        emotion: { primary: 'tired', intensity: 60 },
        text: 'То и значит. Приказ коменданта: "Красный код". Никого не выпускать, никого не впускать. На горе что-то случилось ночью. Дрожь земли, вспышки. Иди гуляй до завтра.',
      },
      {
        speaker: 'Вы',
        text: 'Дитер сказал, это срочно.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'Для Дитера всё срочно. А для меня срочно — это когда мутанты на стены лезут. Свободен. — Шмидт возвращает записку.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'Если некуда деться — иди к Люде в бар "Последний приют", это тут рядом, через канал. Или найди Карапуза на Швабской площади. Они подскажут, чем убить время.',
      },
    ],
    choices: [
      {
        id: 'go_to_ludas_bar',
        text: 'Пойти в бар "Последний приют" к Люде.',
        nextScene: 'luda_introduction',
        effects: {
          addFlags: ['schwabentor_blocked', 'whispers_delayed_until_morning', 'need_kill_time_in_city'],
        },
      },
      {
        id: 'go_to_karapuz',
        text: 'Пойти на Швабскую площадь к Карапузу.',
        nextScene: 'karapuz_square_meeting',
        effects: {
          addFlags: ['schwabentor_blocked', 'whispers_delayed_until_morning', 'need_kill_time_in_city'],
        },
      },
      {
        id: 'go_to_university',
        text: 'Вернуться в Университет и поискать Лену.',
        nextScene: 'university_campus_arrival',
        effects: {
          addFlags: ['schwabentor_blocked', 'whispers_delayed_until_morning', 'need_kill_time_in_city'],
        },
      },
    ],
  },

  schwabentor_morning_open: {
    id: 'schwabentor_morning_open',
    background: '/images/backgrounds/forest_encounter.jpg',
    characters: [
      {
        id: 'schmidt',
        name: 'Капрал Шмидт',
        position: 'center',
        sprite: '/images/npcs/trader.jpg',
        emotion: { primary: 'tired', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Утро встречает Фрайбург холодом и сыростью. Туман с горы всё ещё стелется к воротам, но у КПП уже не такая нервная суета: патрули перестали дёргаться на каждый шорох.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Шмидт узнаёт тебя ещё до того, как ты успеваешь открыть рот. Он бросает короткий взгляд на бумагу с печатью Артисанов и раздражённо втягивает воздух через зубы.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'Опять ты. И опять Дитер.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: '«Красный код» сняли. Теперь — «жёлтый». Это значит: если тебя там сожрут — у меня, наконец, станет на одного рапорта меньше.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он достаёт из планшета тонкую пластиковую карточку с штампом и кидает тебе. На ней — твоя физиономия (примерно) и слово «ВРЕМЕННО».',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'Пропуск на выход. И слушай внимательно: только по туристической тропе. В лес — ни шагу. В лесу сейчас… нестабильно.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        emotion: { primary: 'serious', intensity: 70 },
        text: 'Если услышишь шёпот — не отвечай. Если увидишь свет — не смотри долго. И не геройствуй: возвращайся, если станет жарко.',
      },
    ],
    choices: [
      {
        id: 'depart_now',
        text: 'Кивнуть и выйти за ворота — на тропу к Шлосбергу.',
        nextScene: 'schlossberg_trail_entry',
        effects: {
          addFlags: ['schlossberg_access_granted', 'schmidt_pass_granted'],
          removeFlags: ['whispers_delayed_until_morning', 'need_kill_time_in_city'],
          xp: 10,
        },
      },
      {
        id: 'depart_later',
        text: 'Спрятать пропуск и вернуться в город (пока не поздно).',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['schlossberg_access_granted', 'schmidt_pass_granted'],
          removeFlags: ['whispers_delayed_until_morning', 'need_kill_time_in_city'],
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },

  schwabentor_departure_ready: {
    id: 'schwabentor_departure_ready',
    background: '/images/backgrounds/forest_encounter.jpg',
    characters: [
      {
        id: 'schmidt',
        name: 'Капрал Шмидт',
        position: 'center',
        sprite: '/images/npcs/trader.jpg',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Швабентор встречает тебя знакомым запахом мокрого камня и табака. Шлагбаум приподнят, но караул всё так же смотрит на тропу, как на пасть зверя.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'Пропуск есть — проходи. Только не устраивай там салют.',
      },
    ],
    choices: [
      {
        id: 'go_out',
        text: 'Выйти за ворота и подняться на Шлосберг.',
        nextScene: 'schlossberg_trail_entry',
      },
      {
        id: 'leave',
        text: 'Пока передумать и вернуться в город.',
        nextScene: 'exit_to_map',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  schwabentor_closed_repeat: {
    id: 'schwabentor_closed_repeat',
    background: '/images/backgrounds/freiburg_schwabentor_gate.jpg',
    characters: [
      {
        id: 'schmidt',
        name: 'Капрал Шмидт',
        position: 'center',
        sprite: '/images/characters/schmidt.png',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ворота всё ещё закрыты. «Красный код» не снимают. Патрули нервные, разговоры короткие.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'Я же сказал — до завтра. Не испытывай терпение.',
      },
    ],
    choices: [
      {
        id: 'leave_gate',
        text: 'Отойти от ворот.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },
}
