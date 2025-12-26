/**
 * =====================================================
 * СЦЕНА: ОСМОТР ПОЛЯ БОЯ → ЗАСАДА СКОРПИОНОВ → БОЙ
 * =====================================================
 */
import type { Scene } from '../../model/types'

const BATTLEFIELD_BG = '/images/Мультиплеер/Сцена4Следыбитвы.png'

export const scorpionBattleScenes: Record<string, Scene> = {
  scorpion_battle_inspection: {
    id: 'scorpion_battle_inspection',
    background: BATTLEFIELD_BG,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Дым ещё держится низко над землёй. Между воронок валяются тела в рунических доспехах и обугленные останки техно-химер.',
      },
      {
        speaker: 'ЕВА',
        text: 'Сканер ловит остаточный некро‑фон. Он липнет к металлу и ткани, как пепел.',
      },
      {
        speaker: 'ПРАЙС',
        text: 'Быстрый осмотр. Без лишних разговоров. И держите сектор.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Где-то рядом — сухой скрежет хитина о камень. Слишком близко. Слишком живой звук для мёртвой поляны.',
      },
      {
        speaker: 'ДИТРИХ',
        text: 'Контакт.',
      },
      {
        speaker: 'Рассказчик',
        text: 'Из-под туши химеры выныривает маленький скорпион. Ещё один — из трещины у воронки. А затем, неторопливо, будто хозяин места, появляется средний — с хвостом, поднятым как игла.',
      },
      {
        speaker: 'ПРАЙС',
        text: 'Оружие к бою. Не дать им зайти в упор!',
      },
    ],
    choices: [
      {
        id: 'start_scorpion_nest_battle',
        text: '⚔️ Вступить в бой',
        presentation: { color: 'negative', icon: '⚔️' },
        effects: {
          immediate: [
            {
              type: 'start_tutorial_battle',
              data: {
                enemyKey: 'scorpion_nest',
                returnScene: 'scorpion_battle_victory',
                defeatScene: 'scorpion_battle_defeat',
              },
            },
          ],
        },
      },
    ],
  },

  scorpion_battle_victory: {
    id: 'scorpion_battle_victory',
    background: BATTLEFIELD_BG,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Последний скорпион дёргается и замирает. На мгновение поле боя снова становится тихим — но теперь это тишина после выстрелов.',
      },
      {
        speaker: 'ПРАЙС',
        text: 'Перезарядиться. Проверить раненных. И дальше — по плану.',
      },
    ],
    choices: [
      {
        id: 'after_scorpion_victory_open_map',
        text: 'Продолжить',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },

  scorpion_battle_defeat: {
    id: 'scorpion_battle_defeat',
    background: BATTLEFIELD_BG,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Боль вспыхивает белым шумом. Лес и дым расплываются. Чужой хитин скользит по краю зрения — слишком близко.',
      },
      {
        speaker: 'ПРАЙС',
        text: 'Отходим! К маяку! Сейчас же!',
      },
    ],
    choices: [
      {
        id: 'after_scorpion_defeat_open_map',
        text: 'Отступить',
        effects: { immediate: [{ type: 'open_map' }] },
      },
    ],
  },
}

