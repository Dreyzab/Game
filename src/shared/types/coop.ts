import type { AttributeGroup, VoiceId } from './parliament'

export type CoopRoleId = 'body' | 'mind' | 'social'

export interface CoopRoleDefinition {
  id: CoopRoleId
  label: string
  nameRu: string
  description: string
  primaryGroup: AttributeGroup
  focusVoices: VoiceId[]
  playstyleHint: string
}

export const COOP_ROLES: Record<CoopRoleId, CoopRoleDefinition> = {
  body: {
    id: 'body',
    label: 'BODY',
    nameRu: 'ТЕЛО',
    primaryGroup: 'body',
    focusVoices: ['force', 'resilience', 'endurance'],
    description:
      'Фронтовик отряда. Берёт на себя основной риск, держит удар и реагирует первым, когда что-то идёт не так. Там, где другие обсуждают план, BODY уже двигается вперёд.',
    playstyleHint:
      'Выбирайте варианты, связанные с прямым действием, защитой команды и физическим риском: выстрел по кристаллу, вынос големов, прикрытие отхода.',
  },
  mind: {
    id: 'mind',
    label: 'MIND',
    nameRu: 'РАЗУМ',
    primaryGroup: 'mind',
    focusVoices: ['logic', 'analysis', 'perception'],
    description:
      'Тактик и аналитик. Читает поле боя, замечает детали и предлагает решения, когда у остальных есть только инстинкты. Видит закономерности там, где другие видят хаос.',
    playstyleHint:
      'Выбирайте варианты, которые дают информацию, анализируют угрозу или оптимизируют действия отряда: анализ барьера, выбор целей, оценка намерений дворфов.',
  },
  social: {
    id: 'social',
    label: 'SOCIAL',
    nameRu: 'СВЯЗИ',
    primaryGroup: 'sociality',
    focusVoices: ['empathy', 'solidarity', 'honor'],
    description:
      'Лицо и совесть отряда. Переговаривается, удерживает людей от паники, превращает набор сталкеров в команду. Там, где пули уже мало что решают, SOCIAL всё ещё может что-то сказать.',
    playstyleHint:
      'Выбирайте варианты, где важны слова, доверие и влияние: удержать других от выстрела, говорить с дворфами, ссылаться на кодекс и союз.',
  },
}

