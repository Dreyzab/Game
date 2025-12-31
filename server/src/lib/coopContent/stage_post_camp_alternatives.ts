import type { CoopQuestNode } from '../../shared/types/coop'

export const COOP_STAGE_POST_CAMP_ALTERNATIVES_NODES: Record<string, CoopQuestNode> = {
    // =================================================================================================
    // VARIANT B: THE DEPTHS (SECTOR BETA)
    // Theme: Horror, Stealth, Claustrophobia, Ancient Tech
    // Backgrounds: Tunnel, Descent
    // =================================================================================================

    drone_sector_beta_feed: {
        id: 'drone_sector_beta_feed',
        title: 'Сектор Бета: Глубина',
        background: '/images/Мультиплеер/Сцена8.1тонель.png',
        description: `
Комикс-кадр. Дрон ныряет в расщелину, скрытую густым кустарником. Камера переключается на ночное видение.

ИЗОБРАЖЕНИЕ С ДРОНА:
ОБНАРУЖЕНА ПОДЗЕМНАЯ СТРУКТУРА. ГЛУБИНА: >200М. 
ТЕМПЕРАТУРА: -5°C. 
ФОН: НИЗКИЙ, НО СТАБИЛЬНЫЙ ИСТОЧНИК ЭНЕРГИИ.

Голос Йоханна (напряженно): «Это не пещера. Это... шахта. Или вентиляция. Стены идеально гладкие. И там, внизу... что-то гудит».

Внезапно камера фиксирует движение тени на стене — слишком быстрой для камня. Помехи. Связь обрывается, но не от удара, а от экранирования сигнала.
`,
        interactionType: 'sync',
        choices: [{ id: 'beta_react', text: 'Анализ', nextNodeId: 'drone_sector_beta_decision' }],
    },

    drone_sector_beta_decision: {
        id: 'drone_sector_beta_decision',
        title: 'Решение: Погружение',
        background: '/images/Мультиплеер/сцена3.1Лагерь.png',
        description: `
Прайс хмурится:
«Идеальное укрытие. Или идеальная могила. Если там есть бункер — мы можем найти ответы, не влезая в войну наверху. Но если нас зажмут в тоннеле — выхода не будет».

Дитрих: «Я люблю узкие места. Враг может прийти только с двух сторон».
Агата: «Или с потолка. Ненавижу пещеры».

Голосование: Рискнуть и спуститься в "Бету" или вернуться к плану с городом?
`,
        interactionType: 'vote',
        choices: [
            { id: 'vote_beta_go', text: 'Спуститься в Туннели (Стелс/Ужас)', nextNodeId: 'depths_entry' },
            { id: 'vote_return_alpha', text: 'Отмена. Идти к Городу (Бой/Дипломатия)', nextNodeId: 'other_side_drone_feed' }, // Redirects back to main path if they chicken out
        ],
    },

    depths_entry: {
        id: 'depths_entry',
        title: 'Вход в Бездну',
        background: '/images/Мультиплеер/Сцена8.1тонель.png',
        description: `
Вы спускаетесь. Воздух здесь сухой и холодный, пахнет озоном и старой пылью. Стены покрыты странным, не-геометрическим узором.

Гул усиливается. Свет фонарей выхватывает из темноты огромные металлические двери, разорванные изнутри.

**Нуль:** «Кто-то очень хотел выйти...»
`,
        interactionType: 'individual',
        choices: [
            {
                id: 'depths_scan_structure',
                text: '[VORSCHLAG] Анализ структуры стен',
                requiredRole: 'vorschlag',
                effectText: 'Это не бетон. Это выращенный кристалл. Прочнее стали, но проводит звук как вода. "Тише. Стены нас слышат".',
                itemRewards: [{ templateId: 'anomaly_sample', quantity: 1 }],
                nextNodeId: 'depths_shadows',
            },
            {
                id: 'depths_scan_bio',
                text: '[VALKYRIE] Поиск биосигнатур',
                requiredRole: 'valkyrie',
                effectText: 'Пусто. Стерильно. Ни бактерий, ни спор. Как в операционной, которую запечатали век назад.',
                itemRewards: [{ templateId: 'medkit', quantity: 1 }],
                nextNodeId: 'depths_shadows',
            },
            {
                id: 'depths_listen',
                text: '[GHOST] Вслушаться в гул',
                requiredRole: 'ghost',
                effectText: 'В гуле есть ритм. Это не машина. Это дыхание. Огромное, медленное дыхание.',
                nextNodeId: 'depths_shadows',
            },
            {
                id: 'depths_light',
                text: '[SHUSTRAYA] Осветить путь (риск)',
                requiredRole: 'shustrya',
                effectText: 'Ты бросаешь химсвет. Тьма отступает неохотно. В глубине тоннеля что-то блеснуло в ответ.',
                nextNodeId: 'depths_shadows',
            },
        ],
    },

    depths_shadows: {
        id: 'depths_shadows',
        title: 'Тени в стенах',
        background: '/images/Мультиплеер/Сцена8.1тонель.png',
        description: `
Вы углубляетесь. С каждым шагом чувство тревоги растет.
Внезапно, Дитрих останавливается и жестом приказывает «Замереть».

На стенах появляются тени. Но объектов, отбрасывающих их, нет. Тени живут своей жизнью, перетекая по кристаллическим стенам к вам.

**Прайс (шепотом):** «Не смотреть прямо на них. Боковым зрением».
`,
        interactionType: 'sync',
        choices: [{ id: 'depths_confront', text: 'Далее', nextNodeId: 'depths_event_choice' }],
    },

    depths_event_choice: {
        id: 'depths_event_choice',
        title: 'Контакт с Бездной',
        background: '/images/Мультиплеер/Сцена8.1тонель.png',
        description: `
Одна из теней отделяется от стены и принимает форму... человека? Солдата FJR?
Она беззвучно кричит, и вы *чувствуете* этот крик в голове.

Голосование: Как реагировать?
`,
        interactionType: 'vote',
        choices: [
            {
                id: 'depths_attack',
                text: 'Открыть огонь (На опережение)',
                action: 'start_coop_battle',
                battle: { scenarioId: 'shadow_ambush', threatDelta: 1 }, // Hypothetical battle
                nextNodeId: 'depths_aftermath_fight'
            },
            {
                id: 'depths_tech',
                text: '[VORSCHLAG] Включить генератор помех (Рассеять проекцию)',
                requiredRole: 'vorschlag',
                nextNodeId: 'depths_aftermath_tech'
            },
            {
                id: 'depths_psionic',
                text: '[VALKYRIE] Ментальный щит / Успокоительное',
                requiredRole: 'valkyrie',
                nextNodeId: 'depths_aftermath_psi'
            },
        ],
    },

    // ... Placeholder for aftermaths needing actual writing ...
    depths_aftermath_tech: {
        id: 'depths_aftermath_tech',
        title: 'Рассеивание',
        background: '/images/Мультиплеер/Сцена8.1тонель.png',
        description: 'Йоханн врубает эмиттер. Тень искажается, идет рябью и распадается на серую пыль. Гул в туннеле становится злее.',
        interactionType: 'sync',
        choices: [{ id: 'depths_leave', text: 'Уходим, быстро', nextNodeId: 'descent_new_order' }] // Loop back to main path
    },
    depths_aftermath_psi: {
        id: 'depths_aftermath_psi',
        title: 'Контакт',
        background: '/images/Мультиплеер/Сцена8.1тонель.png',
        description: 'Ева транслирует спокойствие. Тень замирает... склоняет голову... и указывает рукой вглубь. Она не враг. Она — предупреждение.',
        interactionType: 'sync',
        choices: [{ id: 'depths_leave', text: 'Уходим', nextNodeId: 'descent_new_order' }]
    },
    depths_aftermath_fight: {
        id: 'depths_aftermath_fight',
        title: 'Бой с тенью',
        background: '/images/Мультиплеер/Сцена8.1тонель.png',
        description: 'Пули проходят насквозь, но вспышки света отгоняют тварь. Вы тратите патроны на призраков. Плохое начало.',
        interactionType: 'sync',
        choices: [{ id: 'depths_leave', text: 'Отступаем', nextNodeId: 'descent_new_order' }]
    },


    // =================================================================================================
    // VARIANT C: THE ARCHIVE (SECTOR GAMMA)
    // Theme: Lore, Puzzles, Mystery, No Combat
    // Backgrounds: Strange Ruins, Anomaly
    // =================================================================================================

    drone_sector_gamma_feed: {
        id: 'drone_sector_gamma_feed',
        title: 'Сектор Гамма: Архив',
        background: '/images/Мультиплеер/Сцена9.1.png',
        description: `
Камера дрона показывает поляну, где гравитация... сломана. Камни висят в воздухе. Деревья растут спиралью.
В центре — монолит. Гладкий, черный, но покрытый светящимися глифами.

ИЗОБРАЖЕНИЕ С ДРОНА:
ОБНАРУЖЕН ИСТОЧНИК ДАННЫХ ВЫСОКОЙ ПЛОТНОСТИ.
ЯЗЫК: НЕИЗВЕСТЕН (СОВПАДЕНИЕ С КАТАЛОГОМ "ПРЕДТЕЧИ" 12%).
УГРОЗА: ОТСУТСТВУЕТ (ФИЗИЧЕСКАЯ). ВЫСОКИЙ ПСИ-ФОН.

Нуль (завороженно): «Это библиотека... Или сервер. Он ждет подключения».
`,
        interactionType: 'sync',
        choices: [{ id: 'gamma_react', text: 'Анализ', nextNodeId: 'drone_sector_gamma_decision' }],
    },

    drone_sector_gamma_decision: {
        id: 'drone_sector_gamma_decision',
        title: 'Решение: Контакт',
        background: '/images/Мультиплеер/Сцена9.1.png',
        description: `
Прайс: «Выглядит слишком чисто. Ни охраны, ни трупов. Как мышеловка. Но если там данные о Разломе... это стоит риска».

Ева: «Пси-фон может сжечь мозги. Нужна защита».
Йоханн: «Я экранирую шлемы. Мы должны рискнуть».

Голосование: Идти к Монолиту (Головоломка/Лор) или вернуться к плану с городом?
`,
        interactionType: 'vote',
        choices: [
            { id: 'vote_gamma_go', text: 'Идти к Монолиту (Лор/Загадка)', nextNodeId: 'archive_approach' },
            { id: 'vote_return_alpha', text: 'Отмена. Идти к Городу (Бой)', nextNodeId: 'other_side_drone_feed' },
        ],
    },

    archive_approach: {
        id: 'archive_approach',
        title: 'Гравитационная тропа',
        background: '/images/Мультиплеер/Сцена9.1.png',
        description: `
Вы входите в зону аномалии. Вес тела меняется с каждым шагом. То 2G, прижимающее к земле, то невесомость.
Нужно синхронизировать движение, чтобы не улететь в небо.
`,
        interactionType: 'contribute', // Using contribute for specific tasks
        choices: [
            {
                id: 'archive_move_heavy',
                text: 'Нуль: Рассчитать окна гравитации',
                action: 'resolve_expedition_event',
                expeditionEvent: { id: 'gravity_calc', actorRole: 'vorschlag' }, // Hypothetical event
                nextNodeId: 'archive_monolith',
            },
        ],
    },

    archive_monolith: {
        id: 'archive_monolith',
        title: 'У Монолита',
        background: '/images/Мультиплеер/Сцена9.2.png',
        description: `
Вы стоите перед черным камнем. Он гудит, резонируя с мыслями.
На поверхности вспыхивают символы. Это... вопрос. Или тест.

Текст на камне (в голове):
"ЧТО ВЫБИРАЕТ ПЛОТЬ, КОГДА СТАЛЬ РЖАВЕЕТ?"

Нужен ответ.
`,
        interactionType: 'vote',
        choices: [
            { id: 'answ_fear', text: '«СТРАХ»', nextNodeId: 'archive_fail' },
            { id: 'answ_adaptation', text: '«АДАПТАЦИЮ (Эволюцию)»', nextNodeId: 'archive_success' },
            { id: 'answ_faith', text: '«ВЕРУ»', nextNodeId: 'archive_neutral' },
        ],
    },

    archive_success: {
        id: 'archive_success',
        title: 'Откровение',
        background: '/images/Мультиплеер/Сцена9.3.png',
        description: `
Камень вспыхивает теплым светом.
Голос в голове: "ПРИНЯТО. ДОСТУП РАЗРЕШЕН".

Вы получаете поток данных: карты, схемы, истории тех, кто был здесь до вас. Вы видите, как остановить Големов... как закрыть Разлом.
Это не просто разведка. Это ключ к победе.
`,
        interactionType: 'sync',
        choices: [{ id: 'archive_leave_good', text: 'Записать и уйти', nextNodeId: 'descent_new_order', itemRewards: [{ templateId: 'old_data_drive', quantity: 2 }] }],
    },

    archive_fail: {
        id: 'archive_fail',
        title: 'Отвержение',
        background: '/images/Мультиплеер/Сцена9.4.png',
        description: `
Камень холодеет.
Голос: "ОШИБКА. СЛАБОСТЬ. УДАЛЕНИЕ".

Пси-удар сбивает вас с ног. Щиты Йоханна лопаются. У всех - сильная головная боль и травма.
Вы бежите, пока гравитация не раздавила вас.
`,
        interactionType: 'sync',
        choices: [{ id: 'archive_leave_bad', text: 'Бежать!', nextNodeId: 'descent_new_order' }],
    },
    archive_neutral: {
        id: 'archive_neutral',
        title: 'Тишина',
        background: '/images/Мультиплеер/Сцена9.1.png',
        description: `
Камень молчит. Символы гаснут.
Голос: "ДАННЫХ НЕДОСТАТОЧНО".
Ничего не произошло. Вы потратили время зря.
`,
        interactionType: 'sync',
        choices: [{ id: 'archive_leave_neutral', text: 'Уходим', nextNodeId: 'descent_new_order' }],
    },

};
