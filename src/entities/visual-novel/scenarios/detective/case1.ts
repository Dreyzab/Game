import type { Scene } from '../../model/types'

// Define backgrounds (Placeholders for now, normally imported)
const BG_STATION = '/images/scenarios/station_1905.jpg'
const BG_CONSTRUCTION = '/images/scenarios/construction_site_1905.jpg'
const BG_PUB = '/images/scenarios/pub_interior_1905.jpg'
const BG_RESTAURANT = '/images/scenarios/restaurant_1905.jpg'
const BG_WAREHOUSE = '/images/scenarios/warehouse_night_1905.jpg'

export const detectiveScenarios: Record<string, Scene> = {
  // --- ACT 0: BRIEFING ---
  case1_act0_briefing: {
    id: 'case1_act0_briefing',
    background: BG_STATION,
    characters: [],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'Фрайбург, 1905. Пар из-под колёс стелется по перрону, пахнет углём и мокрым камнем.',
      },
      {
        speaker: 'Narrator',
        text: 'В кармане — записка с печатью: “Münsterplatz 4. Bankhaus J.A. Krebs. Нужен тихий расследователь.”',
      },
    ],
    choices: [
      {
        id: 'c1_a0_go_bank',
        text: 'Выдвинуться к банку на Мюнстерплац',
        effects: {
          immediate: [
            { type: 'detective_unlock_point', data: { pointId: 'munsterplatz_bank' } },
            { type: 'open_map' },
          ],
        },
      },
    ],
  },

  // --- ACT 1: BANK / CRIME SCENE ---
  case1_act1_bank_arrival: {
    id: 'case1_act1_bank_arrival',
    background: BG_CONSTRUCTION,
    characters: [{ id: 'gendarm', name: 'Gendarm', position: 'center' }],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'Мюнстерплац. Леса, брезент, запах извести. За ограждением — банк, будто наполовину разобранный наизнанку.',
      },
      {
        speaker: 'Gendarm',
        characterId: 'gendarm',
        text: '“А, вы тот самый… Нам бы без газет. Сейф не взломан снаружи — как будто вошли «по ремонту».”',
      },
      {
        speaker: 'Narrator',
        text: 'Вода в Bächle шипит у бордюра и давит шаги белым шумом. Площадь будто слушает.',
      },
    ],
    choices: [
      {
        id: 'c1_a1_lime',
        text: 'Осмотреть доски у лесов (известь, следы)',
        nextScene: 'case1_act1_lime_footprints',
      },
      {
        id: 'c1_a1_guardpost',
        text: 'Осмотреть пост охраны',
        nextScene: 'case1_act1_guardpost',
      },
      {
        id: 'c1_a1_office',
        text: 'Попросить доступ к кабинету директора',
        nextScene: 'case1_act1_director_office',
      },
      {
        id: 'c1_a1_foreman',
        text: 'Проверить вагончик прораба (планы/чертежи)',
        availability: { condition: { flag: 'det:case01:heard_blueprint' } },
        nextScene: 'case1_act1_foreman_wagon',
      },
      {
        id: 'c1_a1_leave',
        text: 'Отойти и отметить наблюдения',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  case1_act1_lime_footprints: {
    id: 'case1_act1_lime_footprints',
    background: BG_CONSTRUCTION,
    characters: [],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'На досках — белая пыль. Следы идут от лесов к окну второго этажа, там свежий налёт извести.',
      },
      {
        speaker: 'Narrator',
        text: 'Не похоже на случайность. Кто-то “выходил на объект” ночью — и не один.',
      },
    ],
    choices: [
      {
        id: 'c1_a1_lime_take',
        text: 'Зафиксировать улику: следы извести',
        effects: {
          immediate: [
            { type: 'detective_grant_evidence', data: { evidenceId: 'lime_footprints' } },
            { type: 'detective_add_flags', data: { flags: { 'det:case01:clue_lime': true } } },
          ],
        },
      },
      {
        id: 'c1_a1_lime_back',
        text: 'Назад к ограждению',
        nextScene: 'case1_act1_bank_arrival',
      },
    ],
  },

  case1_act1_guardpost: {
    id: 'case1_act1_guardpost',
    background: BG_CONSTRUCTION,
    characters: [],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'Пост охраны пуст. На ящике — грязное стекло и сладковатый запах спирта.',
      },
      {
        speaker: 'Narrator',
        text: 'Сторож пил. Вопрос только — по привычке или “по просьбе”.',
      },
    ],
    choices: [
      {
        id: 'c1_a1_bottle_take',
        text: 'Зафиксировать улику: пустая бутылка',
        effects: {
          immediate: [
            { type: 'detective_grant_evidence', data: { evidenceId: 'empty_schnapps_bottle' } },
            { type: 'detective_add_flags', data: { flags: { 'det:case01:clue_bottle': true } } },
          ],
        },
      },
      {
        id: 'c1_a1_bottle_back',
        text: 'Назад к ограждению',
        nextScene: 'case1_act1_bank_arrival',
      },
    ],
  },

  case1_act1_director_office: {
    id: 'case1_act1_director_office',
    background: BG_RESTAURANT,
    characters: [{ id: 'clerk', name: 'Clerk', position: 'center' }],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'Внутри пахнет мокрым деревом и свежей бумагой. На столе — письма и расчёты, на окнах — пыль от ремонта.',
      },
      {
        speaker: 'Clerk',
        characterId: 'clerk',
        text: '“Господин Кребс занят… И да, если вы здесь — значит, полиция уже не справляется.”',
      },
    ],
    choices: [
      {
        id: 'c1_a1_letter_take',
        text: 'Снять копию письма о слиянии (Creditbank)',
        effects: {
          immediate: [
            { type: 'detective_grant_evidence', data: { evidenceId: 'director_letter' } },
            { type: 'detective_unlock_entry', data: { entryId: 'adolf_krebs' } },
            { type: 'detective_add_flags', data: { flags: { 'det:case01:clue_letter': true } } },
          ],
        },
      },
      {
        id: 'c1_a1_office_back',
        text: 'Назад к ограждению',
        nextScene: 'case1_act1_bank_arrival',
      },
      {
        id: 'c1_a1_office_map',
        text: 'Уйти и обдумать',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  case1_act1_foreman_wagon: {
    id: 'case1_act1_foreman_wagon',
    background: BG_CONSTRUCTION,
    characters: [],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'Вагончик прораба. Бумаги под прессом, карандашные пометки, запах смолы. Один лист выдвинут — будто его брали в спешке.',
      },
      {
        speaker: 'Narrator',
        text: 'На плане подвала отмечена “тонкая стена”. За ней — старый сток.',
      },
    ],
    choices: [
      {
        id: 'c1_a1_blueprint_take',
        text: 'Зафиксировать улику: чертёж Меккеля',
        effects: {
          immediate: [
            { type: 'detective_grant_evidence', data: { evidenceId: 'meckel_blueprint' } },
            { type: 'detective_unlock_entry', data: { entryId: 'meckel_architects' } },
            { type: 'detective_add_flags', data: { flags: { 'det:case01:clue_blueprint': true } } },
          ],
        },
      },
      {
        id: 'c1_a1_wagon_back',
        text: 'Назад к ограждению',
        nextScene: 'case1_act1_bank_arrival',
      },
    ],
  },

  // --- ACT 2: LEADS ---
  case1_act2_pub_intel: {
    id: 'case1_act2_pub_intel',
    background: BG_PUB,
    characters: [{ id: 'worker', name: 'Worker', position: 'center' }],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'Пивная шумит, как мастерская. На стенах — афиши и сплетни. Рабочие с лесов здесь прячут усталость в кружках.',
      },
      {
        speaker: 'Worker',
        characterId: 'worker',
        text: '“Банк? Да там половина стен — времянка. Прораб хранит планы в вагончике. А вы про митинг слышали? Сегодня будет жарко.”',
      },
    ],
    choices: [
      {
        id: 'c1_a2_heard_blueprint',
        text: 'Выяснить про чертежи и доступ к вагончику',
        effects: {
          addFlags: ['det:case01:heard_blueprint'],
          immediate: [
            { type: 'detective_unlock_point', data: { pointId: 'munsterplatz_bank' } },
            { type: 'detective_add_flags', data: { flags: { 'det:case01:lead_wagon': true } } },
          ],
        },
      },
      {
        id: 'c1_a2_take_poster',
        text: 'Снять афишу митинга',
        effects: {
          immediate: [
            { type: 'detective_grant_evidence', data: { evidenceId: 'friedeberg_poster' } },
            { type: 'detective_unlock_entry', data: { entryId: 'friedeberg' } },
          ],
        },
      },
      {
        id: 'c1_a2_leave',
        text: 'Выйти и продолжить расследование',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  case1_act2_archives: {
    id: 'case1_act2_archives',
    background: BG_RESTAURANT,
    characters: [],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'Архив пахнет пылью и чернилами. Здесь всё старше любой клятвы.',
      },
      {
        speaker: 'Narrator',
        text: 'На плане коммуникаций ты находишь: старый сток действительно подходит к фундаменту банка.',
      },
    ],
    choices: [
      {
        id: 'c1_a2_archives_note',
        text: 'Отметить вывод: отход мог быть через сток',
        effects: {
          addFlags: ['det:case01:sewer_route_confirmed'],
          immediate: [
            { type: 'detective_add_flags', data: { flags: { 'det:case01:lead_sewer': true } } },
            { type: 'detective_unlock_point', data: { pointId: 'stuhlinger_warehouse' } },
          ],
        },
      },
      {
        id: 'c1_a2_archives_leave',
        text: 'Уйти и проверить наводку',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  // --- ACT 3: RESOLUTION ---
  case1_act3_warehouse_sting: {
    id: 'case1_act3_warehouse_sting',
    background: BG_WAREHOUSE,
    characters: [],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'Склад в Штюлингене дышит холодом. Здесь удобно прятать ящики — и молчание.',
      },
      {
        speaker: 'Narrator',
        text: 'Если версия верна, добыча или документы должны всплыть здесь… или в ближайшем круге.',
      },
    ],
    choices: [
      {
        id: 'c1_a3_arrest',
        text: 'Вызвать полицию и взять подозреваемых',
        nextScene: 'case1_act3_ending_arrest',
      },
      {
        id: 'c1_a3_coverup',
        text: 'Забрать документы и закрыть скандал “тихо”',
        nextScene: 'case1_act3_ending_coverup',
      },
    ],
  },

  case1_act3_ending_arrest: {
    id: 'case1_act3_ending_arrest',
    background: BG_WAREHOUSE,
    characters: [],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'Ты отдаёшь дело в руки закона. Это медленно — зато оставляет след в бумагах и судьбах.',
      },
    ],
    choices: [
      {
        id: 'c1_end_1',
        text: 'Закрыть дело',
        effects: {
          immediate: [
            { type: 'detective_add_flags', data: { flags: { 'det:case01:closed': 'arrest' } } },
            { type: 'detective_unlock_point', data: { pointId: 'basler_hof' } },
            { type: 'open_map' },
          ],
        },
      },
    ],
  },

  case1_act3_ending_coverup: {
    id: 'case1_act3_ending_coverup',
    background: BG_WAREHOUSE,
    characters: [],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'Ты возвращаешь “чужое” — и оставляешь в тени тех, кто слишком влиятелен. Город любит тишину больше справедливости.',
      },
    ],
    choices: [
      {
        id: 'c1_end_2',
        text: 'Закрыть дело',
        effects: {
          immediate: [
            { type: 'detective_add_flags', data: { flags: { 'det:case01:closed': 'coverup' } } },
            { type: 'open_map' },
          ],
        },
      },
    ],
  },
}
