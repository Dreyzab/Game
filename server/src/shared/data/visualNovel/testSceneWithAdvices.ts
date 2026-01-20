/**
 * Тестовая сцена с советами от внутренних голосов
 * Демонстрирует функционал системы консультаций
 */

import type { VisualNovelSceneDefinition } from '../../types/visualNovel'
import { BACKGROUNDS } from './backgrounds'

export const TEST_SCENE_WITH_ADVICES: VisualNovelSceneDefinition = {
  id: 'test_consultation_scene',
  title: 'Консультация с Отрядом',
  isTerminal: true,
  location: 'Рыночная площадь, Фрайбург',
  description: 'Вы заметили торговца, который предлагает вам сомнительную сделку',
  background: BACKGROUNDS.freiburg_market,
  ambientColor: 'rgba(10, 15, 40, 0.75)',
  entryLineId: 'test_consultation_scene__line0',
  characters: [
    {
      id: 'shady_trader',
      name: 'Подозрительный торговец',
      color: '#f97316',
      alignment: 'center',
    },
  ],
  lines: [
    {
      id: 'test_consultation_scene__line0',
      speakerId: 'shady_trader',
      text: 'Эй, приятель! У меня для тебя особое предложение. Артефакт из Зоны, настоящий, проверенный. Всего за 500 марок.',
      mood: 'neutral',
      stageDirection: 'Торговец достаёт из-под прилавка странный светящийся предмет',
      nextLineId: 'test_consultation_scene__line1',
    },
    {
      id: 'test_consultation_scene__line1',
      text: 'Предмет действительно излучает слабое свечение. Торговец выглядит нервным, постоянно оглядывается.',
      mood: 'tense',
      nextLineId: 'test_consultation_scene__choice',
    },
    {
      id: 'test_consultation_scene__choice',
      text: 'Что делать?',
      mood: 'neutral',
      choices: [
        {
          id: 'buy_artifact',
          label: 'Купить артефакт (500 марок)',
          description: 'Рискнуть и приобрести предмет',
          tone: 'curious',
          effects: [
            { type: 'add_item', itemId: 'mysterious_artifact', quantity: 1 },
            { type: 'flag', flag: 'bought_from_shady_trader', value: true },
          ],
          nextLineId: 'test_consultation_scene__bought',
        },
        {
          id: 'negotiate',
          label: '[АВТОРИТЕТ] Торговаться',
          description: 'Попытаться снизить цену',
          tone: 'firm',
          requirements: {
            skillCheck: {
              skill: 'authority',
              difficulty: 40,
              label: 'Требуется Авторитет 40+',
            },
          },
          effects: [
            { type: 'xp', amount: 10 },
          ],
          nextLineId: 'test_consultation_scene__negotiated',
        },
        {
          id: 'refuse',
          label: 'Отказаться',
          description: 'Это выглядит подозрительно',
          tone: 'calm',
          nextLineId: 'test_consultation_scene__refused',
        },
      ],
      // СОВЕТЫ ОТ ВНУТРЕННИХ ГОЛОСОВ
      characterAdvices: [
        {
          characterId: 'logic',
          text: 'Цена завышена в 2-3 раза. Артефакты из Зоны редко стоят больше 200 марок. Либо это подделка, либо очень опасная вещь. Его нервозность — красный флаг.',
          mood: 'serious',
          stageDirection: 'Холодный анализ',
          minSkillLevel: 30,
        },
        {
          characterId: 'perception',
          text: 'Запах. Озон и что-то ещё... металлическое? Свечение слишком равномерное для природной аномалии. Под прилавком — ещё три таких же предмета. Это не уникальная находка.',
          mood: 'tense',
          stageDirection: 'Острота чувств',
          minSkillLevel: 35,
        },
        {
          characterId: 'empathy',
          text: 'Он боится. Не тебя — чего-то другого. Возможно, ему нужно быстро избавиться от этих вещей. Может быть, он в долгах. Или артефакты краденые.',
          mood: 'warm',
          stageDirection: 'Понимание эмоций',
          minSkillLevel: 40,
        },
        {
          characterId: 'knowledge',
          text: 'Что-то не так. Внутренний голос кричит "ловушка". Но какая? Может, предмет отслеживается. Или это приманка для чего-то большего.',
          mood: 'grim',
          stageDirection: 'Предчувствие опасности',
          minSkillLevel: 25,
        },
        {
          characterId: 'authority',
          text: 'Он слабак. Надави — цена упадёт до 200 или вообще отдаст бесплатно. Но помни: запугивание оставляет следы. Кто-то может узнать.',
          mood: 'serious',
          stageDirection: 'Доминирование',
          minSkillLevel: 35,
        },
        {
          characterId: 'drama',
          text: 'Все торговцы — мошенники. Все артефакты на рынке — подделки. Единственная ценность здесь — урок: никому не доверяй. Уходи.',
          mood: 'grim',
          stageDirection: 'Скептицизм',
          minSkillLevel: 20,
        },
      ],
    },
    {
      id: 'test_consultation_scene__bought',
      speakerId: 'shady_trader',
      text: 'Отличный выбор, друг! Не пожалеешь... надеюсь.',
      mood: 'neutral',
      stageDirection: 'Торговец быстро хватает деньги и исчезает в толпе',
    },
    {
      id: 'test_consultation_scene__negotiated',
      speakerId: 'shady_trader',
      text: 'Х-хорошо, ладно! 300 марок, последняя цена!',
      mood: 'tense',
      stageDirection: 'Торговец нервно сглатывает',
    },
    {
      id: 'test_consultation_scene__refused',
      text: 'Вы качаете головой и отходите. Торговец уже ищет глазами следующую жертву.',
      mood: 'neutral',
    },
  ],
}
