import type { Scene } from '../../../model/types'

/**
 * Сценарии для фракции Анархисты
 * 
 * Ключевые NPC: Асуа (разведчица), Вальдемар "Один" (лидер)
 * Квесты: anarchist_test
 * Локация: Августинерплац (Ваубан)
 */

const ANARCHIST_BACKGROUND = '/images/backgrounds/anarchist_quarter.jpg'
const LOOKOUT_BACKGROUND = '/images/backgrounds/rooftop_lookout.jpg'
const ASUA_SPRITE = '/images/npcs/asua.jpg'
const WALDEMAR_SPRITE = '/images/npcs/waldemar.jpg'

export const anarchistsScenes: Record<string, Scene> = {
  // =====================================
  // ПРЕДУПРЕЖДЕНИЕ НА ГРАНИЦЕ ТЕРРИТОРИИ
  // =====================================

  augustinerplatz_warning: {
    id: 'augustinerplatz_warning',
    background: ANARCHIST_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Августинерплац. Граффити покрывает каждую стену. Баррикады из мусора и обломков. Костры в железных бочках. И десятки глаз, следящих за каждым вашим шагом.',
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'ОНИ ВСЕ СМОТРЯТ! Они знают, что ты чужак! Уходи! УХОДИ НЕМЕДЛЕННО!',
        emotion: { primary: 'worried', intensity: 90 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Из темноты проулка выходит фигура. Молодой человек с бритой головой и татуировкой звезды на шее.',
      },
      {
        speaker: 'Незнакомец',
        text: '(Сплёвывает) Эй, турист. Заблудился? Или ищешь проблемы?',
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '(Едва слышно) Он проверяет тебя. Слабость — смерть здесь.',
        emotion: { primary: 'determined', intensity: 40 },
      },
    ],
    choices: [
      {
        id: 'stay_calm',
        text: '"Я просто осматриваюсь."',
        nextScene: 'anarchist_territory_calm',
      },
      {
        id: 'show_strength',
        text: '[АВТОРИТЕТ] "Я иду куда хочу." (Сложность 11)',
        presentation: {
          color: 'bold',
          icon: '👑',
          tooltip: 'Требуется АВТОРИТЕТ — очень сложно',
        },
        availability: {
          skillCheck: {
            skill: 'authority',
            difficulty: 11,
            successText: 'Он отступает...',
            failureText: 'Он смеётся тебе в лицо.',
          },
        },
        effects: {
          onSuccess: { nextScene: 'anarchist_territory_respect' },
          onFailure: { nextScene: 'anarchist_territory_mocked' },
        },
      },
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  anarchist_territory_calm: {
    id: 'anarchist_territory_calm',
    background: ANARCHIST_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Незнакомец',
        text: '(Щурится) Осматриваешься... Ладно, турист. Смотри. Но не трогай. И не лезь куда не просят.',
      },
      {
        speaker: 'Незнакомец',
        text: 'Хочешь пройти дальше — докажи, что ты не шпион FJR. Найди Асуа. Она на крыше старого склада. Если она решит, что ты нормальный — поговорим.',
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Проверка лояльности. Стандартная процедура для закрытых сообществ. Асуа — вероятно, их контролёр.',
        emotion: { primary: 'determined', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'find_asua',
        text: 'Найти Асуа.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'anarchist_territory_entered', value: true },
            { key: 'need_find_asua', value: true },
          ],
          narrative: 'Наблюдательный пост Асуа отмечен на карте.',
        },
      },
      {
        id: 'leave_for_now',
        text: 'Уйти пока.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  anarchist_territory_respect: {
    id: 'anarchist_territory_respect',
    background: ANARCHIST_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы смотрите ему прямо в глаза. Что-то в вашем взгляде заставляет его отступить на шаг.',
      },
      {
        speaker: 'Незнакомец',
        text: '(Присвистывает) Ладно, ладно. Характер есть. Может, ты и не полный мусор.',
      },
      {
        speaker: 'АВТОРИТЕТ',
        text: '[КРИТИЧЕСКИЙ УСПЕХ] Он признал твою силу. В этом мире это валюта.',
        emotion: { primary: 'determined', intensity: 80 },
      },
      {
        speaker: 'Незнакомец',
        text: 'Хочешь говорить с кем-то главным — найди Асуа. Крыша старого склада. Скажи, что Гвоздь пропустил. Она решит, достоин ли ты.',
      },
    ],
    choices: [
      {
        id: 'find_asua',
        text: 'Найти Асуа.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'anarchist_territory_entered', value: true },
            { key: 'need_find_asua', value: true },
            { key: 'gvozd_approved', value: true },
          ],
          narrative: 'Наблюдательный пост Асуа отмечен на карте.',
        },
      },
    ],
  },

  anarchist_territory_mocked: {
    id: 'anarchist_territory_mocked',
    background: ANARCHIST_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Незнакомец',
        text: '(Хохочет) Ты идёшь куда хочешь?! (К друзьям) Слышали, парни? У нас тут крутой!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Из темноты раздаётся смех. Несколько фигур выходят из укрытий.',
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: 'Они окружают! Ты в ловушке! БЕГИ!',
        emotion: { primary: 'worried', intensity: 95 },
      },
      {
        speaker: 'Незнакомец',
        text: '(Серьёзнеет) Слушай сюда, клоун. Здесь ты — никто. Хочешь остаться целым — уматывай. Хочешь доказать, что ты не пустое место — найди Асуа. Крыша склада. Она решит, что с тобой делать.',
      },
    ],
    choices: [
      {
        id: 'retreat',
        text: 'Тактически отступить.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'anarchist_territory_entered', value: true },
            { key: 'humiliated_by_anarchists', value: true },
          ],
        },
      },
      {
        id: 'find_asua_anyway',
        text: 'Найти Асуа.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'anarchist_territory_entered', value: true },
            { key: 'need_find_asua', value: true },
            { key: 'humiliated_by_anarchists', value: true },
          ],
          narrative: 'Наблюдательный пост Асуа отмечен на карте.',
        },
      },
    ],
  },

  // =====================================
  // ВСТРЕЧА С АСУА
  // =====================================

  asua_stargazer: {
    id: 'asua_stargazer',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Крыша старого склада. Ветер треплет выцветшие флаги. На краю, свесив ноги в пустоту, сидит молодая женщина.',
      },
      {
        speaker: 'ВОСПРИЯТИЕ',
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Она не обернулась, но её плечи чуть напряглись. Она знала, что ты идёшь, задолго до того, как ты появился.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Не оборачиваясь) Знаешь, иногда я смотрю на небо и думаю... Там, за облаками, всё ещё летают спутники. Мёртвые машины на орбите мёртвого мира.',
        emotion: { primary: 'sad', intensity: 50 },
      },
      {
        speaker: 'ИНТУИЦИЯ',
        text: '(Шёпот) ...она мечтает... о чём-то далёком... недостижимом...',
        emotion: { primary: 'sad', intensity: 40 },
      },
    ],
    choices: [
      {
        id: 'introduce_self',
        text: 'Представиться.',
        nextScene: 'asua_introduction',
      },
      {
        id: 'ask_about_stars',
        text: '"Ты любишь звёзды?"',
        nextScene: 'asua_dreams',
        effects: {
          xp: 5,
        },
      },
      {
        id: 'mention_gvozd',
        text: '"Гвоздь сказал, что ты решишь, достоин ли я."',
        nextScene: 'asua_test_mention',
        availability: {
          condition: { flag: 'gvozd_approved' },
        },
      },
    ],
  },

  asua_dreams: {
    id: 'asua_dreams',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Наконец оборачивается, её глаза светятся) Звёзды? Я люблю то, что они означают. Бесконечность. Возможности. Всё то, что мы потеряли.',
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '[ПАРАМЕТР: ГУМАНИСТЫ/ЭМПАТИЯ (Успех)] Она не на своём месте здесь. Её душа стремится к чему-то большему, чем баррикады и граффити.',
        emotion: { primary: 'sad', intensity: 55 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'До катастрофы я хотела стать астрофизиком. Смешно, да? Теперь я... разведчица в банде анархистов.',
        emotion: { primary: 'sad', intensity: 50 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Встряхивает головой) Но ты пришёл не за моими мечтами. Кто ты и чего хочешь?',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    nextScene: 'asua_introduction',
  },

  asua_introduction: {
    id: 'asua_introduction',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы коротко рассказываете о себе — новоприбывший, ищущий своё место в городе.',
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Изучающе смотрит) Ага. Ещё один потерянный. Фрайбург собирает таких, как магнит.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Слушай, я не Вальдемар. Я не буду читать тебе лекции о свободе и угнетении. Мне важно одно — можно ли тебе доверять.',
        emotion: { primary: 'determined', intensity: 65 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Она прагматик среди идеалистов. Это делает её ценной... и потенциально опасной.',
        emotion: { primary: 'determined', intensity: 75 },
      },
    ],
    choices: [
      {
        id: 'ask_about_trust',
        text: '"Как я могу доказать, что мне можно доверять?"',
        nextScene: 'asua_test_offer',
      },
      {
        id: 'ask_about_anarchists',
        text: '"Расскажи об Анархистах."',
        nextScene: 'asua_anarchist_info',
      },
      {
        id: 'ask_about_waldemar',
        text: '"Кто такой Вальдемар?"',
        nextScene: 'asua_waldemar_info',
      },
    ],
  },

  asua_test_mention: {
    id: 'asua_test_mention',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'surprised', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Поворачивается) Гвоздь пропустил? Хм. Значит, ты не совсем безнадёжен.',
        emotion: { primary: 'surprised', intensity: 60 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Ладно. Раз он за тебя поручился — поговорим. Но "достоин" — это ещё надо проверить.',
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    nextScene: 'asua_test_offer',
  },

  asua_test_offer: {
    id: 'asua_test_offer',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'determined', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Есть одно дело. FJR установили камеру наблюдения на углу Кайзерштрассе. Смотрит прямо на нашу территорию.',
        emotion: { primary: 'determined', intensity: 70 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Я хочу, чтобы ты её отключил. Не уничтожил — отключил. Аккуратно. Чтобы они думали, что это сбой, а не саботаж.',
        emotion: { primary: 'neutral', intensity: 65 },
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Интересно. Она не хочет открытой конфронтации с FJR. Умно. Тихий саботаж — их стиль.',
        emotion: { primary: 'excited', intensity: 65 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Сделаешь — и мы поговорим серьёзно. Может, даже познакомлю с Вальдемаром.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'accept_test',
        text: '"Где эта камера?"',
        nextScene: 'asua_quest_accepted',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'anarchist_test', action: 'start' } },
          ],
          flags: [
            { key: 'anarchist_test_active', value: true },
            { key: 'met_asua', value: true },
          ],
        },
      },
      {
        id: 'ask_why',
        text: '"Почему именно я?"',
        nextScene: 'asua_explains_choice',
      },
      {
        id: 'refuse',
        text: '"Саботаж против FJR? Это не моё."',
        nextScene: 'asua_refusal_response',
      },
    ],
  },

  asua_explains_choice: {
    id: 'asua_explains_choice',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Пожимает плечами) Потому что ты — чистый лист. FJR тебя не знает. Ты не в их базах. Если что-то пойдёт не так — ты просто случайный прохожий.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Отлично. Ты — расходный материал. Как неожиданно.',
        emotion: { primary: 'sad', intensity: 50 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'И ещё... (Тише) Я видела, как ты смотришь. Ты не фанатик. Ты думаешь. Такие люди мне нравятся больше.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'accept_after_explanation',
        text: '"Ладно. Покажи, где камера."',
        nextScene: 'asua_quest_accepted',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'anarchist_test', action: 'start' } },
          ],
          flags: [
            { key: 'anarchist_test_active', value: true },
            { key: 'met_asua', value: true },
          ],
        },
      },
      {
        id: 'still_refuse',
        text: '"Всё равно нет."',
        nextScene: 'asua_refusal_response',
      },
    ],
  },

  asua_quest_accepted: {
    id: 'asua_quest_accepted',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Почти улыбается) Хорошо. Камера на углу Кайзерштрассе и Бертольдштрассе. На фонарном столбе. Серая коробка с линзой.',
        emotion: { primary: 'happy', intensity: 55 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Тебе нужно добраться до распределительного блока в основании столба и отключить питание. Провод — синий. Не красный. Красный — сигнализация.',
        emotion: { primary: 'determined', intensity: 65 },
      },
      {
        speaker: 'ТЕХНОФИЛ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Синий — питание, красный — тревога. Стандартная разводка FJR. Просто.',
        emotion: { primary: 'excited', intensity: 70 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Когда сделаешь — возвращайся. Я буду здесь. Или... (Указывает на звёзды) ...смотреть на небо.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'go_to_camera',
        text: 'Отправиться к камере.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [{ key: 'destination_fjr_camera', value: true }],
          narrative: 'Камера FJR отмечена на карте.',
        },
      },
    ],
  },

  asua_refusal_response: {
    id: 'asua_refusal_response',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Отворачивается) Понятно. Ещё один, кто выбирает "безопасность". Не осуждаю. Просто... разочарована.',
        emotion: { primary: 'sad', intensity: 55 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Можешь уходить. Августинерплац не для тебя.',
        emotion: { primary: 'neutral', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
        effects: {
          flags: [
            { key: 'met_asua', value: true },
            { key: 'refused_anarchist_test', value: true },
          ],
        },
      },
      {
        id: 'reconsider',
        text: '"Подожди... Может, я погорячился."',
        nextScene: 'asua_second_chance',
      },
    ],
  },

  asua_second_chance: {
    id: 'asua_second_chance',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Поворачивается) Передумал? Быстро. Обычно люди уходят и не возвращаются.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Ладно. Одна попытка. Камера на Кайзерштрассе. Отключи её — и мы в расчёте.',
        emotion: { primary: 'determined', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'accept_finally',
        text: 'Принять задание.',
        nextScene: 'asua_quest_accepted',
        effects: {
          immediate: [
            { type: 'quest', data: { questId: 'anarchist_test', action: 'start' } },
          ],
          flags: [
            { key: 'anarchist_test_active', value: true },
            { key: 'met_asua', value: true },
          ],
        },
      },
    ],
  },

  asua_anarchist_info: {
    id: 'asua_anarchist_info',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Вздыхает) Анархисты... Мы те, кто не верит в иерархию. В лидеров. В систему, которая давит сверху.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'FJR говорит "порядок". Мы говорим "рабство". Они строят стены. Мы их ломаем.',
        emotion: { primary: 'determined', intensity: 65 },
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Идеология противостояния. В теории — красиво. На практике — хаос. Но в хаосе есть своя свобода.',
        emotion: { primary: 'neutral', intensity: 75 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Хотя... (Тише) Иногда я думаю, что мы просто ещё одна банда. С красивыми словами.',
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'back_to_talk',
        text: 'Продолжить разговор.',
        nextScene: 'asua_introduction',
      },
    ],
  },

  asua_waldemar_info: {
    id: 'asua_waldemar_info',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Вальдемар... "Один". Наш... (Замешкалась) ...лидер. Хотя он не любит это слово.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Он харизматичный. Умный. Опасный. Потерял глаз в стычке с FJR. Теперь носит повязку и зовёт себя "Один" — как скандинавский бог.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Один — верховный бог скандинавской мифологии. Пожертвовал глазом ради мудрости. Символично.',
        emotion: { primary: 'neutral', intensity: 70 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Он говорит о свободе... но иногда его свобода выглядит как диктатура. Парадокс, да?',
        emotion: { primary: 'sad', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'back_to_talk',
        text: 'Продолжить разговор.',
        nextScene: 'asua_introduction',
      },
    ],
  },

  // =====================================
  // ЗАВЕРШЕНИЕ КВЕСТА
  // =====================================

  asua_quest_complete: {
    id: 'asua_quest_complete',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'happy', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Проверяет данные на старом планшете) Камера отключена. Чисто. Профессионально.',
        emotion: { primary: 'happy', intensity: 65 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Неплохо. Ты справился лучше, чем я ожидала.',
        emotion: { primary: 'happy', intensity: 60 },
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '[ПАРАМЕТР: ГУМАНИСТЫ/ЭМПАТИЯ (Успех)] Она рада. Не просто "задание выполнено" — она рада, что ты оказался компетентным.',
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    nextScene: 'asua_reward',
  },

  asua_reward: {
    id: 'asua_reward',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Держи. (Протягивает небольшой свёрток) Немного кредитов и... кое-что особенное.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
      {
        speaker: 'Рассказчик',
        text: 'Внутри — деньги и небольшой электронный ключ.',
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Этот ключ откроет тебе двери на нашей территории. Не везде, но... достаточно.',
        emotion: { primary: 'determined', intensity: 65 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'И... Вальдемар хочет тебя видеть. Когда будешь готов — приходи в штаб. Скажи, что от меня.',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    choices: [
      {
        id: 'take_reward',
        text: 'Принять награду.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: 35 } },
            { type: 'item', data: { itemId: 'anarchist_access_key', amount: 1 } },
            { type: 'quest', data: { questId: 'anarchist_test', action: 'complete' } },
            { type: 'reputation', data: { faction: 'anarchists', delta: 20 } },
          ],
          flags: [
            { key: 'anarchist_contact', value: true },
            { key: 'can_meet_waldemar', value: true },
          ],
          xp: 25,
        },
      },
      {
        id: 'ask_about_waldemar_meeting',
        text: '"Что он от меня хочет?"',
        nextScene: 'asua_waldemar_meeting_info',
      },
    ],
  },

  asua_waldemar_meeting_info: {
    id: 'asua_waldemar_meeting_info',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Пожимает плечами) Не знаю. Он не говорит. Но... он интересуется всеми новичками, которые проходят мой тест.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Будь осторожен. Вальдемар умеет убеждать. А его убеждения... не всегда безобидны.',
        emotion: { primary: 'worried', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'take_reward_after_info',
        text: 'Поблагодарить и уйти.',
        nextScene: 'exit_to_map',
        effects: {
          immediate: [
            { type: 'currency', data: { amount: 35 } },
            { type: 'item', data: { itemId: 'anarchist_access_key', amount: 1 } },
            { type: 'quest', data: { questId: 'anarchist_test', action: 'complete' } },
            { type: 'reputation', data: { faction: 'anarchists', delta: 20 } },
          ],
          flags: [
            { key: 'anarchist_contact', value: true },
            { key: 'can_meet_waldemar', value: true },
            { key: 'asua_warned_about_waldemar', value: true },
          ],
          xp: 25,
        },
      },
    ],
  },

  // =====================================
  // ПОВТОРНЫЙ ВИЗИТ К АСУА
  // =====================================

  asua_return_visit: {
    id: 'asua_return_visit',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Улыбается) Эй. Снова ты. Пришёл смотреть на звёзды?',
        emotion: { primary: 'happy', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'talk_stars',
        text: '"Расскажи ещё о звёздах."',
        nextScene: 'asua_stars_talk',
      },
      {
        id: 'ask_about_synthesis',
        text: '"Ты упоминала, что хотела стать учёным..."',
        nextScene: 'asua_synthesis_interest',
        availability: {
          condition: { flag: 'heard_asua_dreams' },
        },
      },
      {
        id: 'ask_for_work',
        text: '"Есть ещё работа?"',
        nextScene: 'asua_more_work',
      },
      {
        id: 'leave',
        text: 'Уйти.',
        nextScene: 'exit_to_map',
      },
    ],
  },

  asua_stars_talk: {
    id: 'asua_stars_talk',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'happy', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Её глаза загораются) Знаешь, до катастрофы люди запустили тысячи спутников. Теперь они мёртвые, но всё ещё там. Кружат над нами.',
        emotion: { primary: 'happy', intensity: 65 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Иногда ночью, когда небо ясное, можно увидеть, как они пролетают. Маленькие точки света. Призраки прошлого.',
        emotion: { primary: 'sad', intensity: 50 },
      },
      {
        speaker: 'ИНТУИЦИЯ',
        text: '(Шёпот) ...она не здесь... она там, наверху... среди звёзд...',
        emotion: { primary: 'sad', intensity: 45 },
      },
    ],
    choices: [
      {
        id: 'back',
        text: 'Продолжить разговор.',
        nextScene: 'asua_return_visit',
        effects: {
          flags: [{ key: 'heard_asua_dreams', value: true }],
        },
      },
    ],
  },

  asua_synthesis_interest: {
    id: 'asua_synthesis_interest',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'sad', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Замирает) Ты запомнил... Да. Я хотела. Иногда... иногда я думаю о том, чтобы уйти. К Синтезу.',
        emotion: { primary: 'sad', intensity: 60 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Но Вальдемар... он не отпустит. Не то чтобы насильно держит, но... Здесь моя семья. Мои люди.',
        emotion: { primary: 'sad', intensity: 55 },
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '[ПАРАМЕТР: ГУМАНИСТЫ/ЭМПАТИЯ (Успех)] Она разрывается. Между мечтой и долгом. Между наукой и лояльностью.',
        emotion: { primary: 'sad', intensity: 60 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Встряхивает головой) Извини. Не стоит мне нагружать тебя своими проблемами.',
        emotion: { primary: 'neutral', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'offer_help',
        text: '"Если захочешь уйти — я могу помочь."',
        nextScene: 'asua_help_offer_response',
        effects: {
          flags: [{ key: 'offered_to_help_asua', value: true }],
        },
      },
      {
        id: 'respect_choice',
        text: '"Это твой выбор. Я уважаю его."',
        nextScene: 'asua_return_visit',
      },
    ],
  },

  asua_help_offer_response: {
    id: 'asua_help_offer_response',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'surprised', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: '(Удивлённо смотрит) Ты... серьёзно? (Отводит взгляд) Спасибо. Я... запомню это.',
        emotion: { primary: 'happy', intensity: 55 },
      },
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Может быть... однажды. Когда время будет правильным.',
        emotion: { primary: 'neutral', intensity: 50 },
      },
    ],
    choices: [
      {
        id: 'back',
        text: 'Продолжить разговор.',
        nextScene: 'asua_return_visit',
      },
    ],
  },

  asua_more_work: {
    id: 'asua_more_work',
    background: LOOKOUT_BACKGROUND,
    characters: [
      {
        id: 'asua',
        name: 'Асуа',
        position: 'center',
        sprite: ASUA_SPRITE,
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    dialogue: [
      {
        speaker: 'Асуа',
        characterId: 'asua',
        text: 'Работа? Да, кое-что есть. Но это уже серьёзнее. Поговори с Вальдемаром — он распределяет задания.',
        emotion: { primary: 'neutral', intensity: 55 },
      },
    ],
    choices: [
      {
        id: 'back',
        text: 'Понятно.',
        nextScene: 'asua_return_visit',
      },
    ],
  },
}







