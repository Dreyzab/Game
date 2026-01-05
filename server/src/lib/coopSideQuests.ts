import type { CoopQuestNode } from '../shared/types/coop'

// Side quests live in their own module so the main scenario graph can stay maintainable
// as content grows. The graph engine merges these nodes with the main story nodes.
export const COOP_SIDE_QUEST_NODES: Record<string, CoopQuestNode> = {
  // Example side quest: a short detour that returns the party back to the caller node.
  sq_signal_cache_start: {
    id: 'sq_signal_cache_start',
    title: 'Побочный квест: аварийный сигнал',
    description: `
На маршруте мелькает короткий импульс — будто чей‑то аварийный маяк.
Сигнал слабый и «грязный», но источник близко: в стороне от основной тропы.
`,
    interactionType: 'sync',
    choices: [
      {
        id: 'sq_signal_cache_go',
        text: 'Проверить источник сигнала',
        nextNodeId: 'sq_signal_cache_vote',
      },
    ],
  },

  sq_signal_cache_vote: {
    id: 'sq_signal_cache_vote',
    title: 'Источник сигнала',
    description: `
У опушки — обломки корпуса и следы экстренной посадки. Внутри что‑то может быть полезное…
или опасное.
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_signal_cache_search',
        text: 'Обыскать аккуратно и тихо',
        nextNodeId: 'sq_signal_cache_outcome_search',
        baseScore: 12,
        classMultipliers: { vorschlag: 1.2, ghost: 1.2, valkyrie: 1.0, shustrya: 1.0 },
        scoreTags: ['knowledge', 'perception'],
      },
      {
        id: 'sq_signal_cache_force',
        text: 'Взять силой: вскрыть и забрать всё ценное',
        nextNodeId: 'sq_signal_cache_outcome_force',
        baseScore: 10,
        classMultipliers: { shustrya: 1.5, ghost: 1.0, vorschlag: 0.8, valkyrie: 1.0 },
        scoreTags: ['strength', 'combat'],
      },
      {
        id: 'sq_signal_cache_leave',
        text: 'Не рисковать — уходим',
        nextNodeId: 'sq_signal_cache_outcome_leave',
        baseScore: 8,
        classMultipliers: { valkyrie: 1.2, vorschlag: 1.0, ghost: 1.0, shustrya: 1.0 },
        scoreTags: ['caution'],
      },
    ],
  },

  sq_signal_cache_outcome_search: {
    id: 'sq_signal_cache_outcome_search',
    title: 'Находка',
    description: `
Вы находите контейнер с расходниками и блоком питания. Ничего не взрывается — удача.
`,
    interactionType: 'sync',
    choices: [
      {
        id: 'sq_signal_cache_to_return',
        text: 'Далее',
        nextNodeId: 'sq_signal_cache_return',
      },
    ],
  },

  sq_signal_cache_outcome_force: {
    id: 'sq_signal_cache_outcome_force',
    title: 'Шум',
    description: `
Вскрытие получается быстро, но шум расходится по лесу. Вдали отвечает чей‑то отклик.
`,
    interactionType: 'sync',
    choices: [
      {
        id: 'sq_signal_cache_to_return',
        text: 'Далее',
        nextNodeId: 'sq_signal_cache_return',
      },
    ],
  },

  sq_signal_cache_outcome_leave: {
    id: 'sq_signal_cache_outcome_leave',
    title: 'Отступление',
    description: `
Вы решаете не тратить время. Сигнал гаснет, будто кто‑то выдернул батарею.
`,
    interactionType: 'sync',
    choices: [
      {
        id: 'sq_signal_cache_to_return',
        text: 'Далее',
        nextNodeId: 'sq_signal_cache_return',
      },
    ],
  },

  sq_signal_cache_return: {
    id: 'sq_signal_cache_return',
    title: 'Возвращение',
    description: `
Крюк завершён. Пора возвращаться к основному маршруту.
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_signal_cache_return_choice',
        text: 'Вернуться к группе и продолжить путь',
        action: 'return',
        questId: 'signal_cache',
      },
    ],
  },

  sq_fog_song_start: {
    id: 'sq_fog_song_start',
    title: 'Сайд‑квест: Песнь тумана',
    description: `
Ночью над туманной долиной за Фрайбургом плывёт мелодия — не музыка и не крик.
Её слышно только на границе света костра: стоит отойти — и звук становится ближе, будто зовёт по имени.

Говорят, в лесу есть заброшенная часовня. Там прячется «Хранитель Тумана».
А ещё говорят, что у сирены — хрустальные глаза.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_fog_song_to_path', text: 'Проверить', nextNodeId: 'sq_fog_song_path_vote' }],
  },

  sq_fog_song_path_vote: {
    id: 'sq_fog_song_path_vote',
    title: 'Туманная долина',
    description: `
Туман стелется по земле, как живая ткань. Вдали дрожат огоньки — не костры, а будто светлячки‑искра.
Мелодия то пропадает, то возвращается, оставляя ощущение, что кто‑то идёт рядом.
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_fog_song_follow',
        text: 'Следовать за песней в глубь тумана',
        nextNodeId: 'sq_fog_song_chapel',
        baseScore: 10,
        classMultipliers: { ghost: 1.2, vorschlag: 1.0, valkyrie: 1.0, shustrya: 1.0 },
        scoreTags: ['investigation', 'visual'],
      },
      {
        id: 'sq_fog_song_abort',
        text: 'Не рисковать — вернуться к лагерю',
        nextNodeId: 'sq_fog_song_abort_sync',
        baseScore: 6,
        classMultipliers: { valkyrie: 1.2, vorschlag: 1.0, ghost: 1.0, shustrya: 1.0 },
        scoreTags: ['caution'],
        flags: { sq_fog_song_outcome: 'ignored' },
      },
    ],
  },

  sq_fog_song_abort_sync: {
    id: 'sq_fog_song_abort_sync',
    title: 'Статус‑кво',
    description: `
Вы возвращаетесь к свету и теплу. Песня стихает так, будто её и не было.
В голове остаётся неприятная мысль: «а если это было важно?»
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_fog_song_to_return', text: 'Далее', nextNodeId: 'sq_fog_song_return' }],
  },

  sq_fog_song_chapel: {
    id: 'sq_fog_song_chapel',
    title: 'Заброшенная часовня',
    description: `
Часовня вырастает из тумана внезапно — тёмный силуэт среди деревьев, камень влажный, как кожа.
Внутри — свечи без огня и рисунки, которые хочется забыть.

На алтаре сидит девочка. Глаза у неё действительно хрустальные.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_fog_song_to_offer', text: 'Слушать', nextNodeId: 'sq_fog_song_offer_vote' }],
  },

  sq_fog_song_offer_vote: {
    id: 'sq_fog_song_offer_vote',
    title: 'Обмен',
    description: `
Она говорит тихо — и голос звучит как та самая песня.

«Освободи меня. Найди то, что осталось от меня в тумане… и я покажу, где разлом рвётся следующим».
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_fog_song_help',
        text: 'Помочь и освободить дух',
        nextNodeId: 'sq_fog_song_outcome_help',
        baseScore: 12,
        classMultipliers: { shustrya: 1.5, valkyrie: 1.2, vorschlag: 1.0, ghost: 1.0 },
        scoreTags: ['social', 'empathy'],
        flags: {
          sq_fog_song_outcome: 'helped',
          intel_next_rift_hint: true,
          bonus_charisma: 1,
          artifact_amulet_calm: 1,
        },
      },
      {
        id: 'sq_fog_song_betray',
        text: 'Обмануть/убить дух и забрать силу',
        nextNodeId: 'sq_fog_song_outcome_betray',
        baseScore: 12,
        classMultipliers: { shustrya: 1.5, ghost: 1.2, vorschlag: 1.0, valkyrie: 0.8 },
        scoreTags: ['social', 'drama'],
        flags: {
          sq_fog_song_outcome: 'betrayed',
          artifact_glowing_bullet: 1,
          strain_delta: 15,
        },
      },
    ],
  },

  sq_fog_song_outcome_help: {
    id: 'sq_fog_song_outcome_help',
    title: 'Свобода',
    description: `
Туман дрожит, будто делает вдох. Песня становится тише — спокойнее.

Девочка кивает и шепчет подсказку — не цифры, а образы: «высохшее русло», «камень с трещиной», «пахнет железом».
На ладони остаётся амулет — тёплый, как уголь.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_fog_song_to_return', text: 'Далее', nextNodeId: 'sq_fog_song_return' }],
  },

  sq_fog_song_outcome_betray: {
    id: 'sq_fog_song_outcome_betray',
    title: 'Цена',
    description: `
Свет в часовне гаснет, и на секунду кажется, что туман стал гуще.

Вы получаете то, за чем пришли: «светящуюся пулю»/осколок, который прожигает тьму.
Но где‑то внутри остаётся трещина — не на камне, а в вас.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_fog_song_to_return', text: 'Далее', nextNodeId: 'sq_fog_song_return' }],
  },

  sq_fog_song_return: {
    id: 'sq_fog_song_return',
    title: 'Возвращение',
    description: `
Крюк завершён. Пора возвращаться к основному плану.
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_fog_song_return_choice',
        text: 'Вернуться к группе',
        action: 'return',
        questId: 'fog_song',
      },
    ],
  },

  sq_drone_shards_start: {
    id: 'sq_drone_shards_start',
    title: 'Сайд‑квест: Осколки дрона',
    description: `
В лесу находят обломки экспериментального разведдрона. Корпус обгорел, камера вырвана, память — неизвестно где.
По слухам, дрон упал из‑за электромагнитного поля… или из‑за атаки чего‑то, что хватало аппарат за камеру.

Инженер Мартин обещает чудеса, если вы принесёте ему хотя бы плату. Торговец Хак хочет железо. У FJR свои мотивы.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_drone_shards_to_vote', text: 'Осмотреть место', nextNodeId: 'sq_drone_shards_vote' }],
  },

  sq_drone_shards_vote: {
    id: 'sq_drone_shards_vote',
    title: 'Поляна с обломками',
    description: `
Поляна пахнет озоном и гарью. Среди обгоревших доспехов — части дрона: питание, куски рамы, фрагменты платы.
На металле есть следы… не от когтей. От чего‑то вроде механических пальцев.
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_drone_shards_recover',
        text: 'Собрать и исследовать обломки (риск искажения)',
        nextNodeId: 'sq_drone_shards_outcome_recover',
        baseScore: 10,
        classMultipliers: { vorschlag: 1.5, valkyrie: 1.2, ghost: 0.8, shustrya: 0.5 },
        scoreTags: ['knowledge', 'tech'],
        flags: {
          sq_drone_shards_outcome: 'recovered',
          intel_drone_data: true,
          tech_aim_module: 1,
          strain_delta: 8,
        },
      },
      {
        id: 'sq_drone_shards_destroy',
        text: 'Уничтожить дрона напоследок (безопаснее)',
        nextNodeId: 'sq_drone_shards_outcome_destroy',
        baseScore: 10,
        classMultipliers: { ghost: 1.5, shustrya: 1.2, vorschlag: 1.0, valkyrie: 1.0 },
        scoreTags: ['combat', 'precision'],
        flags: {
          sq_drone_shards_outcome: 'destroyed',
          ammo_special_round: 1,
        },
      },
    ],
  },

  sq_drone_shards_outcome_recover: {
    id: 'sq_drone_shards_outcome_recover',
    title: 'Данные',
    description: `
Память удаётся восстановить частично. Кадры рвутся, звук скрипит, но среди помех проступают метки и координаты.

Вместе с ними приходит неприятный побочный эффект: иногда в углу зрения вспыхивает чужая запись — будто дрон смотрит вашими глазами.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_drone_shards_to_return', text: 'Далее', nextNodeId: 'sq_drone_shards_return' }],
  },

  sq_drone_shards_outcome_destroy: {
    id: 'sq_drone_shards_outcome_destroy',
    title: 'Пепел',
    description: `
Вы сжигаете остатки и закапываете то, что не горит. Никаких помех. Никаких «видений».
Только ощущение, что где‑то осталась правда — и вы сами её уничтожили.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_drone_shards_to_return', text: 'Далее', nextNodeId: 'sq_drone_shards_return' }],
  },

  sq_drone_shards_return: {
    id: 'sq_drone_shards_return',
    title: 'Возвращение',
    description: `
Крюк завершён. Пора возвращаться к основному плану.
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_drone_shards_return_choice',
        text: 'Вернуться к группе',
        action: 'return',
        questId: 'drone_shards',
      },
    ],
  },

  sq_catacombs_start: {
    id: 'sq_catacombs_start',
    title: 'Сайд‑квест: Тени катакомб',
    description: `
В подземельях кафедрального собора настоятель Иероним просит помочь изгнать нечто злобное.
В катакомбах хранится урна с прахом мага‑ритуалиста: говорят, его проклятие вызывает дрожь земли у каждого, кто потревожит печать.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_catacombs_to_vote', text: 'Спуститься вниз', nextNodeId: 'sq_catacombs_vote' }],
  },

  sq_catacombs_vote: {
    id: 'sq_catacombs_vote',
    title: 'Саркофаг и печать',
    description: `
Полутёмные коридоры. Эхо молитв. Внезапные скрипы цепей.

Урна запечатана знаками. Дух мага шепчет из‑под камня: «Отпусти…»
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_catacombs_free',
        text: 'Освободить дух мага (сила ценой угрозы городу)',
        nextNodeId: 'sq_catacombs_outcome_free',
        baseScore: 12,
        classMultipliers: { shustrya: 1.5, valkyrie: 1.2, vorschlag: 1.0, ghost: 1.0 },
        scoreTags: ['social', 'mystic'],
        flags: {
          sq_catacombs_outcome: 'freed',
          artifact_grimoire: 1,
          alert_delta: 10,
        },
      },
      {
        id: 'sq_catacombs_seal',
        text: 'Запечатать проклятие (защита ценой утраченной силы)',
        nextNodeId: 'sq_catacombs_outcome_seal',
        baseScore: 12,
        classMultipliers: { vorschlag: 1.5, valkyrie: 1.2, ghost: 0.8, shustrya: 1.0 },
        scoreTags: ['logic', 'mystic'],
        flags: {
          sq_catacombs_outcome: 'sealed',
          blessing_freiburg: true,
          artifact_holy_icon: 1,
        },
      },
    ],
  },

  sq_catacombs_outcome_free: {
    id: 'sq_catacombs_outcome_free',
    title: 'Плата за знание',
    description: `
Печать трескается. Воздух становится холоднее, и будто кто‑то улыбается в темноте.
Дух отдаёт вам гримуар — страницы пахнут пеплом и озоном.

Сверху, где‑то в городе, слышится далёкая дрожь — как предупреждение.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_catacombs_to_return', text: 'Далее', nextNodeId: 'sq_catacombs_return' }],
  },

  sq_catacombs_outcome_seal: {
    id: 'sq_catacombs_outcome_seal',
    title: 'Очищение',
    description: `
Вы завершаете ритуал. Цепи замолкают, эхо становится «обычным». Урна больше не зовёт.
Иероним даёт вам освящённый знак — щит от нечисти, пусть и не меч.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_catacombs_to_return', text: 'Далее', nextNodeId: 'sq_catacombs_return' }],
  },

  sq_catacombs_return: {
    id: 'sq_catacombs_return',
    title: 'Возвращение',
    description: `
Крюк завершён. Пора возвращаться к основному плану.
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_catacombs_return_choice',
        text: 'Вернуться к группе',
        action: 'return',
        questId: 'catacombs_shadows',
      },
    ],
  },

  sq_mushroom_threat_start: {
    id: 'sq_mushroom_threat_start',
    title: 'Сайд‑квест: Грибная угроза',
    description: `
Ближайшие к разлому леса заражены мутирующими спорами. Один грибной «отросток» по ночам отрывается от пня и нападает на караваны.
Алхимик из фракции «Синтез» просит помочь: либо сжечь рассадник, либо принести образцы спор.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_mushroom_to_vote', text: 'Выйти на след', nextNodeId: 'sq_mushroom_threat_vote' }],
  },

  sq_mushroom_threat_vote: {
    id: 'sq_mushroom_threat_vote',
    title: 'Рассадник',
    description: `
Гнилостный запах забивает дыхание. В темноте мерцают «светлячки» — это споры, и они будто наблюдают.
Пень дышит, как лёгкие.
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_mushroom_burn',
        text: 'Уничтожить грибное чудовище (огонь/кислота/сталь)',
        nextNodeId: 'sq_mushroom_threat_outcome_destroy',
        baseScore: 10,
        classMultipliers: { ghost: 1.2, shustrya: 1.2, vorschlag: 1.0, valkyrie: 1.0 },
        scoreTags: ['combat', 'visual'],
        flags: {
          sq_mushroom_threat_outcome: 'destroyed',
          alchemy_ingredients: 1,
          anomaly_delta: 5,
        },
      },
      {
        id: 'sq_mushroom_sample',
        text: 'Исследовать споры и сохранить рассадник (долгосрочный риск)',
        nextNodeId: 'sq_mushroom_threat_outcome_sample',
        baseScore: 15,
        classMultipliers: { valkyrie: 1.5, vorschlag: 1.2, ghost: 0.8, shustrya: 0.5 },
        scoreTags: ['knowledge', 'visual'],
        consumableCost: { templateId: 'pills', amount: 1 },
        itemBonus: 25,
        flags: {
          sq_mushroom_threat_outcome: 'sampled',
          artifact_moon_fungus_lantern: 1,
          alert_delta: 5,
        },
      },
    ],
  },

  sq_mushroom_threat_outcome_destroy: {
    id: 'sq_mushroom_threat_outcome_destroy',
    title: 'Пепел и ингредиенты',
    description: `
Огонь делает своё дело. Угроза локально устранена.
В золе остаются кристаллизованные споры — их хватит на мощный эликсир или яд.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_mushroom_to_return', text: 'Далее', nextNodeId: 'sq_mushroom_threat_return' }],
  },

  sq_mushroom_threat_outcome_sample: {
    id: 'sq_mushroom_threat_outcome_sample',
    title: 'Образцы',
    description: `
Вы собираете споры и не убиваете пень. В руках — редкий ингредиент, который даст свет и ночное зрение.
Но когда вы уходите, за спиной слышится влажный шорох — грибница растёт быстрее, чем должна.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_mushroom_to_return', text: 'Далее', nextNodeId: 'sq_mushroom_threat_return' }],
  },

  sq_mushroom_threat_return: {
    id: 'sq_mushroom_threat_return',
    title: 'Возвращение',
    description: `
Крюк завершён. Пора возвращаться к основному плану.
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_mushroom_return_choice',
        text: 'Вернуться к группе',
        action: 'return',
        questId: 'mushroom_threat',
      },
    ],
  },

  sq_forgotten_bunker_start: {
    id: 'sq_forgotten_bunker_start',
    title: 'Сайд‑квест: Забытый бункер',
    description: `
Разведчики обнаружили в горах остатки бункера старых сил FJR. Внутри — секретные разработки и дневники полевых командиров.
Говорят, там до сих пор работает охранный дроид. А в коридорах иногда слышны шаги того, кто давно должен быть мёртв.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_bunker_to_vote', text: 'Найти вход', nextNodeId: 'sq_forgotten_bunker_vote' }],
  },

  sq_forgotten_bunker_vote: {
    id: 'sq_forgotten_bunker_vote',
    title: 'Дверь и автомат',
    description: `
Бетонные коридоры с аварийным освещением. Мониторы вспыхивают и гаснут, как моргание.
Где‑то за дверью щёлкает реле — и вы понимаете: здесь всё ещё есть «хозяин».
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_bunker_disarm',
        text: 'Проникнуть внутрь и разоружить защиту (риск аномалий)',
        nextNodeId: 'sq_forgotten_bunker_outcome_disarm',
        baseScore: 12,
        classMultipliers: { vorschlag: 1.5, ghost: 1.0, valkyrie: 1.0, shustrya: 0.8 },
        scoreTags: ['tech', 'precision'],
        flags: {
          sq_forgotten_bunker_outcome: 'disarmed',
          weapon_experimental: 1,
          anomaly_delta: 8,
        },
      },
      {
        id: 'sq_bunker_diaries',
        text: 'Установить ловушки и прочесть дневники (меньше риска)',
        nextNodeId: 'sq_forgotten_bunker_outcome_diaries',
        baseScore: 10,
        classMultipliers: { vorschlag: 1.2, valkyrie: 1.2, ghost: 1.0, shustrya: 1.0 },
        scoreTags: ['knowledge', 'logic'],
        flags: {
          sq_forgotten_bunker_outcome: 'diaries',
          intel_stabilization_method: true,
          fjr_support_delta: 1,
        },
      },
    ],
  },

  sq_forgotten_bunker_outcome_disarm: {
    id: 'sq_forgotten_bunker_outcome_disarm',
    title: 'Трофеи',
    description: `
Вы находите оружие экспериментального класса и схемы — достаточно, чтобы изменить баланс сил.
Но пока вы уходите, в бункере что‑то «просыпается»: на стене вспыхивает чужой протокол тревоги.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_bunker_to_return', text: 'Далее', nextNodeId: 'sq_forgotten_bunker_return' }],
  },

  sq_forgotten_bunker_outcome_diaries: {
    id: 'sq_forgotten_bunker_outcome_diaries',
    title: 'Записи',
    description: `
Дневники пахнут пылью и войной. Среди строк — метод стабилизации зоны и имена тех, кто пытался остановить катастрофу.
Часть ценностей приходится оставить охране, но вы уносите главное — знание.
`,
    interactionType: 'sync',
    choices: [{ id: 'sq_bunker_to_return', text: 'Далее', nextNodeId: 'sq_forgotten_bunker_return' }],
  },

  sq_forgotten_bunker_return: {
    id: 'sq_forgotten_bunker_return',
    title: 'Возвращение',
    description: `
Крюк завершён. Пора возвращаться к основному плану.
`,
    interactionType: 'vote',
    choices: [
      {
        id: 'sq_bunker_return_choice',
        text: 'Вернуться к группе',
        action: 'return',
        questId: 'forgotten_bunker',
      },
    ],
  },
}
