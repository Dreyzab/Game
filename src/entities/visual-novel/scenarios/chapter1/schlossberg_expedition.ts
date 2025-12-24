import type { Scene } from '../../model/types'

const FOREST_BG = '/images/backgrounds/forest_encounter.jpg'
const ANOMALY_BG = '/images/backgrounds/anomaly.jpg'
const LOOT_BG = '/images/backgrounds/artifact_found.jpg'

const ORK_SPRITE = '/images/npcs/ork.jpg'
const SILHOUETTE_SPRITE = '/images/ui/stalker_silhouette.png'

export const schlossbergExpeditionScenes: Record<string, Scene> = {
  schlossberg_trail_entry: {
    id: 'schlossberg_trail_entry',
    background: FOREST_BG,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Шлагбаум остаётся позади. Камень сменяется влажной землёй, городские звуки тонут в лесной тишине. Туристическая тропа петляет между стволами, поднимая тебя всё выше — туда, где когда-то гуляли студенты и фотографировались на фоне замка.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Дозиметр на поясе время от времени щёлкает — редкие, нервные импульсы. Словно кто-то проверяет, на месте ли ты.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Через полчаса подъёма ты замечаешь странность: на влажной земле у обочины — глубокие борозды. Кто-то тяжёлый тащил что-то… или кого-то. Следы уходят в густой подлесок, в сторону от маршрута. На листьях — бурые пятна крови, ещё свежие.',
      },
      {
        speaker: 'ЛОГИКА',
        text: 'Следы волочения. Не звериная тропа. Это произошло недавно.',
      },
    ],
    choices: [
      {
        id: 'curiosity_follow',
        text: '[ЛЮБОПЫТСТВО] Свернуть с тропы и пойти по следам.',
        nextScene: 'schlossberg_follow_tracks',
      },
      {
        id: 'caution_ignore',
        text: '[ОСТОРОЖНОСТЬ] Игнорировать следы и продолжить подъём к схрону.',
        nextScene: 'schlossberg_stay_on_trail',
      },
      {
        id: 'analysis_study',
        text: '[АНАЛИЗ] Остановиться и изучить следы и звуки детальнее.',
        nextScene: 'schlossberg_analyze_tracks',
      },
    ],
  },

  schlossberg_analyze_tracks: {
    id: 'schlossberg_analyze_tracks',
    background: FOREST_BG,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты приседаешь у борозд. Земля содрана так, будто по ней тащили металл. Между комками глины — тонкие серые щепки: деревянное древко?',
      },
      {
        speaker: 'Рассказчик',
        text: 'Кровь — не одна. Где-то темнее, почти чёрная, где-то — с едва заметным голубым отливом, будто в ней растворён свет.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ветер приносит звук: тихий ритмичный шелест и глухие удары, словно металл о камень. Дозиметр щёлкает чаще — направление совпадает со следами.',
      },
      {
        speaker: 'ЛОГИКА',
        text: 'Там двое. Или двое видов. И у одного — явно не обычная кровь.',
      },
    ],
    choices: [
      {
        id: 'analysis_follow_prepared',
        text: 'Пойти по следам, но сначала занять позицию и двигаться тише.',
        nextScene: 'schlossberg_follow_tracks',
        effects: { addFlags: ['schlossberg_prepared_approach'] },
      },
      {
        id: 'analysis_back_to_trail',
        text: 'Остаться на тропе и не рисковать.',
        nextScene: 'schlossberg_stay_on_trail',
        effects: { addFlags: ['schlossberg_analyzed_tracks'] },
      },
      {
        id: 'analysis_retreat',
        text: 'Развернуться. Сегодня ты не готов к этому лесу.',
        nextScene: 'schlossberg_retreat',
      },
    ],
  },

  schlossberg_follow_tracks: {
    id: 'schlossberg_follow_tracks',
    background: FOREST_BG,
    characters: [
      {
        id: 'wild_orc',
        name: 'Дикарь',
        position: 'left',
        sprite: ORK_SPRITE,
        emotion: { primary: 'angry', intensity: 70 },
      },
      {
        id: 'chimera',
        name: 'Химера-волк',
        position: 'right',
        sprite: SILHOUETTE_SPRITE,
        emotion: { primary: 'angry', intensity: 80 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты сворачиваешь с тропы. Подлесок становится гуще, ветви цепляются за рукава. Следы крови теперь повсюду — на листьях, на коре, брызгами на камнях.',
      },
      {
        speaker: 'Рассказчик',
        condition: { flag: 'schlossberg_prepared_approach' },
        text: 'Ты идёшь медленнее, но умнее: по кромке, под ветром, оставляя между собой и просекой лишние стволы. Это не делает тебя невидимым — но даёт секунды, которые иногда стоят жизни.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Дозиметр щёлкает чаще. Стрелка подрагивает в жёлтой зоне. Звуки впереди нарастают: лязг металла, рычание, приглушённые крики. Кто-то сражается. И судя по звуку — из последних сил.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ещё несколько шагов — и под ногами оказывается порванный военный пояс. Темно-зелёная кобура разорвана, клёпки погнуты, на коже — глубокие борозды от когтей.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты выглядываешь из-за дерева. На небольшой прогалине в мутном свете аномалии схлестнулись двое.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Зеленокожий гигант в полуразорванной кольчуге держит двуручный топор — грубо сделанный, с ржавым лезвием. Напротив — химера-волк размером с телёнка: шерсть клочьями, местами голые кости светятся холодным голубым, в глазах — ледяной огонь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Химера бросается в атаку. Прыжок — молниеносный, смертельный. Дикарь делает шаг навстречу и выставляет древко топора как щит.',
      },
      {
        speaker: 'Рассказчик',
        text: 'ХРУСТ. Пасть смыкается на дереве, щепки летят. Дикарь закручивается всем корпусом, используя инерцию зверя, и вбивает его боком в выпуклый валун. Камень крошится. Волк визжит — но не разжимает челюстей.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Когти химеры цепляются за кольчугу, рвут металл и плоть. Древко не выдерживает: треск — и топор ломается пополам. Дикарь падает на спину. Волк — сверху.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Дикарь держит пасть твари двумя руками, и её клыки зависают в сантиметрах от его горла. Руки дрожат. Секунда — и всё закончится.',
      },
    ],
    choices: [
      {
        id: 'intervene_shoot',
        text: '[ВМЕШАТЬСЯ] Выстрелить, пока тварь открыта.',
        nextScene: 'schlossberg_help_orc_shot',
        effects: { addFlags: ['schlossberg_shot_fired'] },
      },
      {
        id: 'observe',
        text: '[НАБЛЮДАТЬ] Не вмешиваться. Ждать конца.',
        nextScene: 'schlossberg_watch_orc_comeback',
      },
      {
        id: 'finish_winner',
        text: '[ЖЕСТОКОСТЬ] Дождаться конца и добить победителя.',
        nextScene: 'schlossberg_watch_orc_comeback',
        effects: { addFlags: ['schlossberg_intent_finish_winner'] },
      },
      {
        id: 'retreat',
        text: 'Отступить. Это не твоя война.',
        nextScene: 'schlossberg_retreat',
      },
    ],
  },

  schlossberg_help_orc_shot: {
    id: 'schlossberg_help_orc_shot',
    background: ANOMALY_BG,
    characters: [
      {
        id: 'wild_orc',
        name: 'Дикарь',
        position: 'left',
        sprite: ORK_SPRITE,
        emotion: { primary: 'angry', intensity: 80 },
      },
      {
        id: 'chimera',
        name: 'Химера-волк',
        position: 'right',
        sprite: SILHOUETTE_SPRITE,
        emotion: { primary: 'angry', intensity: 90 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты поднимаешь «Шершень». Пальцы холодные, но послушные. Выстрел гремит в лесу, как пощёчина тишине.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Пуля врезается в плечо химеры. Тварь дёргается, пасть на миг разжимается. Дикарь не упускает шанс: он подаётся вперёд, сбрасывает зверя и вгоняет обломок топорища в челюсть, ломая кость с сухим треском.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Химера ещё пытается подняться — и тут дикарь, рыча, вдавливает ей голову в камень. Голубое свечение костей меркнет, как гаснущий уголь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Дикарь тяжело дышит. Его грудь в крови — тёмной, почти чёрной. Он поворачивает голову в твою сторону. Маленькие налитые глаза цепляются за ствол твоего пистолета.',
      },
      {
        speaker: 'Рассказчик',
        text: 'На его шее — грубый амулет: обтёсанный камень на кожаном шнурке, исцарапанный символами.',
      },
    ],
    choices: [
      {
        id: 'parley',
        text: 'Опустить ствол и показать, что ты не враг.',
        nextScene: 'schlossberg_orc_parley',
      },
      {
        id: 'kill_orc_anyway',
        text: 'Добить дикаря, пока он еле стоит.',
        nextScene: 'schlossberg_orc_killed',
        effects: { addFlags: ['schlossberg_shot_fired'] },
      },
      {
        id: 'back_off_to_objective',
        text: 'Отступить в сторону цели, не провоцируя его.',
        nextScene: 'schlossberg_take_crystal',
        effects: { addFlags: ['schlossberg_skipped_amulet'] },
      },
    ],
  },

  schlossberg_orc_parley: {
    id: 'schlossberg_orc_parley',
    background: ANOMALY_BG,
    characters: [
      {
        id: 'wild_orc',
        name: 'Дикарь',
        position: 'center',
        sprite: ORK_SPRITE,
        emotion: { primary: 'neutral', intensity: 70 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты медленно опускаешь пистолет. Дикарь не расслабляется, но и не бросается. Он принюхивается, будто пытается понять, кто ты: добыча, угроза или… случайность.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он хрипло рычит что-то на своём языке, потом тычет пальцем в мёртвую химеру и резко проводит ребром ладони по воздуху — жест понятный без перевода: «конец».',
      },
      {
        speaker: 'Рассказчик',
        text: 'Пару секунд он смотрит на тебя, затем срывает с шеи амулет и швыряет его в траву у твоих ног. Не подарок. Метка. Сделка.',
      },
    ],
    choices: [
      {
        id: 'take_amulet_and_move',
        text: 'Поднять амулет и заняться тем, зачем пришёл.',
        nextScene: 'schlossberg_take_crystal',
        effects: { addFlags: ['schlossberg_amulet_obtained'] },
      },
      {
        id: 'leave_amulet',
        text: 'Не трогать странную вещь и уйти к схрону.',
        nextScene: 'schlossberg_take_crystal',
      },
    ],
  },

  schlossberg_watch_orc_comeback: {
    id: 'schlossberg_watch_orc_comeback',
    background: ANOMALY_BG,
    characters: [
      {
        id: 'wild_orc',
        name: 'Дикарь',
        position: 'left',
        sprite: ORK_SPRITE,
        emotion: { primary: 'determined', intensity: 80 },
      },
      {
        id: 'chimera',
        name: 'Химера-волк',
        position: 'right',
        sprite: SILHOUETTE_SPRITE,
        emotion: { primary: 'angry', intensity: 90 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты не шевелишься. Палец на спуске, но ты ждёшь.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Дикарь хрипит. Его руки дрожат, прогибаясь под напором химеры. Клыки всё ближе.',
      },
      {
        speaker: 'Рассказчик',
        text: 'И в тот момент, когда кажется, что всё кончено, дикарь издаёт низкий, отчаянный рык. Он отпускает пасть — не для того, чтобы сдаться.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Его рука молнией уходит к поясу. Блеск камня. Обтёсанный осколок с символами — как клык, как нож.',
      },
      {
        speaker: 'Рассказчик',
        text: 'УДАР. Снизу вверх, под челюсть, в мягкое место горла. Голубая кровь бьёт фонтаном, заливая дикарю лицо.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Химера булькает, дёргается и обмякает, наваливаясь всей тушей. Голубой огонь в глазах тухнет.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Тишина возвращается резко, как выключенный свет. Дикарь сталкивает с себя мёртвое тело и садится, кашляя. Он знает: он не один.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он смотрит прямо в твою сторону. В его взгляде нет ярости. Только усталое принятие и холодный расчёт: «ты следующий?»',
      },
      {
        speaker: 'Рассказчик',
        condition: { flag: 'schlossberg_intent_finish_winner' },
        text: 'Ты уже решил. Осталось только нажать.',
      },
    ],
    choices: [
      {
        id: 'kill_orc',
        text: '[ДОБИТЬ] Выстрелить в голову.',
        nextScene: 'schlossberg_orc_killed',
        effects: { addFlags: ['schlossberg_shot_fired'] },
      },
      {
        id: 'standoff',
        text: '[НЕЙТРАЛИТЕТ] Выйти из укрытия, держа его на мушке.',
        nextScene: 'schlossberg_orc_standoff',
      },
      {
        id: 'sneak_to_crystal',
        text: '[СКРЫТНОСТЬ] Пока он слаб — проскользнуть к расщелине и забрать кристалл.',
        nextScene: 'schlossberg_take_crystal',
        effects: { addFlags: ['schlossberg_skipped_amulet'] },
      },
      {
        id: 'leave_scene',
        text: 'Уйти, не рискуя.',
        nextScene: 'schlossberg_retreat',
      },
    ],
  },

  schlossberg_orc_standoff: {
    id: 'schlossberg_orc_standoff',
    background: ANOMALY_BG,
    characters: [
      {
        id: 'wild_orc',
        name: 'Дикарь',
        position: 'center',
        sprite: ORK_SPRITE,
        emotion: { primary: 'neutral', intensity: 65 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты выходишь на прогалину, не опуская пистолет. Дикарь медленно поднимается, покачиваясь. Между вами — несколько метров воздуха, пропитанного кровью и озоном.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он не кидается. Лишь проводит языком по клыкам, будто пробует мир на вкус. Затем делает шаг назад. Ещё один.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Он разворачивается боком — демонстрируя, что уходит, но не показывая спину. И исчезает в тени деревьев, оставляя тебе мёртвую химеру и вопрос: зачем он вообще был здесь?',
      },
    ],
    choices: [
      {
        id: 'focus_on_objective',
        text: 'Не преследовать. Забрать кристалл и уйти.',
        nextScene: 'schlossberg_take_crystal',
      },
      {
        id: 'finish_him',
        text: 'Передумать и выстрелить ему вслед.',
        nextScene: 'schlossberg_orc_killed',
        effects: { addFlags: ['schlossberg_shot_fired'] },
      },
    ],
  },

  schlossberg_orc_killed: {
    id: 'schlossberg_orc_killed',
    background: LOOT_BG,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты наводишься и нажимаешь на спуск. Выстрел короткий. Лес проглатывает звук и тут же возвращает его эхом.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Тело дикаря дёргается и оседает. Всё кончено. На земле — два мертвеца и одна тишина, которая на секунду кажется почти мирной.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты подходишь ближе и снимаешь с его шеи амулет: грубо обтёсанный камень на кожаном шнурке. Символы вырезаны неровно, но уверенно — рука не дрогнула ни разу.',
      },
      {
        speaker: 'Рассказчик',
        text: '(Получено: Амулет Дикаря)',
      },
    ],
    choices: [
      {
        id: 'take_amulet_and_go',
        text: 'Спрятать трофей и заняться кристаллом.',
        nextScene: 'schlossberg_take_crystal',
        effects: { addFlags: ['schlossberg_amulet_obtained'] },
      },
    ],
  },

  schlossberg_take_crystal: {
    id: 'schlossberg_take_crystal',
    background: ANOMALY_BG,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'В нескольких метрах, у скального выступа, ты замечаешь то, ради чего пришёл. В расщелине мерцает холодный голубой свет. Он пульсирует в такт редким щелчкам дозиметра, будто дышит.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Ты достаёшь контейнер, аккуратно берёшь кристалл и прячешь его внутрь. Даже через перчатку ощущается лёгкая вибрация — как у живого сердца.',
      },
      {
        speaker: 'Рассказчик',
        text: 'КВЕСТ ОБНОВЛЁН: «Шёпот Разлома». Цель: вернуться к Дитеру.',
      },
    ],
    choices: [
      {
        id: 'return_to_gate',
        text: 'Спуститься обратно к Швабентору.',
        nextScene: 'schlossberg_return_gate',
        effects: {
          addFlags: ['schlossberg_crystal_obtained', 'need_return_to_dieter'],
          removeFlags: ['need_visit_schwabentor'],
          xp: 20,
        },
      },
    ],
  },

  schlossberg_stay_on_trail: {
    id: 'schlossberg_stay_on_trail',
    background: FOREST_BG,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты заставляешь себя пройти мимо крови. В этом городе любопытство — причина смерти. Тропа ведёт вверх, и лес постепенно редеет, открывая вид на серые крыши Фрайбурга.',
      },
      {
        speaker: 'Рассказчик',
        text: 'У старой смотровой площадки валяется трухлявая скамья. Под ней — железный контейнер с простым кодовым замком. Три цифры. Дитер говорил: 4-5-1.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Дозиметр щёлкает чаще, чем тебе хотелось бы. Но здесь тихо. Слишком тихо.',
      },
    ],
    choices: [
      {
        id: 'open_cache',
        text: 'Набрать код 4-5-1 и вскрыть контейнер.',
        nextScene: 'schlossberg_take_crystal',
        effects: { addFlags: ['schlossberg_cache_opened'] },
      },
      {
        id: 'leave_without_cache',
        text: 'Передумать и уйти обратно, пока тихо.',
        nextScene: 'schlossberg_retreat',
      },
    ],
  },

  schlossberg_retreat: {
    id: 'schlossberg_retreat',
    background: FOREST_BG,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты отступаешь, не давая лесу шанса схлопнуться вокруг тебя. На сегодня хватит. Шлосберг никуда не денется… а вот ты — легко.',
      },
    ],
    choices: [
      {
        id: 'back_to_city',
        text: 'Вернуться в город.',
        nextScene: 'exit_to_map',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  schlossberg_return_gate: {
    id: 'schlossberg_return_gate',
    background: FOREST_BG,
    characters: [
      {
        id: 'schmidt',
        name: 'Капрал Шмидт',
        position: 'center',
        sprite: '/images/npcs/trader.jpg',
        emotion: { primary: 'neutral', intensity: 60 },
      },
    ],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Спуск даётся легче, но ты всё равно чувствуешь, как за спиной тянется невидимая нить — будто гора запоминает тех, кто трогал её свет.',
      },
      {
        speaker: 'Рассказчик',
        text: 'У Швабентора Шмидт встречает тебя коротким кивком.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'Живой. Уже неплохо.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        condition: { flag: 'schlossberg_shot_fired' },
        text: 'Выстрел слышал. Надеюсь, ты стрелял не по собственным ногам.',
      },
      {
        speaker: 'Вы',
        condition: { flag: 'schlossberg_shot_fired' },
        text: 'Наткнулся на местную фауну. Пришлось отстреливаться.',
      },
      {
        speaker: 'Капрал Шмидт',
        characterId: 'schmidt',
        text: 'Бывает. Оружие — в кобуру. Добро пожаловать обратно в цивилизацию.',
      },
    ],
    choices: [
      {
        id: 'to_map',
        text: 'Вернуться в город.',
        nextScene: 'exit_to_map',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  schlossberg_have_crystal_return: {
    id: 'schlossberg_have_crystal_return',
    background: FOREST_BG,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Контейнер с кристаллом уже у тебя. Возвращаться на склон прямо сейчас — бессмысленно и опасно.',
      },
      {
        speaker: 'ЛОГИКА',
        text: 'Дитер ждёт в мастерской. Каждый лишний час — шанс, что кто-то ещё узнает о находке.',
      },
    ],
    choices: [
      {
        id: 'back_to_city',
        text: 'Вернуться в город.',
        nextScene: 'exit_to_map',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },
}
