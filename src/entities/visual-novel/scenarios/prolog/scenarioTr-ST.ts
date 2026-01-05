import type { Scene } from '../../model/types'

const TRAIN_CIGAR_BACKGROUND = '/images/trainCigar.png'
const TRAIN_CARDS_BACKGROUND = '/images/trainCards.png'
const TRAIN_KNIFE_BACKGROUND = '/images/trainKnife.png'
const COUPE_BACKGROUND = '/video/Анимация_пейзажа_и_планшета.mp4'
const TAMBOUR_BACKGROUND = '/images/trainCigar.png'// Placeholder

/**
 * Cinematic Prologue: Coupe interaction -> Tambour choices -> Creature Attack -> Tutorials
 */
export const scenarios: Record<string, Scene> = {
  // ============================================================================
  // STAGE 1: THE COUPE (Человек чего-то хочет)
  // ============================================================================

  prologue_coupe_start: {
    id: 'prologue_coupe_start',
    background: COUPE_BACKGROUND,
    music: 'train_ambience',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Стук колес. Дребезжание ложечки в чашке. За окном проносятся какие-то вспышки, идёт снег, а в купе уютно и тепло.',
      },
      {
        speaker: 'Логика',
        characterId: 'logic',
        text: 'Как хорошо что я познакомился с этими людьми, иначе пришлось бы ехать в общем вагоне, а там посидеть на чемодане не всегда возможно.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Время тянется, как остывшая смола. Надо чем-то занять руки.',
      },
      {
        speaker: 'Солидарность',
        characterId: 'solidarity',
        text: 'Звук урчания желудка перекрывает стук колес. Угости их и это настроит всех на дружеский лад.',
      },
      {
        speaker: 'Драма',
        characterId: 'drama',
        text: 'Скука-это грех. Покажи им фокус, прочитай их будущее. Мастера всегда знают, как завладеть вниманием',
      },
      {
        speaker: 'Азарт',
        characterId: 'gambler',
        text: 'Четверо незнакомцев в замкнутом пространстве — идеальное уравнение для решения. Можно подумать, кто есть кто.',
      },
    ],
    choices: [
      {
        id: 'prologue_choice_sausage',
        text: 'Нарезать колбасу используя свой армейский нож.',
        nextScene: 'prologue_sausage_exec',
        effects: {
          immediate: [
            { type: 'skill_boost', data: { skillId: 'solidarity', amount: 2 } },
            { type: 'skill_boost', data: { skillId: 'empathy', amount: 1 } },
          ],
          addFlags: ['prologue_start_sausage', 'prologue_has_valuables'],
        },
      },
      {
        id: 'prologue_choice_cards',
        text: 'Погадать на картах.',
        nextScene: 'prologue_cards_exec',
        effects: {
          immediate: [
            { type: 'skill_boost', data: { skillId: 'drama', amount: 2 } },
            { type: 'skill_boost', data: { skillId: 'creativity', amount: 2 } },
          ],
          addFlags: ['prologue_start_cards'],
        },
      },
      {
        id: 'prologue_choice_zippo',
        text: 'Крутить в пальцах зажигалку.',
        nextScene: 'prologue_lighter_exec',
        effects: {
          immediate: [
            { type: 'skill_boost', data: { skillId: 'gambler', amount: 1 } },
            { type: 'skill_boost', data: { skillId: 'logic', amount: 2 } },
          ],
          addFlags: ['prologue_start_zippo'],
        },
      },
    ],
  },

  prologue_sausage_exec: {
    id: 'prologue_sausage_exec',
    background: '/images/prolog/coupe4p.png',
    characters: [
      { id: 'bruno', name: 'Бруно Вебер', position: 'left', emotion: { primary: 'happy' } },
      { id: 'otto', name: 'Отто Кляйн', position: 'left', emotion: { primary: 'calm' } },
    ],
    dialogue: [
      {
        speaker: 'Бруно Вебер',
        text: 'Ох, спасибо, дружище! А то мой желудок уже начинает петь громче колес. Уважаю.',
      },
      {
        speaker: 'Отто Кляйн',
        text: 'Еда есть. Теперь нужно чем-то запить. У меня в термосе еще остался чай. Подставляйте чашки.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Бруно взял сложенные стопкой чашки и начал раздавать, в то время как Отто раскрутил термос и начал разливать по чашкам.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Колбаса нарезана, чай разлит. Тепло еды и питья смягчает атмосферу купе. Разговор сам собой заходит о еде.',
      },
      {
        speaker: 'Адель',
        characterId: 'adele',
        text: 'Эх, колбаса — это хорошо, но я бы сейчас убила за пасту карбонару. Настоящую, с гуанчиале и пекорино. Не эту шляпу, которую делают в столовых.',
      },
      {
        speaker: 'Лена Рихтер',
        characterId: 'lena',
        text: 'А я скучаю по борщу. Настоящему, с пампушками и сметаной. Мама готовила такой, что соседи в очередь становились.',
      },
      {
        speaker: 'Отто Кляйн',
        characterId: 'otto',
        text: 'Лосось. Дикий. Слегка подкопченный. С каперсами и лимоном. Вот это — еда настоящего мужика.',
      },
      {
        speaker: 'Бруно Вебер',
        characterId: 'bruno',
        text: 'А я бы выпил хорошего сидра! Не блюдо конечно, но на этом топливе я работаю лучше всего.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Смех разливается по купе. На мгновение все забывают, что за окном — Мертвые Земли, а впереди — неизвестность.',
      },
    ],
    nextScene: 'prologue_observe_selection',
  },

  prologue_cards_exec: {
    id: 'prologue_cards_exec',
    background: '/images/prolog/coupe4p.png',
    characters: [
      { id: 'bruno', name: 'Бруно Вебер', position: 'left' },
      { id: 'adele', name: 'Адель', position: 'right' },
      { id: 'lena', name: 'Лена Рихтер', position: 'right' },
      { id: 'otto', name: 'Отто Кляйн', position: 'left' },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты достаешь старую, потертую колоду. Карты скользят в руках привычным жестом.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Карты мелькают в твоих руках с неестественной скоростью. Попутчики притихли.',
      },
      {
        speaker: 'Бруно Вебер',
        text: 'Ну ты даешь! То-то я не успевал тебе подкинуть карту, когда мы играли. Теперь понятно — ловкость рук!',
      },
      {
        speaker: 'Адель',
        text: 'Ого. А ты умеешь делать фокусы? Покажи что-нибудь.',
      },
      {
        speaker: 'Лена Рихтер',
        text: 'Фокусы... Они называют это магией.',
      },
      {
        speaker: 'Отто Кляйн',
        text: 'Магии не существует. Есть только уловки и отвлечение внимания.',
      },
      {
        speaker: 'Драма',
        characterId: 'drama',
        text: 'Я читаю людей. Я чувствую их эмоции, как карты под пальцами. Сейчас посмотрим, кто есть кто.',
      },
    ],
    nextScene: 'prologue_cards_selection',
  },

  prologue_lighter_exec: {
    id: 'prologue_lighter_exec',
    background: '/images/prolog/coupe4p.png',
    characters: [
      { id: 'bruno', name: 'Бруно Вебер', position: 'left' },
      { id: 'adele', name: 'Адель', position: 'right' },
      { id: 'lena', name: 'Лена Рихтер', position: 'right' },
      { id: 'otto', name: 'Отто Кляйн', position: 'left' },
    ],
    dialogue: [
      {
        speaker: 'Азарт',
        characterId: 'gambling',
        text: 'Я уже знаю о них довольно много. Наблюдал. Слушал. Теперь я могу попытаться угадать, кто кем является.',
      },
      {
        speaker: 'Анализ',
        characterId: 'analysis',
        text: 'Ответы где-то здесь, в их жестах и взглядах.',
      },
    ],
    nextScene: 'prologue_observe_selection',
  },

  prologue_observe_selection: {
    id: 'prologue_observe_selection',
    background: '/images/prolog/coupe4p.png',
    characters: [
      { id: 'bruno', name: 'Бруно Вебер', position: 'left' },
      { id: 'lena', name: 'Лена Рихтер', position: 'right' },
      { id: 'adele', name: 'Адель', position: 'right' },
      { id: 'otto', name: 'Отто Кляйн', position: 'left' },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты внимательно изучаешь своих попутчиков.',
      }
    ],
    choices: [
      {
        id: 'prologue_observe_bruno',
        text: 'Присмотреться к Бруно.',
        nextScene: 'prologue_observe_bruno',
        effects: { addFlags: ['prologue_observed_bruno'] },
        availability: { condition: { notFlag: 'prologue_observed_bruno' } }
      },
      {
        id: 'prologue_observe_adele',
        text: 'Присмотреться к Адель.',
        nextScene: 'prologue_observe_adele',
        effects: { addFlags: ['prologue_observed_adele'] },
        availability: { condition: { notFlag: 'prologue_observed_adele' } }
      },
      {
        id: 'prologue_observe_lena',
        text: 'Присмотреться к Лене.',
        nextScene: 'prologue_observe_lena',
        effects: { addFlags: ['prologue_observed_lena'] },
        availability: { condition: { notFlag: 'prologue_observed_lena' } }
      },
      {
        id: 'prologue_observe_otto',
        text: 'Присмотреться к Отто.',
        nextScene: 'prologue_observe_otto',
      },
    ],
  },

  prologue_cards_selection: {
    id: 'prologue_cards_selection',
    background: '/images/prolog/coupe4p.png',
    characters: [
      { id: 'bruno', name: 'Бруно Вебер', position: 'left' },
      { id: 'adele', name: 'Адель', position: 'right' },
      { id: 'lena', name: 'Лена Рихтер', position: 'right' },
      { id: 'otto', name: 'Отто Кляйн', position: 'left' },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Карты шепчут. Кому из них ты откроешь завесу будущего?',
      }
    ],
    choices: [
      {
        id: 'prologue_cards_read_bruno',
        text: 'Предложить погадать Бруно.',
        nextScene: 'prologue_cards_bruno',
        effects: { addFlags: ['prologue_fortune_bruno', 'prologue_fortune_any'] },
        availability: { condition: { notFlag: 'prologue_fortune_bruno' } }
      },
      {
        id: 'prologue_cards_read_adele',
        text: 'Предложить погадать Адель.',
        nextScene: 'prologue_cards_adele',
        effects: { addFlags: ['prologue_fortune_adele', 'prologue_fortune_any'] },
        availability: { condition: { notFlag: 'prologue_fortune_adele' } }
      },
      {
        id: 'prologue_cards_read_lena',
        text: 'Предложить погадать Лене.',
        nextScene: 'prologue_cards_lena',
        effects: { addFlags: ['prologue_fortune_lena', 'prologue_fortune_any'] },
        availability: { condition: { notFlag: 'prologue_fortune_lena' } }
      },
      {
        id: 'prologue_cards_read_otto',
        text: 'Предложить погадать Отто.',
        nextScene: 'prologue_cards_otto',
        availability: {
          condition: {
            flag: 'prologue_fortune_any'
          }
        }
      },
    ],
  },

  prologue_observe_bruno: {
    id: 'prologue_observe_bruno',
    background: '/images/prolog/coupe4p.png',
    characters: [{ id: 'bruno', name: 'Бруно Вебер', position: 'center' }],
    dialogue: [
      {
        speaker: 'Восприятие',
        characterId: 'perception',
        text: 'Крепкие руки, мозоли от инструментов. Но не фермер — слишком точные движения. Инженер? Механик?',
      },
      {
        speaker: 'Анализ',
        characterId: 'analysis',
        text: 'Мазут под ногтями. Шрамы от ожогов. Он работал с машинами. Тяжёлыми машинами.',
      },
      {
        speaker: 'Восприятие',
        characterId: 'perception',
        text: 'Его взгляд постоянно скачет между бумагами которые он расскидал на столе.',
      },
      {
        speaker: 'Анализ',
        characterId: 'analysis',
        text: 'Заводской мастер? Нет, слишком независим. Скорее — вольный техник. Из тех, кто чинит то, что другие списали.',
      },
    ],
    nextScene: 'prologue_observe_selection',
  },

  prologue_observe_adele: {
    id: 'prologue_observe_adele',
    background: '/images/prolog/coupe4p.png',
    characters: [{ id: 'adele', name: 'Адель', position: 'center' }],
    dialogue: [
      {
        speaker: 'Восприятие',
        characterId: 'perception',
        text: 'Дерзкий взгляд, но глаза постоянно сканируют выходы. Поза расслабленная, но мышцы готовы к рывку.',
      },
      {
        speaker: 'Анализ',
        characterId: 'analysis',
        text: 'Она одета в дорогой и функциональный комбинезон. Больше похожий на униформу',
      },
      {
        speaker: 'Анализ',
        characterId: 'analysis',
        text: 'Возможно работает курьером в одной из тех немногих компаний, которые делают доставку даже в карантинные зоны.',
      },
    ],
    nextScene: 'prologue_observe_selection',
  },

  prologue_observe_lena: {
    id: 'prologue_observe_lena',
    background: '/images/prolog/coupe4p.png',
    characters: [{ id: 'lena', name: 'Лена Рихтер', position: 'center' }],
    dialogue: [
      {
        speaker: 'Восприятие',
        characterId: 'perception',
        text: 'Она одета в медицинский халат. Руки нежные, ногти ухоженные, заметны мазоли на указательном и большом пальце. ',
      },
      {
        speaker: 'Логика',
        characterId: 'logic',
        text: 'Она хирург. ',
      },
      {
        speaker: 'Восприятие',
        characterId: 'perception',
        text: 'Под глазами — тени от бессонных ночей. Но взгляд не потухший, скорее задумчивый.',
      },
      {
        speaker: 'Логика',
        characterId: 'logic',
        text: 'Возможно хирург. ',
      },
    ],
    nextScene: 'prologue_observe_selection',
  },

  prologue_observe_otto: {
    id: 'prologue_observe_otto',
    background: '/images/prolog/coupe4p.png',
    characters: [{ id: 'otto', name: 'Отто Кляйн', position: 'center' }],
    dialogue: [
      {
        speaker: 'Восприятие',
        characterId: 'perception',
        text: 'Военная выправка. Даже сидя он держит спину прямо. Руки на коленях — готов встать за секунду.',
      },
      {
        speaker: 'Логика',
        characterId: 'logic',
        text: 'Шрамы под воротником. Татуировка едва видна "8" — номер подразделения?',
      },
      {
        speaker: 'Эмпатия',
        characterId: 'empathy',
        text: 'Его взгляд тяжёлый, но не злой. Усталость человека, который видел слишком много.',
      },
      {
        speaker: 'Логика',
        characterId: 'logic',
        text: 'Ветеран. Не офицер — нет высокомерия. Сержант или старшина. Тот, кто вытаскивал своих из огня.',
      },
    ],
    nextScene: 'prologue_coupe_main_talk',
  },

  prologue_cards_bruno: {
    id: 'prologue_cards_bruno',
    background: '/images/prolog/coupe4p.png',
    characters: [{ id: 'bruno', name: 'Бруно Вебер', position: 'center', emotion: { primary: 'serious' } }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты раскладываешь карты. Одна из них переворачивается — Отшельник. Фигура с фонарем, освещающим путь во тьме.',
      },
      {
        speaker: 'Восприятие',
        characterId: 'perception',
        text: 'Свет во тьме. Он ищет что-то. Или кого-то.',
      },
      {
        speaker: 'Главный Герой',
        characterId: 'hero',
        text: 'Карта говорит о приближении. Ты ходишь кругами, Бруно, но сейчас вышел на финишную прямую. То, что ты ищешь — ответы, человек, место — гораздо ближе, чем тебе кажется.',
      },
      {
        speaker: 'Бруно Вебер',
        text: '...Надеюсь, ты прав.',
      },
    ],
    nextScene: 'prologue_cards_selection',
  },

  prologue_cards_adele: {
    id: 'prologue_cards_adele',
    background: '/images/prolog/coupe4p.png',
    characters: [{ id: 'adele', name: 'Адель', position: 'center', emotion: { primary: 'tense' } }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты переворачиваешь карту. Луна. Но ты видишь больше, чем просто рисунок.',
      },
      {
        speaker: 'Восприятие',
        characterId: 'perception',
        text: 'Красивая женщина с холодным лицом. В складках платья — кинжал. Или ключ. Она прячет больше, чем показывает.',
      },
      {
        speaker: 'Главный Герой',
        text: 'Эта карта означает тайну. Карта иллюзий, скрытности и манипуляций.',
      },
      {
        speaker: 'Адель',
        text: 'Опасная дама. Мне она нравится. Умеет постоять за себя.',
      },
    ],
    nextScene: 'prologue_cards_selection',
  },

  prologue_cards_lena: {
    id: 'prologue_cards_lena',
    background: '/images/prolog/coupe4p.png',
    characters: [{ id: 'lena', name: 'Лена Рихтер', position: 'center', emotion: { primary: 'fearful' } }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты переворачиваешь карту. Двойственное изображение: с одной стороны — Ангел с белыми крыльями, с другой — окровавленная коса Жнеца.',
      },
      {
        speaker: 'Драма',
        characterId: 'drama',
        text: 'Свет и тьма. Жизнь и смерть. Она будет стоять на границе.',
      },
      {
        speaker: 'Главный Герой',
        text: 'Ты светлая душа, Лена. Однако карта говорит, что тебе придётся принимать решение на границе света и тьмы.',
      },
      {
        speaker: 'Лена Рихтер',
        text: ' Я врач! Я клятву давала! Я буду лечить, а не убивать!',
      },
    ],
    nextScene: 'prologue_cards_selection',
  },

  prologue_cards_otto: {
    id: 'prologue_cards_otto',
    background: '/images/prolog/coupe4p.png',
    characters: [{ id: 'otto', name: 'Отто Кляйн', position: 'center' }],
    dialogue: [
      {
        speaker: 'Отто Кляйн',
        text: 'Карты? Оставь их для тех, кто ищет утешения в сказках. Я не верю в судьбу. В окопах судьбу решает калибр снаряда и скорость твоей реакции.',
      },
      {
        speaker: 'Отто Кляйн',
        text: 'Заканчивай это всё. Давай лучше чаю попьём, пока он совсем не остыл. Нам ещё долго ехать.',
      },
    ],
    nextScene: 'prologue_coupe_main_talk',
  },

  prologue_coupe_main_talk: {
    id: 'prologue_coupe_main_talk',
    background: '/images/prolog/coupe4p.png',
    characters: [
      { id: 'bruno', name: 'Бруно Вебер', position: 'left' },
      { id: 'lena', name: 'Лена Рихтер', position: 'right' },
      { id: 'adele', name: 'Адель', position: 'right' },
      { id: 'otto', name: 'Отто Кляйн', position: 'left' },
    ],
    dialogue: [
      {
        speaker: 'Бруно Вебер',
        text: 'Подъезжаем. Я узнаю эти горы.',
      },
      {
        speaker: 'Бруно Вебер',
        text: 'Надеюсь, старина Дитер не забыл меня встретить. Он писал, что устроился у Артисанов. "Приезжай, Бруно, тут есть работа для тех, кто отличает гайку и шайбу".',
      },
      {
        speaker: 'Лена Рихтер',
        text: 'Я сейчас душу бы продала не за работу, а за ванну. Настоящую, фаянсовую ванну. Наполненную доверху теплой водой и пеной. Чтобы смыть с себя эти прелести дальней дороги.',
      },
      {
        speaker: 'Адель',
        text: 'Мелко плаваешь, док. Ванна — это гигиена. А жить надо ради удовольствия.',
      },
      {
        speaker: 'Адель',
        text: 'В городе есть рабочая инфраструктура, так что за хорошую плату можно позволить себе сауну и массаж.',
      },
      {
        speaker: 'Адель',
        text: 'Вот это — цель. А помыться можно и в Рейне.',
      },
      {
        speaker: 'Лена Рихтер',
        text: 'В Рейне? Ты хоть представляешь, какой там радиационный фон? После таких "купаний" мне придется лечить тебя от сыпи по всему телу.',
      },
      {
        speaker: 'Отто Кляйн',
        text: 'Массажи, ванны... Вы как дети, честное слово.',
      },
      {
        speaker: 'Отто Кляйн',
        text: 'В городе есть порядок, а значит и такие мелочи там будут . Всё, что мне нужно — это хороший бар, где не разбавляют.',
      },
      {
        speaker: 'Отто Кляйн',
        text: 'Я хочу выпить. Так, чтобы внутри всё выжгло. А потом пойду в вербовочный пункт. "Железная леди" платит тем, кто соблюдает требования.',
      },
    ],
    nextScene: 'prologue_coupe_exit',
  },

  prologue_coupe_exit: {
    id: 'prologue_coupe_exit',
    background: '/images/prolog/coupe4p.png',
    characters: [{ id: 'otto', name: 'Отто Кляйн', position: 'left' }],
    dialogue: [
      {
        speaker: 'Отто Кляйн',
        characterId: 'otto',
        text: 'Ну, каждому своё. Главное — мы почти доехали. Дальше — проще. Ладно, пойду спрошу у контролёра почему мы еле плетёмся.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Отто выходит из купе. Тебе тоже становится тесно. Хочется уединиться, подумать.',
      },
    ],
    nextScene: 'prologue_tambour_arrival',
  },


  // ============================================================================
  // STAGE 2: THE TAMBOUR (Выбор пути)
  // ============================================================================

  prologue_tambour_arrival: {
    id: 'prologue_tambour_arrival',
    background: TAMBOUR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Внутренний голос',
        text: '«Пора. Ганс сказал, связной будет на платформе. Но сначала — успокоить нервы.»',
      },
    ],
    choices: [
      {
        id: 'prologue_choice_cards',
        text: 'Достать потрёпанную колоду карт (Психика / Азарт).',
        nextScene: 'prologue_tambour_cards',
        effects: {
          addFlags: ['prologue_cards'],
          immediate: [
            { type: 'skill_boost', data: { skillId: 'gambler', amount: 2 } },
            { type: 'skill_boost', data: { skillId: 'drama', amount: 1 } },
          ],
        },
      },
      {
        id: 'prologue_choice_knife',
        text: 'Вытащить армейский нож (Сила / Бой).',
        nextScene: 'prologue_tambour_knife',
        effects: {
          addFlags: ['prologue_knife'],
          immediate: [
            { type: 'skill_boost', data: { skillId: 'combat', amount: 2 } },
            { type: 'skill_boost', data: { skillId: 'physics', amount: 1 } },
          ],
        },
      },
      {
        id: 'prologue_choice_smoke',
        text: 'Прикурить последнюю сигарету (Улица / Осторожность).',
        nextScene: 'prologue_tambour_smoke',
        effects: {
          addFlags: ['prologue_smoke'],
          immediate: [
            // +1 Разум (интерпретируем как +1 к ключевому навыку группы mind: logic)
            { type: 'skill_boost', data: { skillId: 'logic', amount: 1 } },
            // +2 Знания
            { type: 'skill_boost', data: { skillId: 'knowledge', amount: 2 } },
          ],
        },
      },
    ],
  },

  // --- PATH: KNIFE ---
  prologue_tambour_knife: {
    id: 'prologue_tambour_knife',
    background: TRAIN_KNIFE_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Тяжелая рукоять привычно ложится в ладонь. Ты балансируешь нож, наслаждаясь идеальным равновесием стали.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вдруг по потолку начинает что-то вибрировать и скрести по направлению к окну.',
      },
      {
        speaker: 'Рассказчик',
        background: '/images/oknorazbil.png',
        text: 'Окно тамбура разлетается вдребезги! Монстр просовывает свою голову, и ты можешь рассмотреть его во всей красе. Жуткие конечности, фасеточные глаза, хобот, готовый выстрелить ядом!',
      },
    ],
    choices: [
      {
        id: 'prologue_knife_reaction',
        text: 'Метнуть нож!',
        nextScene: 'prologue_tambour_knife_fight',
      },
      {
        id: 'prologue_knife_kick',
        text: 'Ударить ногой!',
        nextScene: 'prologue_tambour_knife_kick',
      },
    ],
  },

  prologue_tambour_knife_fight: {
    id: 'prologue_tambour_knife_fight',
    background: '/images/oknorazbil.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Лезвие входит точно в цель. Тварь визжит! Ты добиваешь её мощным ударом ноги, отправляя в полёт прочь из поезда.',
      },
    ],
    choices: [
      {
        id: 'prologue_knife_post_fight',
        text: 'Отдышаться.',
        nextScene: 'prologue_conductor_enter',
        effects: {
          addFlags: ['prologue_monster_killed_solo'],
          xp: 40
        }
      }
    ]
  },

  prologue_tambour_knife_kick: {
    id: 'prologue_tambour_knife_kick',
    background: '/images/oknorazbil.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'При попытке просто снести монстра он успевает схватить тебя за ногу. В инерции падения тварь прорезает штанину и впивается в голень.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты, стиснув зубы от боли, вторым ударом всё же выпихиваешь её наружу.',
      },
    ],
    choices: [
      {
        id: 'prologue_kick_post_fight',
        text: 'Перевязать ногу.',
        nextScene: 'prologue_conductor_enter',
        effects: {
          addFlags: ['prologue_monster_kicked'],
          immediate: [{ type: 'hp_delta', data: { amount: -5 } }],
          xp: 40
        }
      }
    ]
  },

  // --- PATH: CARDS ---
  prologue_tambour_cards: {
    id: 'prologue_tambour_cards',
    background: TRAIN_CARDS_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Карты мелькают в руках. Ты показываешь невидимой публике трюк с исчезновением Туза.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вдруг по потолку начинает что-то вибрировать. Стекло тамбура взрывается осколками!',
      },
      {
        speaker: 'Рассказчик',
        background: '/images/oknorazbil.png',
        text: 'Чудовище врывается внутрь, готовясь к атаке.',
      },
    ],
    choices: [
      {
        id: 'prologue_cards_reaction',
        text: 'Фокус "Исчезающий свет" (Фонарик из рукава).',
        nextScene: 'prologue_tambour_cards_fight',
      },
    ],
  },

  prologue_tambour_cards_fight: {
    id: 'prologue_tambour_cards_fight',
    background: '/images/oknorazbil.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Резкое движение — и в руке вспыхивает фонарь. Луч бьёт прямо в чувствительные глаза твари. Дезориентация мгновенная!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты используешь момент и выпинываешь ослепленного монстра наружу.',
      }
    ],
    choices: [
      {
        id: 'prologue_cards_post_fight',
        text: 'Спрятать фонарик.',
        nextScene: 'prologue_conductor_enter',
        effects: {
          addFlags: ['prologue_monster_blinded'],
          xp: 40
        }
      }
    ]
  },

  // --- PATH: SMOKE ---
  prologue_tambour_smoke: {
    id: 'prologue_tambour_smoke',
    background: TRAIN_CIGAR_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Дым медленно поднимается к потолку. Ты внимательно следишь за тенями за окном.',
      },
      {
        speaker: 'ЛОГИКА',
        characterId: 'logic',
        text: 'Где-то в соседнем проходе скрипит дверь. Слишком уверенно. Это не пассажир — это Проводник.',
      },
      {
        speaker: 'АНАЛИЗ',
        characterId: 'knowledge',
        text: 'Постукивания сверху. По крыше. Ритмично. Кто-то движется над тамбуром.',
      },
      {
        speaker: 'Рассказчик',
        background: '/images/oknorazbil.png',
        text: 'Твоё чутьё вопит об опасности за секунду до удара. Стекло лопается!',
      },
      {
        speaker: 'Рассказчик',
        background: '/images/oknorazbil.png',
        text: 'Существо раздувает ноздри, готовясь плюнуть кислотой!',
      },
    ],
    choices: [
      {
        id: 'prologue_smoke_reaction',
        text: 'Бросить сигарету, сбивая прицел!',
        nextScene: 'prologue_tambour_smoke_fight',
      },
      {
        id: 'prologue_smoke_grab_trunk',
        text: 'Схватить за хобот!',
        nextScene: 'prologue_tambour_smoke_grab',
        effects: {
          immediate: [{ type: 'hp_delta', data: { amount: -5 } }],
        },
      },
      {
        id: 'prologue_smoke_escape',
        text: 'Попытаться сбежать.',
        nextScene: 'prologue_tambour_smoke_escape',
        effects: {
          addFlags: ['prologue_acid_burn'],
          immediate: [{ type: 'hp_delta', data: { amount: -5 } }],
        },
      },
    ],
  },

  prologue_tambour_smoke_grab: {
    id: 'prologue_tambour_smoke_grab',
    background: '/images/oknorazbil.png',
    characters: [{ id: 'conductor', name: 'Проводник', position: 'right' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты хватаешь существо за хобот и, напрягаясь всем телом, разворачиваешь его в сторону.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Едкая жижа ударяет в стену и начинает шипеть при контакте с поверхностью.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты чувствуешь, как одна из лап врезается тебе в бок и острую боль после удара.',
      },
      {
        speaker: 'Рассказчик',
        text: 'В этот момент дверь распахивается — в тамбур влетает Проводник.',
      },
      {
        speaker: 'Герой',
        text: 'ФОНАРЬ!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Проводник включает прожектор, ослепляя тварь. Ты ловишь момент и ударом ноги отправляешь её прочь — в ночь за окном.'
      },
    ],
    nextScene: 'prologue_coupe_start',
  },

  prologue_tambour_smoke_escape: {
    id: 'prologue_tambour_smoke_escape',
    background: '/images/oknorazbil.png',
    characters: [{ id: 'conductor', name: 'Проводник', position: 'right' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты ловко распахиваешь дверь и просачиваешься в проход.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Но в судорожной попытке захлопнуть её — едкая жижа, выпущенная тварью, пролетает в щель и попадает тебе в шею.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ощущение — как раскалённые капли металла. Дыхание сбивается, глаза слезятся.',
      },
      {
        speaker: 'Проводник',
        text: 'Что случилось?',
      },
      {
        speaker: 'Рассказчик',
        text: 'Раздаётся за твоей спиной голос мужчины средних лет.',
      },
      {
        speaker: 'Герой',
        text: 'Там монстр! Он разбил стекло и пытается пролезть!',
      },
      {
        speaker: 'Проводник',
        text: 'Ты резко открываешь, а я слеплю фонарём и приложу дубинкой!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Монстр уже наполовину протиснулся в оконную раму. Проводник просовывает руку внутрь и включает свет.',
      },
      {
        speaker: 'Проводник',
        text: 'Резкий и яркий свет заставляет монстра биться в конвульсиях, и проводник, не теряя времени, наносит удар телескопической дубинкой.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Тварь вылетает из окна, а вы спешно захлопываете то, что осталось от рамы.',
      },
    ],
    choices: [
      {
        id: 'prologue_smoke_escape_post',
        text: 'Кивнуть проводнику.',
        nextScene: 'prologue_conductor_dialogue_plan',
        effects: {
          xp: 40
        }
      }
    ]
  },

  prologue_tambour_smoke_fight: {
    id: 'prologue_tambour_smoke_fight',
    background: '/images/oknorazbil.png',
    characters: [{ id: 'conductor', name: 'Проводник', position: 'right' }],
    dialogue: [
      {
        speaker: 'Герой',
        text: 'Тут монстр! Нужен ФОНАРЬ!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Тлеющий бычок летит в глаз монстра, заставляя его биться в конвульсиях. Ты хватаешь хобот и направляешь зелёный плевок в сторону.',
      },
      {
        speaker: 'Рассказчик',
        text: 'В ту же секунду дверь распахивается — Проводник с мощным прожектором заливает тамбур светом.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Монстр, ослепленный и сбитый с толку, получает удар ногой и вылетает в ночь.',
      }
    ],
    choices: [
      {
        id: 'prologue_smoke_post_fight',
        text: 'Кивнуть проводнику.',
        nextScene: 'prologue_conductor_dialogue_plan',
        effects: {
          addFlags: ['prologue_conductor_saved'],
          xp: 40
        }
      }
    ]
  },


  // ============================================================================
  // STAGE 3: ESCORT & CRISIS
  // ============================================================================

  prologue_conductor_enter: {
    id: 'prologue_conductor_enter',
    background: '/images/arena/boivpoezde.png',
    characters: [{ id: 'conductor', name: 'Проводник', position: 'center' }],
    dialogue: [
      {
        speaker: 'Проводник',
        text: 'Неплохая реакция, парень! Но это только разведчик. Они сейчас везде полезут.',
      },
    ],
    choices: [
      {
        id: 'prologue_conductor_enter_next',
        text: 'Что делаем?',
        nextScene: 'prologue_conductor_dialogue_plan'
      }
    ]
  },

  prologue_conductor_dialogue_plan: {
    id: 'prologue_conductor_dialogue_plan',
    background: '/images/arena/boivpoezde.png',
    characters: [{ id: 'conductor', name: 'Проводник', position: 'center' }],
    dialogue: [
      {
        speaker: 'Проводник',
        text: 'Надо двигаться к голове поезда. Собираем всех живых в безопасных вагонах.',
      },
      {
        speaker: 'Проводник',
        text: 'И главное — не стрелять без нужды. Шум их только злит и сзывает стаю.',
      },
      {
        speaker: 'Проводник',
        text: 'Если в вагоне тихо — значит там или порядок, или уже кладбище. Пошли.',
      }
    ],
    choices: [
      {
        id: 'prologue_move_to_next_car',
        text: 'Идти в следующий вагон.',
        nextScene: 'prologue_next_car_noise',
      }
    ]
  },

  prologue_next_car_noise: {
    id: 'prologue_next_car_noise',
    background: '/images/arena/boivpoezde.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Из следующего вагона доносится грохот. Крик, звон стекла.',
      },
    ],
    choices: [
      {
        id: 'prologue_open_door_noise',
        text: 'Выбить дверь!',
        nextScene: 'prologue_find_lena',
      }
    ]
  },

  prologue_find_lena: {
    id: 'prologue_find_lena',
    background: '/images/backgrounds/NashelLeny.png',
    characters: [{ id: 'lena', name: 'Лена Рихтер', position: 'center' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Внутри хаос. Пассажиры забились в углы. Посреди вагона Лена Рихтер "колдует" над раненым. В её руке блестит хирургический зажим... или стилет?',
      },
      {
        speaker: 'Рассказчик',
        text: 'Окно разбито. В проёмах появляются новые твари. Мелкие, быстрые.',
      },
    ],
    choices: [
      {
        id: 'prologue_start_tutorial_1',
        text: 'К бою! (Учебный бой)',
        effects: {
          immediate: [{
            type: 'start_tutorial_battle',
            data: {
              returnScene: 'prologue_after_tutorial_1', // Победа
              defeatScene: 'prologue_defeat'            // Поражение (опционально)
            }
          }]
        }
      }
    ]
  },

  // ============================================================================
  // STAGE 4: BOSS AMBUSH & BRUNO
  // ============================================================================

  prologue_after_tutorial_1: {
    id: 'prologue_after_tutorial_1',
    background: '/images/backgrounds/NashelLeny.png',
    characters: [{ id: 'lena', name: 'Лена Рихтер', position: 'right' }],
    dialogue: [
      {
        speaker: 'Лена Рихтер',
        text: 'Вроде пока что отбились. Спасибо за помощь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Лена быстро перевязывает тебе царапину. Её движения точные, профессиональные. Тут вы замечаете открывающуюся дверь позади вас и готовитесь к худшему, однако в проёме появляется Отто.',
      }
    ],
    choices: [
      {
        id: 'prologue_otto_entrance',
        text: 'Обернуться.',
        nextScene: 'prologue_otto_warning',
      }
    ]
  },

  prologue_otto_warning: {
    id: 'prologue_otto_warning',
    background: '/images/backgrounds/NashelLeny.png',
    characters: [{ id: 'otto', name: 'Отто Кляйн', position: 'left' }],
    dialogue: [
      {
        speaker: 'Отто Кляйн',
        text: 'С хвоста прёт орда! Надо двигаться дальше, быстро!',
      },
      {
        speaker: 'Рассказчик',
        text: 'В этот момент стену вагона сотрясает чудовищный удар. Из соседнего тамбура выламывая дверь, вваливается Тварь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Она огромная. Хитин блестит как броня танка. Это не разведчик. Это Палач. Вы понимаете, что ситуация не на вашей стороне.',
      }
    ],
    choices: [
      {
        id: 'prologue_boss_reaction',
        text: 'Приготовиться к худшему.',
        nextScene: 'prologue_bruno_boom',
      }
    ]
  },

  prologue_bruno_boom: {
    id: 'prologue_bruno_boom',
    background: '/images/backgrounds/NashelLeny.png',
    characters: [{ id: 'bruno', name: 'Бруно Вебер', position: 'left' }],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: ' Монстр отбрасывает пасажиров на своём пути без промедления приближаясь к вам.',
      },
      {
        speaker: 'Бруно Вебер',
        text: 'Эй, чудовище! Лови "привет" из Зоны Гамма!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Бруно швыряет связку самодельных трубок на шею монстра. ВЗРЫВ! Вагон наполняется едким дымом.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Тварь ревёт. Ей оторвало часть щупалец, броня треснула, но она всё ещё жива. И она в ярости.',
      }
    ],
    choices: [
      {
        id: 'prologue_start_tutorial_boss',
        text: 'Добить её! (Бой с боссом)',
        effects: {
          immediate: [{
            type: 'start_tutorial_battle',
            data: {
              returnScene: 'prologue_fjr_storming', // Изменено: переход к сцене с FJR
              defeatScene: 'prologue_defeat',
              enemyKey: 'boss_train_prologue'
            }
          }]
        }
      }
    ]
  },

  // ============================================================================
  // STAGE 5: FJR DEPLOYMENT & INSPECTION
  // ============================================================================

  prologue_fjr_storming: {
    id: 'prologue_fjr_storming',
    background: '/images/prolog/PosleBoyasbossom.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Монстр повержен. Его туша еще бьется в конвульсиях, когда вагон содрогается от резкого торможения.',
      },
      {
        speaker: 'Голос из динамика',
        text: '«Фрайбург-Центральный. Конечная.»',
      },
      {
        speaker: 'Рассказчик',
        text: 'Двери тамбура вылетают с грохотом. В вагон врывается штурмовая группа FJR в тяжёлой броне. Красные лазерные целеуказатели разрезают пороховой дым, выискивая цели.',
      },
      {
        speaker: 'Спецназ',
        text: '(Через вокодер) ОРУЖИЕ НА ПОЛ! ЛИЦОМ К СТЕНЕ!',
      },
      {
        speaker: 'Лена Рихтер',
        text: 'Здесь раненые! Им нужна срочная помощь!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Лена высоко поднимает руки, показывая медицинский патч на рукаве. Её голос звучит твёрдо, перекрывая шум.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Бруно, сохраняя ледяное спокойствие, медленно опускает руки, незаметно скрывая самодельную бомбу в глубине широкого рукава.',
      },
    ],
    choices: [
      {
        id: 'prologue_fjr_surrender',
        text: 'Поднять руки.',
        nextScene: 'prologue_fjr_inspection',
      },
    ],
  },

  prologue_fjr_inspection: {
    id: 'prologue_fjr_inspection',
    background: '/images/prolog/PosleBoyasbossom.png',
    characters: [
      { id: 'fjr_commander', name: 'Командир FJR', position: 'center' }
    ],
    dialogue: [
      {
        speaker: 'Командир FJR',
        text: 'Продолжать зачистку поезда! (После отданой команды, он смотрит на останки монстра, потом на вас) Вам дьявольски повезло .',
      },
      {
        speaker: 'Командир FJR',
        text: 'Медики — осмотреть раненых. Остальные — на выход, живо!',
      },
      {
        speaker: 'Рассказчик',
        text: 'Вас грубо подхватывают под руки и выталкивают на перрон. Свежий, холодный воздух обдаёт лицо, рассветные лучи освещают людей на перроне.',
      },
    ],
    choices: [
      {
        id: 'prologue_to_registration',
        text: 'Сойти на перрон.',
        nextScene: 'freiburg_platform_gustav',
        effects: {
          addFlags: ['arrived_at_freiburg', 'prologue_complete', 'survived_train_crash'],
        },
      },
    ],
  },

  prologue_defeat: {
    id: 'prologue_defeat',
    background: '/images/prolog/PosleBoyasbossom.png',
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Тьма смыкается. Твой путь заканчивается здесь, в грязном тамбуре поезда, так и не доехавшего до мечты.',
      }
    ],
    choices: [
      {
        id: 'try_again',
        text: 'Попробовать снова',
        nextScene: 'prologue_awakening' // Или рестарт боя
      }
    ]
  }

}
