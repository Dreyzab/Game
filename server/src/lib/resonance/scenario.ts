import type { Episode, ResonanceArchetype, SceneNode, VoteOption } from './types';

const baseInjections: Record<string, Partial<Record<ResonanceArchetype, string>>> = {
    briefing: {
        skeptic: '«Сорок минут» — завышено. Реальное окно ~28. Статистика по исключениям растет.',
        empath: 'Голос дрожит. Он боится родительского комитета и потерь.',
        guardian: 'Он ранен, переносит вес на правую ногу. Если что-то пойдет не так — командование наше.',
        visionary: 'Картина висит криво. Мир покосился. Под текстом что-то скрыто.',
    },
    rift_vote: {
        guardian: 'Скорость спасет время. Штурм — меньше хаоса.',
        skeptic: 'Шум привлечет угрозы. Стелс дает шанс на сюрприз.',
        visionary: 'Линзы покажут ловушки. Потратим ресурс, но снизим риск.',
        empath: 'Команда нервничает. Им нужен вариант с меньшим стрессом.',
    },
    statue_spot: {
        skeptic: 'Тень у стеллажей двигается. Это ловушка.',
        visionary: 'Статуя глючит в полискане. Аномалия.',
        guardian: 'Если это засада — лучше стрелять первым.',
        empath: 'Выстрел поднимет тревогу. Есть ли другой путь?',
    },
    data_vote: {
        skeptic: 'Логи показывают «стереть всё». Кто-то хотел скрыть правду.',
        empath: 'Свои стреляли в своих. Мы должны защитить память погибших.',
        guardian: 'Приказ есть приказ. Возвращаем как есть.',
        visionary: 'Копию можно спрятать. Устраним риск, сохраним правду.',
    },
    parley: {
        skeptic: 'Лиандриэль тянется к рычагу. Это ловушка.',
        guardian: 'Оставаться без оружия рискованно, но выстрел сорвет переговоры.',
        empath: 'Она в ярости из-за сестер. Нужен мягкий тон.',
        visionary: 'Структура зала резонирует. Рычаг связан с ловушкой.',
    },
    debrief: {
        skeptic: 'Желает снять с себя ответственность. «Желтый код» — страховка.',
        empath: 'Он сломан потерями. Правда может добить доверие.',
        guardian: 'Шантаж — риск. Но ресурс нам нужен.',
        visionary: 'Правда откроет ветку синтеза. Решать команде.',
    },
};

const vote = (options: VoteOption[]): VoteOption[] => options;

const scenes: SceneNode[] = [
    {
        id: 'briefing',
        kind: 'narrative',
        title: 'Инструктаж в Kaufhaus',
        shared:
            'Командант Хольц ставит задачу: «Желтый код». Разведгруппа «Эхо» пропала, дрон с данными в подвале Библиотеки. Окно — 40 минут. Избегать контактов, статуи не трогать.',
        injections: baseInjections.briefing,
        next: 'entry_vote',
        allowKudos: false,
        checks: [
            {
                skill: 'perception',
                dc: 11,
                positionOptimum: 3,
                onSuccess: { grantFlag: 'noticed_listener' },
                onFail: { strainDelta: 0 },
            },
        ],
    },
    {
        id: 'entry_vote',
        kind: 'vote',
        title: 'Вход в разлом',
        shared: 'Граница разлома. Нужно решить, как входить в зону.',
        injections: baseInjections.rift_vote,
        timerMs: 15000,
        options: vote([
            {
                id: 'storm',
                text: 'Штурм: врыв на скорости (+инициатива, +тревога)',
                nextScene: 'hard_landing',
                weightMultipliers: { guardian: 1.5 },
                rewards: { alertDelta: 2 },
            },
            {
                id: 'stealth',
                text: 'Стелс: попытка тихого захода (тратит время)',
                nextScene: 'hard_landing',
                weightMultipliers: { skeptic: 1.5 },
                rewards: { alertDelta: 0, strainDelta: -1 },
                checks: [
                    { skill: 'stealth', dc: 12, positionOptimum: 3, onSuccess: {}, onFail: { alertDelta: 1, strainDelta: 2 } },
                ],
            },
            {
                id: 'lenses',
                text: 'Активировать Линзы: увидеть ловушки',
                nextScene: 'hard_landing',
                weightMultipliers: { visionary: 1.5, empath: 1.2 },
                rewards: { alertDelta: 1 },
            },
        ]),
        allowBrake: true,
    },
    {
        id: 'hard_landing',
        kind: 'qte',
        title: 'Жесткая посадка',
        shared:
            'Материализация в подвале. Медика швыряет в Ранг 1, получает «Дезориентацию». Танк встает в авангард, Снайпер — в Ранг 4.',
        injections: baseInjections.statue_spot,
        next: 'statue_decision',
        rewards: {
            flagsAdd: ['medic_disoriented'],
            strainDelta: 2,
        },
    },
    {
        id: 'statue_decision',
        kind: 'vote',
        title: 'Статуя шевельнулась',
        shared: 'Одна из статуй поворачивает голову. Снайпер видит кнопку «Выстрелить сейчас».',
        injections: baseInjections.statue_spot,
        options: vote([
            {
                id: 'shoot',
                text: 'Выстрелить первым',
                nextScene: 'golem_combat',
                weightMultipliers: { guardian: 1.2, visionary: 1.1 },
                checks: [
                    { skill: 'authority', dc: 12, positionOptimum: 1, onSuccess: { alertDelta: 1 }, onFail: { alertDelta: 2, strainDelta: 3 } },
                ],
            },
            {
                id: 'hold',
                text: 'Дать шанс на сюрприз-раунд',
                nextScene: 'golem_combat',
                weightMultipliers: { empath: 1.2, skeptic: 1.1 },
                checks: [
                    { skill: 'insight', dc: 11, positionOptimum: 3, onSuccess: { grantFlag: 'surprise_round' }, onFail: { alertDelta: 1 } },
                ],
            },
        ]),
        allowInterrupt: true,
    },
    {
        id: 'golem_combat',
        kind: 'combat',
        title: 'Бой с големом',
        shared:
            'Пол чертится лазером. Голем хватается «Гарпуном» за медика. Танк может сделать «Перегруппировку» и сменить позиции.',
        injections: {
            guardian: 'Сделать рокировку: встать под удар, спасти медика.',
            skeptic: 'Целься в ноги, ядро нестабильно.',
            empath: 'Поддержать медика, снять стресс.',
            visionary: 'Скан: периметр удорожает перемещения.',
        },
        next: 'aftermath',
        checks: [
            { skill: 'authority', dc: 13, positionOptimum: 1, onSuccess: { strainDelta: -2 }, onFail: { strainDelta: 4 } }, // рокировка
            { skill: 'insight', dc: 12, positionOptimum: 3, onSuccess: { alertDelta: -1 } },
            { skill: 'empathy', dc: 11, positionOptimum: 2, onSuccess: { strainDelta: -3 }, onFail: { strainDelta: 2 } },
        ],
    },
    {
        id: 'aftermath',
        kind: 'vote',
        title: 'Судьба данных',
        shared: 'Дрон «Эхо» найден. Логи не совпадают со словами Хольца.',
        injections: baseInjections.data_vote,
        options: vote([
            {
                id: 'encrypt',
                text: 'Скачать и зашифровать — только для нас',
                nextScene: 'parley',
                rewards: { items: [{ id: 'data_copy', qty: 1 }], trustDelta: -3, strainDelta: 4, flagsAdd: ['has_copy'] },
            },
            {
                id: 'sanitize',
                text: 'Удалить поврежденное — скрыть правду',
                nextScene: 'parley',
                rewards: { trustDelta: -1, strainDelta: 1, flagsAdd: ['sanitized'] },
            },
            {
                id: 'deliver',
                text: 'Взять как есть — по инструкции',
                nextScene: 'parley',
                rewards: { trustDelta: 2, strainDelta: 0 },
            },
        ]),
        allowKudos: true,
    },
    {
        id: 'parley',
        kind: 'vote',
        title: 'Переговоры с Броком и Лиандриэль',
        shared:
            'Брок и Лиандриэль блокируют выход. Требуют положить накопитель. Снайпер видит руку на рычаге.',
        injections: baseInjections.parley,
        options: vote([
            {
                id: 'fight',
                text: 'Стрелять',
                nextScene: 'debrief',
                weightMultipliers: { guardian: 1.3 },
                rewards: { alertDelta: 2, strainDelta: 3, trustDelta: -2 },
            },
            {
                id: 'peace',
                text: 'Мир — попытаться договориться',
                nextScene: 'debrief',
                weightMultipliers: { empath: 1.3 },
                checks: [{ skill: 'empathy', dc: 13, positionOptimum: 2, onSuccess: { alertDelta: -1 }, onFail: { strainDelta: 2 } }],
            },
            {
                id: 'wait',
                text: 'Ждать и сканировать',
                nextScene: 'debrief',
                weightMultipliers: { visionary: 1.3, skeptic: 1.1 },
                checks: [{ skill: 'insight', dc: 12, positionOptimum: 3, onSuccess: { grantFlag: 'lever_spotted' }, onFail: { alertDelta: 1 } }],
            },
        ]),
        allowInterrupt: true,
        rewards: { alertDelta: 1 },
    },
    {
        id: 'debrief',
        kind: 'vote',
        title: 'Возврат к Хольцу',
        shared: 'Хольц спрашивает: «Где накопитель?» Решение — правда или шантаж.',
        injections: baseInjections.debrief,
        options: vote([
            {
                id: 'truth',
                text: 'Сказать правду о выстреле в спину',
                nextScene: 'complete',
                rewards: { trustDelta: 3, strainDelta: -2 },
            },
            {
                id: 'blackmail',
                text: 'Шантаж: окно 28 минут, двойная оплата',
                nextScene: 'complete',
                weightMultipliers: { skeptic: 1.2, guardian: 1.1 },
                rewards: { trustDelta: -2, strainDelta: 2, items: [{ id: 'bonus_pay', qty: 1 }] },
                checks: [{ skill: 'rhetoric', dc: 13, positionOptimum: 2, onSuccess: { trustDelta: 1 }, onFail: { strainDelta: 2 } }],
            },
            {
                id: 'report',
                text: 'Следовать протоколу',
                nextScene: 'complete',
                weightMultipliers: { empath: 1.1 },
                rewards: { trustDelta: 1, strainDelta: 0 },
            },
        ]),
        allowKudos: true,
    },
    {
        id: 'complete',
        kind: 'narrative',
        title: 'Экспедиция завершена',
        shared:
            'Сцена квеста завершена. Итоги зависят от strain/trust и выбора: союз с дворфами открыт, правда зафиксирована или скрыта.',
        allowKudos: true,
    },
];

export const RESONANCE_EPISODE: Episode = {
    id: 'divergent_realities',
    entry: 'briefing',
    scenes: scenes.reduce<Record<string, SceneNode>>((acc, s) => {
        acc[s.id] = s;
        return acc;
    }, {}),
};

