import type { VisualNovelSceneDefinition } from '../../types/visualNovel'

export const COOP_BRIEFING_SCENE: VisualNovelSceneDefinition = {
  id: 'coop_briefing_intro',
  title: 'Инструктаж',
  location: 'Командный пункт',
  description: 'Короткий инструктаж перед выходом.',
  background: '/images/backgrounds/workshop.jpg',
  ambientColor: 'rgba(2, 6, 23, 0.78)',
  entryLineId: 'coop_briefing_intro__line0',
  characters: [
    {
      id: 'instructor',
      name: 'Инструктор',
      color: '#67e8f9',
      alignment: 'center',
    },
    {
      id: 'narrator',
      name: 'Система',
      color: '#94a3b8',
      alignment: 'center',
    },
  ],
  lines: [
    {
      id: 'coop_briefing_intro__line0',
      speakerId: 'instructor',
      text: 'Слушайте внимательно. Сегодня вы работаете командой. Каждый отвечает за свою роль.',
      mood: 'serious',
      nextLineId: 'coop_briefing_intro__line1',
    },
    {
      id: 'coop_briefing_intro__line1',
      speakerId: 'instructor',
      text: 'Держитесь вместе, делитесь информацией и не дублируйте задачи. У вас один шанс сделать всё чисто.',
      mood: 'serious',
      nextLineId: 'coop_briefing_intro__line2',
    },
    {
      id: 'coop_briefing_intro__line2',
      speakerId: 'narrator',
      text: 'Инструктаж завершён.',
      mood: 'neutral',
      nextLineId: 'coop_briefing_intro__choice',
    },
    {
      id: 'coop_briefing_intro__choice',
      speakerId: 'narrator',
      text: 'Готовы выходить?',
      mood: 'neutral',
      choices: [
        {
          id: 'go_map',
          label: 'На карту',
          tone: 'firm',
          effects: [{ type: 'immediate', action: 'open_map' }],
        },
      ],
    },
  ],
}
