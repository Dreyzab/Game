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
      },
      {
        id: 'sq_signal_cache_force',
        text: 'Взять силой: вскрыть и забрать всё ценное',
        nextNodeId: 'sq_signal_cache_outcome_force',
      },
      {
        id: 'sq_signal_cache_leave',
        text: 'Не рисковать — уходим',
        nextNodeId: 'sq_signal_cache_outcome_leave',
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
}
