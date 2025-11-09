import type {
  VisualNovelSceneDefinition,
  VisualNovelChoiceView,
  VisualNovelLine,
} from '@/shared/types/visualNovel'

const BACKGROUNDS = {
  outpost: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
  infoBureau: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80',
  market: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=80',
}

export const DEFAULT_VN_SCENE_ID = 'prologue_intro'

const SCENES: VisualNovelSceneDefinition[] = [
  {
    id: 'prologue_intro',
    title: 'Тоннель прибытия',
    location: 'Восточный коридор, Фрайбург',
    description: 'Первая встреча с куратором «Синтеза» и переход к городским координаторам.',
    background: BACKGROUNDS.outpost,
    ambientColor: 'rgba(15, 23, 42, 0.65)',
    entryLineId: 'prologue_intro__1',
    tags: ['story', 'entry'],
    characters: [
      {
        id: 'mc',
        name: 'Алекс',
        title: 'Разведчик',
        color: '#7dd3fc',
        alignment: 'center',
      },
      {
        id: 'hans',
        name: 'Ханс Штауб',
        title: 'Куратор «Синтеза»',
        color: '#fcd34d',
        alignment: 'right',
        tagline: 'Ведёт прибывших сквозь коридор',
      },
    ],
    lines: [
      {
        id: 'prologue_intro__1',
        speakerId: 'hans',
        mood: 'serious',
        text: 'Вы успели вовремя. Город держится, но каждый свежий человек сейчас на вес золота.',
        stageDirection: 'Ханс проверяет данные на коммуникаторе.',
        nextLineId: 'prologue_intro__2',
      },
      {
        id: 'prologue_intro__2',
        speakerId: 'mc',
        mood: 'neutral',
        text: 'Подтверждаю прибытие. Оборудование цело, связи держатся.',
        nextLineId: 'prologue_intro__3',
      },
      {
        id: 'prologue_intro__3',
        speakerId: 'hans',
        mood: 'warm',
        text: 'Отлично. Дальше идёшь один: информационное бюро и точка снабжения ждут отчёт о ситуации за периметром.',
        nextLineId: 'prologue_intro__4',
      },
      {
        id: 'prologue_intro__4',
        speakerId: 'mc',
        text: 'Вдох. Выдох. Готов. Куда первым делом?',
        choices: [
          {
            id: 'prologue_intro__choice_go',
            label: 'Следовать в информационное бюро',
            description: 'Закрепить прибытие и получить новые координаты.',
            nextSceneId: 'info_bureau_meeting',
            effects: {
              addFlags: ['arrived_at_freiburg'],
            },
          },
          {
            id: 'prologue_intro__choice_scan',
            label: 'Оглядеться и проверить радиоэфир',
            description: 'Понять, насколько всё плохо за стенами.',
            nextLineId: 'prologue_intro__5',
          },
        ],
      },
      {
        id: 'prologue_intro__5',
        speakerId: 'mc',
        mood: 'tense',
        text: 'Эфир зашумлён, но маяк бюро стабилен. Придётся идти.',
        transition: {
          nextSceneId: 'info_bureau_meeting',
        },
      },
    ],
  },
  {
    id: 'info_bureau_meeting',
    title: 'Информационное бюро',
    location: 'Подземный центр «Синтеза»',
    description: 'Стеклянные стены, мерцающие экраны и очередь таких же уставших людей.',
    background: BACKGROUNDS.infoBureau,
    ambientColor: 'rgba(8, 47, 73, 0.65)',
    entryLineId: 'info_bureau__1',
    tags: ['story', 'hub'],
    characters: [
      {
        id: 'mc',
        name: 'Алекс',
        title: 'Разведчик',
        color: '#7dd3fc',
        alignment: 'left',
      },
      {
        id: 'registrar',
        name: 'Фрау Винклер',
        title: 'Регистратор',
        color: '#f472b6',
        alignment: 'right',
        tagline: 'Спокойный голос на фоне тревожного света.',
      },
    ],
    lines: [
      {
        id: 'info_bureau__1',
        speakerId: 'registrar',
        mood: 'neutral',
        text: 'Вы Алекс? Ханс уже прислал отметку. Нужно закрепить прибытие и выбрать ближайшую задачу.',
        nextLineId: 'info_bureau__2',
      },
      {
        id: 'info_bureau__2',
        speakerId: 'mc',
        text: 'Да. Мне нужен актуальный план квартала и контакт снабжения.',
        nextLineId: 'info_bureau__3',
      },
      {
        id: 'info_bureau__3',
        speakerId: 'registrar',
        mood: 'serious',
        text: 'Есть три варианта. Выбирайте, пока канал связи не перегорел.',
        choices: [
          {
            id: 'info_map_update',
            label: 'Запросить обновлённую карту',
            description: 'Получить отметки безопасных коридоров.',
            nextLineId: 'info_bureau__map',
          },
          {
            id: 'info_contacts',
            label: 'Спросить о торговых контактах',
            description: 'Найти, где обменять снаряжение.',
            nextLineId: 'info_bureau__contacts',
          },
          {
            id: 'info_rest',
            label: 'Попросить тихое место',
            description: 'Сбросить пульс и перевести дух.',
            nextLineId: 'info_bureau__rest',
          },
        ],
      },
      {
        id: 'info_bureau__map',
        speakerId: 'registrar',
        mood: 'hopeful',
        text: 'Отмечаю координаты рынка и технического туннеля. Сигнал маяка здесь устойчивый.',
        transition: {
          nextSceneId: 'trader_first_meeting',
        },
      },
      {
        id: 'info_bureau__contacts',
        speakerId: 'registrar',
        text: 'Торговец Хансен держит склад у западного рынка. Скажете, что от меня — он поймёт.',
        transition: {
          nextSceneId: 'trader_first_meeting',
        },
      },
      {
        id: 'info_bureau__rest',
        speakerId: 'mc',
        mood: 'warm',
        text: 'Спасибо. Пять минут тишины — и снова в бой.',
        transition: {
          nextSceneId: 'trader_first_meeting',
        },
      },
    ],
  },
  {
    id: 'trader_first_meeting',
    title: 'Рыночный проход',
    location: 'Западный рынок',
    description: 'Сумеречные ряды под брезентом, запах металла и пряностей.',
    background: BACKGROUNDS.market,
    ambientColor: 'rgba(15, 23, 42, 0.55)',
    entryLineId: 'trader_meet__1',
    tags: ['hub', 'trade'],
    characters: [
      {
        id: 'mc',
        name: 'Алекс',
        color: '#7dd3fc',
        alignment: 'left',
      },
      {
        id: 'trader',
        name: 'Марко Хансен',
        title: 'Торговец',
        color: '#f97316',
        alignment: 'right',
        tagline: 'Говорит быстро, но смотрит внимательно.',
      },
    ],
    lines: [
      {
        id: 'trader_meet__1',
        speakerId: 'trader',
        text: 'Так-так, новый человек. У тебя на лице видно, что ты из тех, кто держится до конца.',
        nextLineId: 'trader_meet__2',
      },
      {
        id: 'trader_meet__2',
        speakerId: 'mc',
        mood: 'serious',
        text: 'Фрау Винклер сказала, что у вас можно получить информацию и обменять припасы.',
        nextLineId: 'trader_meet__3',
      },
      {
        id: 'trader_meet__3',
        speakerId: 'trader',
        text: 'Можно многое. Но сначала реши, что тебе критичнее.',
        choices: [
          {
            id: 'trader_show_goods',
            label: 'Посмотреть товары',
            description: 'Понять ассортимент и ценники.',
            nextSceneId: 'trader_goods_overview',
          },
          {
            id: 'trader_hear_rumors',
            label: 'Спросить о слухах',
            description: 'Разведать, что происходит у старых шлюзов.',
            nextSceneId: 'trader_rumors',
          },
          {
            id: 'trader_ask_job',
            label: 'Спросить о заданиях',
            description: 'Взять поручение и укрепить доверие.',
            nextSceneId: 'trader_quest_delivery',
          },
        ],
      },
    ],
  },
  {
    id: 'trader_goods_overview',
    title: 'Ряды снабжения',
    location: 'Рынок',
    description: 'Шкафы, ящики и неоновые таблички с ценами.',
    background: BACKGROUNDS.market,
    ambientColor: 'rgba(8, 47, 73, 0.55)',
    entryLineId: 'trader_goods__1',
    characters: [
      {
        id: 'mc',
        name: 'Алекс',
        color: '#7dd3fc',
        alignment: 'left',
      },
      {
        id: 'trader',
        name: 'Марко Хансен',
        title: 'Торговец',
        color: '#f97316',
        alignment: 'right',
      },
    ],
    lines: [
      {
        id: 'trader_goods__1',
        speakerId: 'trader',
        text: 'Боекомплект, фильтры, ремонтные наборы. Цены честные, но оплата вперёд.',
        nextLineId: 'trader_goods__2',
      },
      {
        id: 'trader_goods__2',
        speakerId: 'mc',
        text: 'Вижу знак «Синтеза». Значит, товары проверены?',
        nextLineId: 'trader_goods__3',
      },
      {
        id: 'trader_goods__3',
        speakerId: 'trader',
        mood: 'warm',
        text: 'Каждый фильтр я держал в руках. Никаких сюрпризов.',
        choices: [
          {
            id: 'goods_back',
            label: 'Вернуться к разговору',
            description: 'Есть ещё вопросы.',
            nextSceneId: 'trader_first_meeting',
          },
        ],
      },
    ],
  },
  {
    id: 'trader_rumors',
    title: 'Шёпот рынка',
    location: 'Рынок',
    description: 'За палатками шуршат антенны и слышны приглушённые разговоры.',
    background: BACKGROUNDS.market,
    ambientColor: 'rgba(15, 23, 42, 0.6)',
    entryLineId: 'trader_rumors__1',
    characters: [
      {
        id: 'mc',
        name: 'Алекс',
        color: '#7dd3fc',
        alignment: 'left',
      },
      {
        id: 'trader',
        name: 'Марко Хансен',
        title: 'Торговец',
        color: '#f97316',
        alignment: 'right',
      },
    ],
    lines: [
      {
        id: 'trader_rumors__1',
        speakerId: 'trader',
        text: 'Говорят, у старого шлюза снова пропали дозорные. Если пойдёшь туда — держи связь открытой.',
        nextLineId: 'trader_rumors__2',
      },
      {
        id: 'trader_rumors__2',
        speakerId: 'mc',
        mood: 'serious',
        text: 'Отмечу координаты. Спасибо за предупреждение.',
        choices: [
          {
            id: 'rumors_back',
            label: 'Вернуться к торговцу',
            nextSceneId: 'trader_first_meeting',
          },
        ],
      },
    ],
  },
  {
    id: 'trader_quest_delivery',
    title: 'Срочная доставка',
    location: 'Рынок',
    description: 'Запечатанный кейс лежит на столе, рядом — карта с красной отметкой.',
    background: BACKGROUNDS.market,
    ambientColor: 'rgba(76, 29, 149, 0.55)',
    entryLineId: 'trader_quest__1',
    characters: [
      {
        id: 'mc',
        name: 'Алекс',
        color: '#7dd3fc',
        alignment: 'left',
      },
      {
        id: 'trader',
        name: 'Марко Хансен',
        title: 'Торговец',
        color: '#f97316',
        alignment: 'right',
      },
    ],
    lines: [
      {
        id: 'trader_quest__1',
        speakerId: 'trader',
        mood: 'tense',
        text: 'Есть кейс, который должен попасть в укрытие «Орбита». Люди там сидят без фильтров.',
        nextLineId: 'trader_quest__2',
      },
      {
        id: 'trader_quest__2',
        speakerId: 'mc',
        text: 'Какие условия? Мне нужно знать маршрут и оплату.',
        nextLineId: 'trader_quest__3',
      },
      {
        id: 'trader_quest__3',
        speakerId: 'trader',
        text: 'Маршрут отмечен. Оплата — репутация у «Синтеза» и пара редких модулей, если вернёшься.',
        choices: [
          {
            id: 'quest_accept',
            label: 'Принять груз',
            description: 'Забрать кейс и подготовиться к выходу.',
            nextLineId: 'trader_quest__accept',
            effects: {
              addFlags: ['hans_gave_first_quest'],
            },
          },
          {
            id: 'quest_decline',
            label: 'Отказаться',
            description: 'Слишком рискованно прямо сейчас.',
            nextLineId: 'trader_quest__decline',
          },
        ],
      },
      {
        id: 'trader_quest__accept',
        speakerId: 'mc',
        mood: 'serious',
        text: 'Приму. Передай в укрытие, что я буду до сумерек.',
        transition: {
          nextSceneId: 'trader_first_meeting',
        },
      },
      {
        id: 'trader_quest__decline',
        speakerId: 'trader',
        mood: 'tense',
        text: 'Жаль. Но лучше отказаться, чем провалить. Если передумаешь — кейс будет ждать.',
        transition: {
          nextSceneId: 'trader_first_meeting',
        },
      },
    ],
  },
]

export const VISUAL_NOVEL_SCENES: Record<string, VisualNovelSceneDefinition> = SCENES.reduce(
  (acc, scene) => {
    acc[scene.id] = scene
    return acc
  },
  {} as Record<string, VisualNovelSceneDefinition>
)

export function getVisualNovelScene(sceneId: string | undefined | null) {
  if (!sceneId) {
    return VISUAL_NOVEL_SCENES[DEFAULT_VN_SCENE_ID]
  }
  return VISUAL_NOVEL_SCENES[sceneId] ?? VISUAL_NOVEL_SCENES[DEFAULT_VN_SCENE_ID]
}

export function getLineById(scene: VisualNovelSceneDefinition, lineId?: string | null): VisualNovelLine | null {
  if (!lineId) return null
  return scene.lines.find((line) => line.id === lineId) ?? null
}

export function buildChoiceViews(line: VisualNovelLine | null, flags: Set<string>): VisualNovelChoiceView[] {
  if (!line?.choices) return []
  return line.choices.map((choice) => {
    let disabled = false
    let lockReason: string | undefined

    if (choice.requirements?.flags) {
      const missing = choice.requirements.flags.filter((flag) => !flags.has(flag))
      if (missing.length > 0) {
        disabled = true
        lockReason = `Нужно: ${missing.join(', ')}`
      }
    }

    if (!disabled && choice.requirements?.notFlags) {
      const blocking = choice.requirements.notFlags.filter((flag) => flags.has(flag))
      if (blocking.length > 0) {
        disabled = true
        lockReason = `Недоступно при состоянии: ${blocking.join(', ')}`
      }
    }

    return {
      ...choice,
      disabled,
      lockReason,
    }
  })
}
