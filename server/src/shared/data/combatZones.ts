/**
 * =====================================================
 * ГЕО-НАРРАТИВНЫЕ ЗОНЫ ФРАЙБУРГА
 * Genius Loci - Дух Места
 * =====================================================
 */

import type { ZoneModifier, DamageType, CardType } from '../types/combat'

// ================== ЗОНАЛЬНЫЕ МОДИФИКАТОРЫ ==================

export const COMBAT_ZONES: Record<string, ZoneModifier> = {
  // ============ МЮНСТЕР - СВЯТИЛИЩЕ ============
  sanctuary_munster: {
    id: 'sanctuary_munster',
    zoneType: 'sanctuary',
    name: 'Freiburger Münster Sanctuary',
    nameRu: 'Святилище Мюнстера',
    
    voiceBuffs: {
      empathy: 2,    // +2 к ЭМПАТИИ
      honor: 2,      // +2 к ЧЕСТИ
      courage: 1     // +1 к ОТВАГЕ
    },
    voiceDebuffs: {
      analysis: -2,  // -2 к АНАЛИЗУ (помехи веры)
      gambling: -1   // -1 к АЗАРТУ
    },
    
    cardCostModifiers: {
      voice: -1      // Карты Ритуала стоят на 1 AP меньше
    },
    
    damageModifiers: {
      fire: -20      // Огненный урон -20% (святое место)
    },
    
    specialEffects: [
      {
        type: 'heal',
        value: 20,
        description: 'Исцеление на 20% эффективнее',
        targetSelf: true
      },
      {
        type: 'morale_boost',
        value: 5,
        description: '+5 к морали в начале боя'
      }
    ],
    
    historicalContext: `Фрайбургский Мюнстер — готический собор, строительство которого началось в 1200 году. 
    Знаменит своими витражами гильдий (пекарей, пивоваров, виноделов) и единственной полностью 
    сохранившейся средневековой колокольней в Германии. Согласно легенде, собор защищён от зла 
    благодаря тому, что его строительство было оплачено честными горожанами.`,
    
    geniusLociDescription: `"Здесь камни помнят молитвы веков. Каждый витраж — история семьи, 
    каждая плита — чья-то вера. Воздух тяжёл от благовоний и надежды. В этом месте 
    логика отступает перед верой, а расчёт — перед состраданием."`
  },

  // ============ ВАУБАН - ЗОНА ХАОСА ============
  chaos_zone_vauban: {
    id: 'chaos_zone_vauban',
    zoneType: 'chaos_zone',
    name: 'Vauban Chaos Zone',
    nameRu: 'Зона Хаоса Ваубан',
    
    voiceBuffs: {
      creativity: 2, // +2 к ТВОРЧЕСТВУ
      gambling: 2,   // Активен голос АЗАРТ
      courage: 1     // +1 к ОТВАГЕ (анархический дух)
    },
    voiceDebuffs: {
      authority: -1, // -1 к АВТОРИТЕТУ (здесь не признают власть)
      honor: -1      // -1 к ЧЕСТИ (правила не действуют)
    },
    
    cardCostModifiers: {},
    
    damageModifiers: {
      electric: 15   // Энергетическое оружие +15% (солнечные панели)
    },
    
    specialEffects: [
      {
        type: 'critical_boost',
        value: 10,
        chance: 100,
        description: '+10% к критическому шансу'
      },
      {
        type: 'stamina_restore',
        value: 5,
        description: '+5 к регенерации выносливости (зелёная энергия)'
      }
    ],
    
    historicalContext: `Ваубан — бывшая военная база, преобразованная в эко-район. 
    Здесь расположен самый большой в Европе район с пассивными домами. 
    Солнечные панели покрывают крыши, машины запрещены. 
    После Разлома здесь обосновались анархисты и техно-энтузиасты.`,
    
    geniusLociDescription: `"Солнечные панели гудят на крышах, собирая последний свет. 
    Здесь пахнет озоном и свободой. Правила? Какие правила? 
    Единственный закон — выживание изобретательных."`
  },

  // ============ ИНДУСТРИАЛЬНЫЙ СЕВЕР - КУЗНИЦА ============
  forge_industrial: {
    id: 'forge_industrial',
    zoneType: 'forge',
    name: 'Industrial North Forge',
    nameRu: 'Кузница Индустриального Севера',
    
    voiceBuffs: {
      analysis: 2,   // +2 к АНАЛИЗУ
      logic: 1,      // +1 к ЛОГИКЕ
      force: 1       // +1 к СИЛЕ (промышленная мощь)
    },
    voiceDebuffs: {
      empathy: -1,   // -1 к ЭМПАТИИ (холодная сталь)
      drama: -1      // -1 к ДРАМЕ (здесь не до театра)
    },
    
    cardCostModifiers: {},
    
    damageModifiers: {
      electric: -15  // Электрический урон -15% (магнитные помехи)
    },
    
    specialEffects: [
      {
        type: 'debuff',
        value: 15,
        chance: 15,
        description: '15% шанс сбоя электроники врага'
      },
      {
        type: 'damage',
        value: -10,
        description: 'Укрытия разрушаются на 10% быстрее'
      }
    ],
    
    historicalContext: `Крупнейшая промышленная зона Фрайбурга, потребляющая 20% энергии города. 
    До Разлома здесь производили точное оборудование и медицинские приборы. 
    Теперь это территория дронов-отступников и техно-мутантов.`,
    
    geniusLociDescription: `"Магнитные поля искажают реальность. Старые станки скрежещут, 
    будто помнят руки рабочих. Здесь царит логика машины: холодная, точная, безжалостная. 
    Электроника сбоит, но сталь — вечна."`
  },

  // ============ БЁХЛЕ - АРТЕРИИ ГОРОДА ============
  canals_bachle: {
    id: 'canals_bachle',
    zoneType: 'canals',
    name: 'Bächle City Arteries',
    nameRu: 'Артерии Города Бёхле',
    
    voiceBuffs: {
      coordination: 2, // +2 к КООРДИНАЦИИ (требуется баланс)
      perception: 1    // +1 к ВОСПРИЯТИЮ (отражения в воде)
    },
    voiceDebuffs: {
      force: -1,       // -1 к СИЛЕ (скользко)
      endurance: -1    // -1 к ВЫНОСЛИВОСТИ (мокрая одежда)
    },
    
    cardCostModifiers: {
      movement: 2      // Карты перемещения дороже (скользко!)
    },
    
    damageModifiers: {
      electric: 30     // Электрический урон +30% (вода проводит!)
    },
    
    specialEffects: [
      {
        type: 'debuff',
        value: 10,
        chance: 100,
        description: 'Шанс уклонения снижен на 10% (скользко)'
      },
      {
        type: 'damage',
        value: 0,
        description: 'Электрические атаки по воде наносят AoE урон всем в ранге'
      }
    ],
    
    historicalContext: `Бёхле — знаменитые открытые ручьи Фрайбурга, построенные в Средневековье 
    для тушения пожаров и водопоя скота. Согласно легенде, кто случайно упадёт в Бёхле, 
    тот женится на жителе Фрайбурга. В игре — получает дебафф "Мокрый".`,
    
    geniusLociDescription: `"Вода журчит по древним каналам, отражая разбитое небо. 
    Шаг — и ты в воде. Ещё шаг — и молния найдёт путь через твоё тело. 
    Здесь нужна грация танцора и осторожность сапёра."`
  },

  // ============ НЕЙТРАЛЬНАЯ ЗОНА ============
  neutral_zone: {
    id: 'neutral_zone',
    zoneType: 'neutral',
    name: 'Neutral Territory',
    nameRu: 'Нейтральная Территория',
    
    voiceBuffs: {},
    voiceDebuffs: {},
    cardCostModifiers: {},
    damageModifiers: {},
    specialEffects: [],
    
    historicalContext: 'Обычные улицы города без особых модификаторов.',
    geniusLociDescription: '"Просто город. Разрушенный, опасный, но без мистики."'
  },

  // ============ ДОПОЛНИТЕЛЬНЫЕ ЗОНЫ ============
  
  // Университетский квартал
  university_quarter: {
    id: 'university_quarter',
    zoneType: 'sanctuary', // Используем как вариант святилища знаний
    name: 'University Quarter',
    nameRu: 'Университетский Квартал',
    
    voiceBuffs: {
      logic: 3,      // +3 к ЛОГИКЕ
      analysis: 2,   // +2 к АНАЛИЗУ  
      rhetoric: 2    // +2 к РИТОРИКЕ
    },
    voiceDebuffs: {
      force: -2,     // -2 к СИЛЕ (интеллектуальная среда)
      gambling: -2   // -2 к АЗАРТУ
    },
    
    cardCostModifiers: {
      voice: -1      // Голосовые карты дешевле
    },
    
    damageModifiers: {},
    
    specialEffects: [
      {
        type: 'buff',
        value: 15,
        description: '+15% к эффективности тактических карт'
      }
    ],
    
    historicalContext: `Альберт-Людвиг-Университет — один из старейших в Германии (1457). 
    Здесь учились Хайдеггер и Гуссерль. Библиотеки хранят знания веков.`,
    
    geniusLociDescription: `"Пыль веков на корешках книг. Здесь мысль — оружие, 
    а аргумент — щит. Грубая сила бессильна против логики."`
  },

  // Винные погреба
  wine_cellars: {
    id: 'wine_cellars',
    zoneType: 'neutral',
    name: 'Wine Cellars',
    nameRu: 'Винные Погреба',
    
    voiceBuffs: {
      drama: 2,      // +2 к ДРАМЕ
      suggestion: 2, // +2 к ВНУШЕНИЮ
      empathy: 1     // +1 к ЭМПАТИИ
    },
    voiceDebuffs: {
      coordination: -2, // -2 к КООРДИНАЦИИ (темно и пьяно)
      logic: -1         // -1 к ЛОГИКЕ
    },
    
    cardCostModifiers: {},
    
    damageModifiers: {
      fire: 50       // Огненный урон +50% (алкоголь!)
    },
    
    specialEffects: [
      {
        type: 'morale_boost',
        value: 10,
        description: '+10 к морали (винные пары)'
      },
      {
        type: 'debuff',
        value: 5,
        chance: 100,
        description: '-5% к точности (темнота)'
      }
    ],
    
    historicalContext: `Фрайбург — винодельческий регион. Под городом — километры погребов, 
    где хранятся бочки с вином. После Разлома здесь скрываются те, кто ищет забвения.`,
    
    geniusLociDescription: `"Запах старого дерева и забродившего винограда. 
    В темноте легко заблудиться, легко забыться. Огонь здесь — смерть."`
  }
}

// ================== УТИЛИТЫ ==================

/**
 * Получить модификаторы зоны по координатам
 */
export function getZoneByCoordinates(
  lat: number, 
  lng: number, 
  zones: Array<{ id: string; polygon: Array<{ lat: number; lng: number }> }>
): ZoneModifier | null {
  // Простая проверка point-in-polygon (для MVP)
  for (const zone of zones) {
    if (isPointInPolygon({ lat, lng }, zone.polygon)) {
      const modifier = COMBAT_ZONES[zone.id]
      if (modifier) return modifier
    }
  }
  return COMBAT_ZONES.neutral_zone
}

/**
 * Проверка точки в полигоне (Ray casting algorithm)
 */
function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false
  const { lat: x, lng: y } = point
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng
    const xj = polygon[j].lat, yj = polygon[j].lng
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  
  return inside
}

/**
 * Применить модификаторы зоны к голосам
 */
export function applyZoneVoiceModifiers(
  baseVoiceLevels: Record<string, number>,
  zone: ZoneModifier
): Record<string, number> {
  const modified = { ...baseVoiceLevels }
  
  // Применить баффы
  for (const [voiceId, buff] of Object.entries(zone.voiceBuffs)) {
    if (modified[voiceId] !== undefined && typeof buff === 'number') {
      modified[voiceId] += buff
    }
  }
  
  // Применить дебаффы
  for (const [voiceId, debuff] of Object.entries(zone.voiceDebuffs)) {
    if (modified[voiceId] !== undefined && typeof debuff === 'number') {
      modified[voiceId] = Math.max(0, modified[voiceId] + debuff)
    }
  }
  
  return modified
}

/**
 * Модифицировать стоимость карты на основе зоны
 */
export function getModifiedCardCost(
  baseCost: number,
  cardType: CardType,
  zone: ZoneModifier
): number {
  const modifier = zone.cardCostModifiers[cardType] ?? 0
  return Math.max(0, baseCost + modifier)
}

/**
 * Модифицировать урон на основе зоны
 */
export function getModifiedDamage(
  baseDamage: number,
  damageType: DamageType,
  zone: ZoneModifier
): number {
  const modifier = zone.damageModifiers[damageType] ?? 0
  const multiplier = 1 + (modifier / 100)
  return Math.floor(baseDamage * multiplier)
}

















