import type { Scene } from '../../model/types'

const TRAIN_CIGAR_BACKGROUND = '/images/trainCigar.png'
const TRAIN_CARDS_BACKGROUND = '/images/trainCards.png'
const STATION_BACKGROUND = '/images/backgrounds/station.png'
const STATION_CHECK_BACKGROUND = '/images/backgrounds/station_check.png'

/**
 * Пролог: начало в тамбуре поезда, столкновение с тварью и прибытие.
 */
export const scenarios: Record<string, Scene> = {
  // --- НАЧАЛО: ПРОБУЖДЕНИЕ ---
  prologue_awakening: {
    id: 'prologue_awakening',
    background: TRAIN_CIGAR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты приходишь в себя от резкого толчка. Ритмичный стук колёс отдаётся в висках, а холодный воздух из щелей тамбура обжигает лицо.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Тамбур старого состава пахнет перегретым железом, мазутом и застарелым табаком. Жёлтый свет моргает, едва разгоняя тьму за окном.',
      },
    ],
    choices: [
      {
        id: 'prologue_to_reflection',
        text: 'Попытаться вспомнить, как ты здесь оказался.',
        nextScene: 'prologue_reflection_1',
      },
    ],
  },

  prologue_reflection_1: {
    id: 'prologue_reflection_1',
    background: TRAIN_CIGAR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'В памяти всплывают обрывки: шум толпы на перроне, чьи-то крики в темноте и холодный блеск стали. Но всё это кажется далёким, словно из другой жизни.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты здесь. В поезде, идущем к Фрайбургу. И это единственное, что сейчас имеет значение.',
      },
    ],
    choices: [
      {
        id: 'prologue_to_hand_choice',
        text: 'Взглянуть на свои руки.',
        nextScene: 'prologue_hand_choice',
      },
    ],
  },

  // --- ВЫБОР ЗАНЯТИЯ ---
  prologue_hand_choice: {
    id: 'prologue_hand_choice',
    background: TRAIN_CIGAR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Нужно чем-то занять руки, чтобы унять дрожь и скоротать время до прибытия.',
      },
    ],
    choices: [
      {
        id: 'prologue_choice_knife',
        text: 'Достать складной нож и начать играть с ним.',
        nextScene: 'prologue_train_knife',
        effects: { addFlags: ['prologue_had_knife'] },
      },
      {
        id: 'prologue_choice_smoke',
        text: 'Вытащить измятую пачку и прикурить.',
        nextScene: 'prologue_train_smoke',
        effects: { addFlags: ['prologue_smoked'] },
      },
      {
        id: 'prologue_choice_cards',
        text: 'Вытянуть из рукава колоду карт.',
        nextScene: 'prologue_train_cards',
        effects: { addFlags: ['prologue_cards'] },
      },
    ],
  },

  // --- ПУТЬ: НОЖ ---
  prologue_train_knife: {
    id: 'prologue_train_knife',
    background: TRAIN_CIGAR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Лезвие привычно ложится в ладонь. Ты подбрасываешь его, ловишь на лету, крутишь между пальцами. Сталь холодит кожу, успокаивая.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Финты становятся всё быстрее. Внезапно в отражении мутного стекла ты замечаешь движение.',
      },
    ],
    choices: [
      {
        id: 'prologue_knife_to_encounter',
        text: 'Присмотреться к окну.',
        nextScene: 'prologue_knife_encounter',
      },
    ],
  },

  prologue_knife_encounter: {
    id: 'prologue_knife_encounter',
    background: TRAIN_CIGAR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Тварь прыгает на стекло снаружи. Грохот разбитого окна оглушает. Существо упирается лапами в раму, его жвалы раздвигаются, готовясь выпустить порцию яда прямо в тебя.',
      },
    ],
    choices: [
      {
        id: 'prologue_knife_throw',
        text: 'Метнуть нож в тварь.',
        nextScene: 'prologue_train_announcement',
        effects: { addFlags: ['prologue_monster_scared'] },
      },
      {
        id: 'prologue_knife_dodge',
        text: 'Увернуться в сторону.',
        nextScene: 'prologue_train_announcement',
      },
      {
        id: 'prologue_knife_run',
        text: 'Броситься бежать в вагон.',
        nextScene: 'prologue_train_announcement',
      },
    ],
  },

  // --- ПУТЬ: КАРТЫ ---
  prologue_train_cards: {
    id: 'prologue_train_cards',
    background: TRAIN_CARDS_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Карты скользят между пальцами с сухим шелестом. Ты тасуешь колоду, делаешь веер, чувствуя привычный вес бумаги.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Это успокаивает. Но внезапно ритм колёс прерывается ударом снаружи.',
      },
    ],
    choices: [
      {
        id: 'prologue_cards_to_encounter',
        text: 'Оглянуться.',
        nextScene: 'prologue_cards_encounter',
      },
    ],
  },

  prologue_cards_encounter: {
    id: 'prologue_cards_encounter',
    background: TRAIN_CARDS_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Окно разлетается вдребезги. Уродливая голова монстра просовывается внутрь, оскаливая клыки.',
      },
    ],
    choices: [
      {
        id: 'prologue_cards_throw',
        text: 'Бросить колоду в морду твари.',
        nextScene: 'prologue_cards_fight_flashlight',
      },
      {
        id: 'prologue_cards_flashlight',
        text: 'Ловко выхватить фонарик из рукава.',
        nextScene: 'prologue_cards_fight_flashlight',
      },
    ],
  },

  prologue_cards_fight_flashlight: {
    id: 'prologue_cards_fight_flashlight',
    background: TRAIN_CARDS_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ослепительный луч света бьёт в фасеточные глаза монстра. Тварь истошно визжит, зажмуриваясь и теряя ориентацию.',
      },
    ],
    choices: [
      {
        id: 'prologue_cards_kick',
        text: 'Вытолкнуть тварь ногой в разбитое окно.',
        nextScene: 'prologue_train_announcement',
        effects: { addFlags: ['prologue_monster_defeated'] },
      },
    ],
  },

  // --- ПУТЬ: КОРЕШ (КУРЕНИЕ) ---
  prologue_train_smoke: {
    id: 'prologue_train_smoke',
    background: TRAIN_CIGAR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Щёлк — и крошечное пламя вырывает из темноты пальцы. Дым ложится на язык горечью и привычкой.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты смотришь на тлеющий огонек, когда чья-то тень перекрывает тусклый свет тамбура.',
      },
    ],
    choices: [
      {
        id: 'prologue_smoke_to_encounter',
        text: 'Посмотреть в окно.',
        nextScene: 'prologue_smoke_encounter',
      },
    ],
  },

  prologue_smoke_encounter: {
    id: 'prologue_smoke_encounter',
    background: TRAIN_CIGAR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Стекло лопается под напором когтистой лапы. Тварь вваливается наполовину внутрь, шипя и разевая пасть.',
      },
    ],
    choices: [
      {
        id: 'prologue_smoke_burn',
        text: 'Ткнуть горящей сигаретой в глаз твари.',
        nextScene: 'prologue_train_announcement',
      },
      {
        id: 'prologue_smoke_dodge',
        text: 'Отпрыгнуть назад.',
        nextScene: 'prologue_train_announcement',
      },
      {
        id: 'prologue_smoke_run',
        text: 'Бежать в глубь вагона.',
        nextScene: 'prologue_train_announcement',
      },
    ],
  },

  // --- ФИНАЛ СТОЛКНОВЕНИЯ И ПРИБЫТИЕ ---
  prologue_train_announcement: {
    id: 'prologue_train_announcement',
    background: TRAIN_CIGAR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Тварь с воем исчезает в ночной темноте. Ты остаёшься один в разгромленном тамбуре, судорожно вдыхая холодный воздух.',
      },
      {
        speaker: 'Голос из динамика',
        text: '«Следующая остановка — Фрайбург. Пассажирам просьба подготовить документы для проверки».',
      },
      {
        speaker: 'Рассказчик',
        text: 'Поезд сбрасывает скорость. Снаружи меркнет пейзаж и появляется город — аккуратный, настороженный.',
      },
    ],
    choices: [
      {
        id: 'prologue_step_out',
        text: 'Сойти на платформу.',
        nextScene: 'prologue_station_arrival',
      },
    ],
  },

  prologue_station_arrival: {
    id: 'prologue_station_arrival',
    background: STATION_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Холодный воздух ударяет в лицо. Вдоль платформы — фигуры в защитных масках, ровные линии оцепления и взгляд, который измеряет тебя быстрее паспорта.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Фрайбург выглядит живым — но живым по правилам. Здесь всё начинается с регистрации.',
      },
    ],
    choices: [
      {
        id: 'prologue_go_to_control',
        text: 'Подойти к проверке.',
        nextScene: 'prologue_station_control',
      },
    ],
  },

  prologue_station_control: {
    id: 'prologue_station_control',
    background: STATION_CHECK_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Контролёр',
        text: 'Билет. Документы. И… имя — для реестра.',
      },
      {
        speaker: 'Контролёр',
        text: 'Не в списках. Значит, новоприбывший. Такое у нас оформляется быстро — если не спорить.',
      },
    ],
    choices: [
      {
        id: 'prologue_name_self',
        text: 'Назвать имя.',
        nextScene: 'prologue_station_control_after_name',
        effects: {
          immediate: [{ type: 'prompt_nickname' }],
        },
      },
    ],
  },

  prologue_station_control_after_name: {
    id: 'prologue_station_control_after_name',
    background: STATION_CHECK_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Контролёр',
        text: 'Хорошо. Слушай внимательно: мэрия, Ратушная площадь. Там первичная регистрация и анкета.',
      },
      {
        speaker: 'Контролёр',
        text: 'Пока не зарегистрируешься — городские QR для тебя пустые. И у патруля будет слишком много вопросов.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он делает короткий жест в сторону центра — как будто указывает не улицу, а направление твоей новой жизни.',
      },
    ],
    choices: [
      {
        id: 'prologue_to_townhall',
        text: 'Идти в мэрию на регистрацию.',
        effects: {
          addFlags: ['arrived_at_freiburg', 'prologue_complete'],
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },
}
