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
            skill: 'knowledge',
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

  // =====================================
  // ШВАБСКАЯ ПЛОЩАДЬ — КАРАПУЗ (aliased id for map point seeds)
  // =====================================

  karapuz_meeting: {
    id: 'karapuz_meeting',
    background: '/images/backgrounds/freiburg_shvabskaya_square.jpg',
    characters: [
      {
        id: 'karapuz',
        name: 'Карапуз',
        position: 'center',
        emotion: { primary: 'happy', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Швабская площадь гудит, как улей. Палатки, костры, разношёрстный люд. На импровизированном «троне» из ящиков восседает Карапуз.',
      },
      {
        speaker: 'Карапуз',
        characterId: 'karapuz',
        text: 'О-хо-хо! Вижу, FJR тебя не пустили? У них сегодня нервный тик. Садись, рассказывай.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Карапуз с улыбкой рассказывает, кто кому платит и почему «честных сделок» не бывает. Но одну вещь говорит прямо: если хочешь выжить — учись договариваться.',
      },
    ],
    choices: [
      {
        id: 'karapuz_leave',
        text: 'Кивнуть и уйти.',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['met_karapuz'],
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },

  // =====================================
  // БАР ЛЮДЫ — СТАРТ КВЕСТА "ЛАВОЧНИК-ПРОГУЛЬЩИК"
  // =====================================

  luda_introduction: {
    id: 'luda_introduction',
    background: '/images/backgrounds/freiburg_ludas_bar.jpg',
    characters: [
      {
        id: 'lyuda',
        name: 'Люда',
        position: 'center',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты заходишь в бар. Тепло, полумрак. Пахнет грибным супом и печёной картошкой — роскошь по местным меркам.',
      },
      {
        speaker: 'Рассказчик',
        condition: { flag: 'schwabentor_blocked' },
        text: 'Шмидт с ворот послал: «переждать» и «не мозолить глаза».',
      },
      {
        speaker: 'Люда',
        characterId: 'lyuda',
        text: 'Новое лицо. Заблудился или целенаправленно?',
      },
      {
        speaker: 'Люда',
        characterId: 'lyuda',
        emotion: { primary: 'amused', intensity: 50 },
        text: 'Хочешь сидеть — закажи что-нибудь. У нас тут не вокзал.',
      },
      {
        speaker: 'Люда',
        characterId: 'lyuda',
        text: '(Понижает голос) А если ищешь, чем заняться... у меня проблема. Ларс, местный лавочник, пропал. Должен был занести долг за выпивку — и как сквозь землю провалился.',
      },
      {
        speaker: 'Люда',
        characterId: 'lyuda',
        text: 'В последний раз его видели вчера вечером. Он шёл к своей зазнобе — Элке. Если найдёшь его или узнаешь, что случилось — с меня ужин и ночлег бесплатно.',
      },
    ],
    choices: [
      {
        id: 'luda_accept_quest',
        text: 'Согласиться поискать Ларса.',
        nextScene: 'exit_to_map',
        availability: {
          condition: {
            notFlags: ['shopkeeper_truant_active', 'shopkeeper_truant_completed'],
          },
        },
        effects: {
          addFlags: ['met_lyuda', 'shopkeeper_truant_active', 'know_shopkeeper_location'],
          immediate: [{ type: 'open_map' }],
          xp: 5,
        },
      },
      {
        id: 'luda_decline_quest',
        text: 'Отказаться: "Извини, я не детектив."',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['met_lyuda'],
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },

  // =====================================
  // ДОХОДНЫЙ ДОМ — КОМНАТА 3Б (ЭЛКЕ)
  // =====================================

  tenement_3b_investigation: {
    id: 'tenement_3b_investigation',
    background: '/images/backgrounds/freiburg_tenement_room.jpg',
    characters: [
      {
        id: 'elke',
        name: 'Элке',
        position: 'center',
        emotion: { primary: 'worried', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Сектор Артисанов — лабиринт из красного кирпича и ржавых труб. Доходный дом встречает запахом сырости и варёной капусты.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Третий этаж. Дверь 3Б. Музыка внутри обрывается, и через секунду дверь приоткрывается на цепочке.',
      },
      {
        speaker: 'Элке',
        characterId: 'elke',
        text: 'Кто вы? Я никого не жду...',
      },
    ],
    choices: [
      {
        id: 'elke_truth',
        text: '"Меня прислала Люда. Я ищу Ларса."',
        nextScene: 'tenement_3b_where_went',
      },
      {
        id: 'elke_authority',
        text: '[АВТОРИТЕТ] "Открывай. Разговор есть."',
        nextScene: 'tenement_3b_where_went',
      },
      {
        id: 'elke_trick',
        text: '[ХИТРОСТЬ] "Доставка для Ларса. Срочная."',
        nextScene: 'tenement_3b_where_went',
      },
    ],
  },

  tenement_3b_where_went: {
    id: 'tenement_3b_where_went',
    background: '/images/backgrounds/freiburg_tenement_room.jpg',
    characters: [
      {
        id: 'elke',
        name: 'Элке',
        position: 'center',
        emotion: { primary: 'worried', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Имя Люды действует почти магически. Элке убирает цепочку и впускает тебя внутрь. Комната маленькая, бедная, но чистая. На столе — две кружки.',
      },
      {
        speaker: 'Вы',
        text: 'Куда он пошёл? Говорил что-нибудь конкретное?',
      },
      {
        speaker: 'Элке',
        characterId: 'elke',
        text: '(Тихо) Нет... Только про «золотую жилу». Место, где много довоенной меди. Боялся, что я проболтаюсь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'У ножки кровати валяется скомканная бумажка. Элке будто её не замечает.',
      },
    ],
    choices: [
      {
        id: 'elke_dex_trick',
        text: '[ЛОВКОСТЬ] Отвлечь её и незаметно поднять бумажку.',
        nextScene: 'tenement_3b_note_taken',
      },
      {
        id: 'elke_leave',
        text: 'Не давить и уйти.',
        nextScene: 'exit_to_map',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  tenement_3b_note_taken: {
    id: 'tenement_3b_note_taken',
    background: '/images/backgrounds/freiburg_tenement_room.jpg',
    characters: [
      {
        id: 'elke',
        name: 'Элке',
        position: 'center',
        emotion: { primary: 'worried', intensity: 75 },
      },
    ],
    dialogue: [
      {
        speaker: 'Вы',
        text: 'Простите... у вас там, кажется, огромный паук ползёт.',
      },
      {
        speaker: 'Элке',
        characterId: 'elke',
        text: 'Где?!',
      },
      {
        speaker: 'Рассказчик',
        text: '[ЛОВКОСТЬ: УСПЕХ] Пока она в панике ищет несуществующего паука, ты подбираешь бумажку и прячешь в карман.',
      },
      {
        speaker: 'Вы',
        text: 'Можно я ещё осмотрюсь? Вдруг он оставил подсказку.',
      },
      {
        speaker: 'Элке',
        characterId: 'elke',
        text: 'Нет! Пожалуйста, уходите. Я вам всё рассказала.',
      },
      {
        speaker: 'Рассказчик',
        text: 'В коридоре ты разглаживаешь бумажку. Это долговая расписка: «250 энергокредитов. Срок — 24 часа». Внизу печать — череп с игральной костью в зубах.',
      },
      {
        speaker: 'ЭНЦИКЛОПЕДИЯ',
        text: 'Печать игорного клуба «Дыра». Место с дурной славой, в подвалах района Анархистов.',
      },
      {
        speaker: 'ЛОГИКА',
        text: 'Картина складывается. Ларс задолжал бандитам. Чтобы расплатиться, полез искать «медь» там, где нормальные люди не ходят.',
      },
      {
        speaker: 'Рассказчик',
        text: 'КВЕСТ ОБНОВЛЁН: «Лавочник-прогульщик». Новая цель: посетить клуб «Дыра».',
      },
    ],
    choices: [
      {
        id: 'go_to_hole',
        text: 'Направиться в район Анархистов.',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['tenement_evidence_found'],
          immediate: [{ type: 'open_map' }],
          xp: 5,
        },
      },
    ],
  },

  // =====================================
  // КЛУБ "ДЫРА" — ШРАМ
  // =====================================

  hole_club_entry: {
    id: 'hole_club_entry',
    background: '/images/backgrounds/freiburg_hole_club.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Район Анархистов встречает граффити, косыми взглядами и запахом дешёвого алкоголя. «Дыра» прячется в подвале старого склада. На входе — двое амбалов.',
      },
      {
        speaker: 'Охранник',
        text: 'Вход платный. Или по приглашению.',
      },
    ],
    choices: [
      {
        id: 'hole_pay',
        text: 'Заплатить за вход (10 кредитов).',
        nextScene: 'hole_club_scar_meeting',
      },
      {
        id: 'hole_show_note',
        text: 'Показать расписку: "Я по поводу Ларса."',
        nextScene: 'hole_club_scar_meeting',
      },
      {
        id: 'hole_leave',
        text: 'Развернуться и уйти.',
        nextScene: 'exit_to_map',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  hole_club_scar_meeting: {
    id: 'hole_club_scar_meeting',
    background: '/images/backgrounds/freiburg_hole_club.jpg',
    characters: [
      {
        id: 'scar',
        name: 'Шрам',
        position: 'center',
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Подвал густой от дыма, пахнет потом и спиртом. За столами играют в кости. В дальнем углу сидит крупный мужчина со шрамом через лицо и ножом в руке.',
      },
      {
        speaker: 'Шрам',
        characterId: 'scar',
        text: 'Чего тебе?',
      },
    ],
    choices: [
      {
        id: 'scar_ask_lars',
        text: '"Я ищу Ларса. Знаю, что он должен вам денег."',
        nextScene: 'hole_club_scar_deal',
      },
      {
        id: 'scar_leave',
        text: 'Не лезть на рожон и уйти.',
        nextScene: 'exit_to_map',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  hole_club_scar_deal: {
    id: 'hole_club_scar_deal',
    background: '/images/backgrounds/freiburg_hole_club.jpg',
    characters: [
      {
        id: 'scar',
        name: 'Шрам',
        position: 'center',
        emotion: { primary: 'angry', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Шрам',
        characterId: 'scar',
        text: 'Должен. Двести пятьдесят. Вчера срок вышел. А ты кто такой? Его ангел-хранитель?',
      },
      {
        speaker: 'Шрам',
        characterId: 'scar',
        text: 'Платишь — скажу, где он. Не платишь — вали отсюда, пока цел.',
      },
    ],
    choices: [
      {
        id: 'scar_offer_service',
        text: '"А если я предложу услугу взамен информации?"',
        nextScene: 'hole_club_failed_negotiation',
      },
      {
        id: 'scar_no_money',
        text: '"У меня нет денег. Я найду его сам."',
        nextScene: 'hole_club_failed_negotiation',
      },
    ],
  },

  hole_club_failed_negotiation: {
    id: 'hole_club_failed_negotiation',
    background: '/images/backgrounds/freiburg_hole_club.jpg',
    characters: [
      {
        id: 'scar',
        name: 'Шрам',
        position: 'center',
        emotion: { primary: 'angry', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Шрам',
        characterId: 'scar',
        text: '(Хохочет) Услугу? Ты мне? Скучно. Вали отсюда. Ищи своего Ларса сам, если жить надоело.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты выходишь на улицу. Уже темнеет.',
      },
      {
        speaker: 'ЛОГИКА',
        text: 'Если он искал «медь», то полез в старые технические тоннели под городом. Вход должен быть где-то рядом, у реки.',
      },
      {
        speaker: 'Рассказчик',
        text: 'КВЕСТ ОБНОВЛЁН: «Лавочник-прогульщик». Новая цель: найти вход в коллекторы.',
      },
    ],
    choices: [
      {
        id: 'go_collectors',
        text: 'Идти к каналу и искать люк.',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['collector_entrance_found'],
          immediate: [{ type: 'open_map' }],
          xp: 5,
        },
      },
    ],
  },

  // =====================================
  // КОЛЛЕКТОРЫ — СПАСЕНИЕ ЛАРСА
  // =====================================

  collectors_techroom_rescue: {
    id: 'collectors_techroom_rescue',
    background: '/images/backgrounds/freiburg_collectors.jpg',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Под мостом ты находишь сдвинутую решётку коллектора. Внизу темно, сыро и воняет гнилью. Фонарик КПК выхватывает ржавые трубы и бетон.',
      },
      {
        speaker: 'Рассказчик',
        text: 'За поворотом — техническая камера. В углу сидит Ларс, живой, но испуганный. Перед ним — два сутулых существа. Гули. Они шипят, готовясь к прыжку.',
      },
    ],
    choices: [
      {
        id: 'collectors_fight',
        text: '[БОЙ] Атаковать гулей.',
        nextScene: 'collectors_after_escape',
      },
      {
        id: 'collectors_stealth',
        text: '[СКРЫТНОСТЬ] Кинуть камень в другую сторону, чтобы отвлечь их.',
        nextScene: 'collectors_after_escape',
      },
      {
        id: 'collectors_leave',
        text: 'Уйти. Ларс обречён.',
        nextScene: 'exit_to_map',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  collectors_after_escape: {
    id: 'collectors_after_escape',
    background: '/images/backgrounds/freiburg_collectors.jpg',
    characters: [
      {
        id: 'lars',
        name: 'Ларс',
        position: 'center',
        emotion: { primary: 'worried', intensity: 75 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты действуешь быстро: отвлекаешь тварей и даёшь Ларсу шанс. Вы вырываетесь наружу, задыхаясь, и падаете у канала.',
      },
      {
        speaker: 'Ларс',
        characterId: 'lars',
        text: 'Спасибо... Я думал, сожрут.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он показывает моток блестящей медной проволоки — «золотую жилу». Глаза горят лихорадочно.',
      },
      {
        speaker: 'Ларс',
        characterId: 'lars',
        text: 'Я сам к нему пойду, деньги отдам. Только не говори, где я это нашёл. Я с тобой поделюсь. Дам... пятьдесят кредитов!',
      },
    ],
    choices: [
      {
        id: 'lars_bribe_accept',
        text: '"Идёт. 50 кредитов — и я тебя не видел."',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['shopkeeper_truant_completed', 'shopkeeper_truant_bribed'],
          removeFlags: ['shopkeeper_truant_active'],
          immediate: [{ type: 'open_map' }],
          xp: 10,
        },
      },
      {
        id: 'lars_take_to_scar',
        text: '"Нет. Мы идём к Шраму вместе. Я должен убедиться, что вопрос закрыт."',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['need_return_to_scar'],
          immediate: [{ type: 'open_map' }],
        },
      },
      {
        id: 'lars_flee',
        text: '"Забирай свою медь и вали из города. Здесь тебе жизни не дадут."',
        nextScene: 'exit_to_map',
        effects: {
          addFlags: ['shopkeeper_truant_completed', 'lars_fled_city'],
          removeFlags: ['shopkeeper_truant_active'],
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },
}
