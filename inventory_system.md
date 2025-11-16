# Полная система инвентаря и экипировки для Grenzwanderer

> **Статус внедрения**
> - ✅ Stage 0–3 реализованы (Zustand store, общий UI, drag&drop, тултипы, клавиатура, анимации).
> - ✅ Stage 4 (часть): статы игрока, mastery-карты и защита квестовых предметов (данные берутся из `useActiveQuests` → `useQuestItemProtection`).
> - ⏳ Впереди: боевые хоки, Convex sync/outbox, распределённый контроль над квестовыми предметами.

## 📋 Содержание
1. [Архитектура и структура FSD](#архитектура)
2. [Типы данных и интерфейсы](#типы-данных)
3. [Zustand Store с Outbox паттерном](#zustand-store)
4. [Convex схема и мутации](#convex-схема)
5. [React компоненты и UI/UX логика](#react-компоненты)
6. [Drag & Drop система](#dragdrop)
7. [Мобильная адаптация](#мобильная-адаптация)
8. [Система ограничений (вес, слоты)](#система-ограничений)
9. [Быстрые слоты и хоткеи](#быстрые-слоты)
10. [Пошаговая реализация](#пошаговая-реализация)

---

## Архитектура

### Структура директорий (FSD)

```
src/
├── entities/
│   └── item/
│       ├── model/
│       │   ├── types.ts              # Item, ItemSlot, ItemKind типы
│       │   ├── item.schema.ts        # Валидация Zod/Valibot
│       │   └── constants.ts          # Рарность, вес, размеры
│       ├── lib/
│       │   ├── itemUtils.ts          # Утилиты: getItemWeight, canEquip, etc
│       │   └── slotValidation.ts     # Логика проверки слотов
│       └── index.ts                  # Public API entity
├── features/
│   ├── inventory/
│   │   ├── ui/
│   │   │   ├── InventoryPage.tsx     # Главный экран (сетка + экипировка)
│   │   │   ├── InventoryGrid.tsx     # Сетка предметов
│   │   │   ├── ItemCard.tsx          # Карточка предмета (иконка + качество)
│   │   │   ├── EquipmentSlots.tsx    # Слоты экипировки (голова, руки, и т.д.)
│   │   │   ├── DetailedTooltip.tsx   # Подробная информация о предмете
│   │   │   ├── EncumbranceBar.tsx    # Полоса нагрузки (вес/объём)
│   │   │   ├── QuickAccessBar.tsx    # Панель быстрого доступа (5-10 слотов)
│   │   │   ├── ItemSearch.tsx        # Поиск и фильтры
│   │   │   └── DragDropOverlay.tsx   # Визуальный feedback при перетаскивании
│   │   ├── model/
│   │   │   └── hooks/
│   │   │       ├── useInventory.ts        # Hook управления инвентарем
│   │   │       ├── useEquipment.ts        # Hook управления экипировкой
│   │   │       ├── useEncumbrance.ts      # Hook система нагрузки
│   │   │       ├── useDragDrop.ts         # Hook drag&drop логика
│   │   │       └── useSyncInventory.ts    # Hook оффлайн-синхронизация
│   │   └── index.ts                  # Public API feature
│   └── combatCards/
│       └── ... (интеграция карточек боя)
├── shared/
│   ├── types/
│   │   └── item.ts                   # Экспортируемые типы
│   ├── stores/
│   │   ├── inventoryStore.ts         # Zustand store (состояние инвентаря)
│   │   ├── inventoryOutbox.ts        # Zustand + persist для oффлайн
│   │   └── equipmentStore.ts         # Zustand store (состояние экипировки)
│   ├── lib/
│   │   ├── dragDrop.ts               # Drag&Drop утилиты
│   │   ├── gridCalculations.ts       # Сетка: коллизии, размещение
│   │   ├── weightCalculations.ts     # Расчёты веса и нагрузки
│   │   └── itemRarityColors.ts       # Цвета рарности
│   └── hooks/
│       └── useMediaQuery.ts          # Адаптивность
```

---

## Типы данных

### src/shared/types/item.ts

```typescript
// ============ БАЗОВЫЕ ТИПЫ ============

export type ItemKind = 
  | 'weapon'      // Оружие (пистолеты, винтовки)
  | 'armor'       // Броня (жилеты, шлемы)
  | 'artifact'    // Артефакты (магические предметы)
  | 'consumable'  // Расходники (зелья, гранаты)
  | 'clothing'    // Одежда (куртки, штаны)
  | 'backpack'    // Рюкзаки (расширяют вместимость)
  | 'rig'         // Тактические жилеты с карманами
  | 'quest'       // Квестовые предметы
  | 'misc';       // Разное (ресурсы,材料)

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type EquipmentSlotId =
  | 'primary'     // Основное оружие (слот 1)
  | 'secondary'   // Вторичное оружие (слот 2)
  | 'melee'       // Ближний бой (нож, молоток)
  | 'helmet'      // Шлем
  | 'armor'       // Броня (жилет)
  | 'clothing_top'    // Верхняя одежда (куртка)
  | 'clothing_bottom' // Нижняя одежда (штаны)
  | 'backpack'    // Рюкзак
  | 'rig'         // Тактический жилет
  | 'artifact'    // Слот артефакта (может быть несколько: artifact_1, artifact_2)
  | 'quick_1' | 'quick_2' | 'quick_3' | 'quick_4' | 'quick_5'; // Быстрые слоты

export interface ItemStats {
  damage?: number;        // Урон (для оружия)
  defense?: number;       // Защита (для брони)
  weight: number;         // Вес в кг
  width: number;          // Ширина в сетке (Tetris-стиль)
  height: number;         // Высота в сетке
  maxDurability?: number; // Макс прочность
  capacity?: number;      // Вместимость (для контейнеров)
  specialEffects?: SpecialEffect[];
}

export interface SpecialEffect {
  name: string;           // Название эффекта
  type: 'buff' | 'debuff' | 'passive';
  value: number;          // Значение эффекта
  description: string;
}

export interface Item {
  id: string;             // Уникальный ID предмета
  kind: ItemKind;
  name: string;
  description: string;
  icon: string;           // Путь к иконке или base64
  rarity: Rarity;
  stats: ItemStats;
  quantity: number;       // Для предметов, которые можно складывать
  condition?: number;     // Прочность (0-100)
  lore?: string;          // Лор-описание
  tags?: string[];        // Теги для фильтрации
}

export interface ItemState extends Item {
  gridPosition?: {       // Позиция в сетке инвентаря
    x: number;
    y: number;
    rotation?: 0 | 90;  // 0 или 90 градусов
  };
  containerId?: string;  // ID контейнера, в котором находится
  isEquipped?: boolean;
}

// ============ СОСТОЯНИЕ ИНВЕНТАРЯ ============

export interface InventoryContainer {
  id: string;
  ownerId: string;        // ID персонажа-хозяина
  kind: 'backpack' | 'rig' | 'pocket' | 'stash';
  width: number;          // Ширина сетки
  height: number;         // Высота сетки
  items: ItemState[];
}

export interface EncumbranceState {
  currentWeight: number;
  maxWeight: number;
  level: 'light' | 'normal' | 'strained' | 'overloaded' | 'immobile';
  speedPenalty: number;   // Штраф к скорости (0-1)
  staminaPenalty: number; // Штраф к выносливости (0-1)
  noisePenalty: number;   // Штраф к скрытности (0-1)
  healthPenalty?: number; // Штраф к здоровью при перегрузе
}

// ============ ЭКИПИРОВКА ============

export interface EquipmentSlots {
  [key: string]: ItemState | null;
  primary: ItemState | null;
  secondary: ItemState | null;
  melee: ItemState | null;
  helmet: ItemState | null;
  armor: ItemState | null;
  clothing_top: ItemState | null;
  clothing_bottom: ItemState | null;
  backpack: ItemState | null;
  rig: ItemState | null;
  artifacts: ItemState[];  // Массив артефактов
  quick: ItemState[];      // Быстрые слоты (до 10)
}

// ============ МАСТЕРСТВО (MASTERY) ============

export interface MasteryCard {
  id: string;
  name: string;
  description: string;
  type: 'combat_technique' | 'spell' | 'skill';
  requiredMasteryLevel: number;
  damage?: number;
  cooldown?: number;
}

export interface ItemMastery {
  itemId: string;
  level: number;           // 0-5 или выше
  xp: number;
  nextLevelXp: number;
  unlockedCards: MasteryCard[];
}

// ============ OUTBOX СОБЫТИЯ ============

export type InventoryEventType = 
  | 'item_added'
  | 'item_removed'
  | 'item_moved'
  | 'item_equipped'
  | 'item_unequipped'
  | 'item_used'
  | 'item_stacked'
  | 'container_opened';

export interface InventoryOutboxEvent {
  seq: number;
  type: InventoryEventType;
  timestamp: number;
  payload: any;
}

// ============ СОСТОЯНИЕ ХРАНИЛИЩА ============

export interface InventoryStoreState {
  // Основное состояние
  items: Record<string, ItemState>;
  containers: Record<string, InventoryContainer>;
  equipment: EquipmentSlots;
  encumbrance: EncumbranceState;
  masteries: Record<string, ItemMastery>;
  
  // UI состояние
  selectedItemId: string | null;
  searchQuery: string;
  activeFilter: ItemKind | 'all';
  draggedItemId: string | null;
  
  // Методы
  addItem(item: Item, quantity?: number): void;
  removeItem(itemId: string, quantity?: number): void;
  moveItem(itemId: string, toContainerId: string, position: { x: number; y: number }): void;
  equipItem(itemId: string, slotId: EquipmentSlotId): void;
  unequipItem(slotId: EquipmentSlotId): void;
  useItem(itemId: string): void;
  dropItem(itemId: string): void;
  sortInventory(sortBy: 'name' | 'weight' | 'rarity' | 'recent'): void;
}

// ============ OUTBOX ХРАНИЛИЩЕ ============

export interface InventoryOutboxState {
  outbox: InventoryOutboxEvent[];
  deviceSeq: number;
  lastSyncedSeq: number;
  isSyncing: boolean;
  
  enqueue(event: Omit<InventoryOutboxEvent, 'seq' | 'timestamp'>): void;
  syncNow(deviceId: string): Promise<void>;
  markSynced(seq: number): void;
  clear(): void;
}
```

---

## Zustand Store

### src/shared/stores/inventoryStore.ts

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { InventoryStoreState, ItemState, EquipmentSlotId, ItemKind } from '@/shared/types/item';

export const useInventoryStore = create<InventoryStoreState>()(
  devtools((set, get) => ({
    // ============ ИНИЦИАЛЬНОЕ СОСТОЯНИЕ ============
    items: {},
    containers: {},
    equipment: {
      primary: null,
      secondary: null,
      melee: null,
      helmet: null,
      armor: null,
      clothing_top: null,
      clothing_bottom: null,
      backpack: null,
      rig: null,
      artifacts: [],
      quick: [],
    },
    encumbrance: {
      currentWeight: 0,
      maxWeight: 100,
      level: 'normal',
      speedPenalty: 0,
      staminaPenalty: 0,
      noisePenalty: 0,
    },
    masteries: {},
    
    selectedItemId: null,
    searchQuery: '',
    activeFilter: 'all',
    draggedItemId: null,

    // ============ МЕТОДЫ ============
    
    addItem: (item, quantity = 1) => set((state) => {
      const newItemState: ItemState = {
        ...item,
        quantity: item.quantity + (quantity - 1),
        isEquipped: false,
      };
      
      return {
        items: {
          ...state.items,
          [item.id]: newItemState,
        },
      };
    }),

    removeItem: (itemId, quantity = 1) => set((state) => {
      const item = state.items[itemId];
      if (!item) return state;

      if (item.quantity <= quantity) {
        const { [itemId]: _, ...rest } = state.items;
        return { items: rest };
      }

      return {
        items: {
          ...state.items,
          [itemId]: {
            ...item,
            quantity: item.quantity - quantity,
          },
        },
      };
    }),

    moveItem: (itemId, toContainerId, position) => set((state) => {
      const item = state.items[itemId];
      if (!item) return state;

      return {
        items: {
          ...state.items,
          [itemId]: {
            ...item,
            containerId: toContainerId,
            gridPosition: {
              x: position.x,
              y: position.y,
              rotation: 0,
            },
          },
        },
      };
    }),

    equipItem: (itemId, slotId) => set((state) => {
      const item = state.items[itemId];
      if (!item) return state;

      // Если слот уже занят, положить старый предмет обратно
      const oldItem = state.equipment[slotId as keyof typeof state.equipment];

      return {
        items: {
          ...state.items,
          [itemId]: { ...item, isEquipped: true },
        },
        equipment: {
          ...state.equipment,
          [slotId]: item,
        },
      };
    }),

    unequipItem: (slotId) => set((state) => {
      const item = state.equipment[slotId as keyof typeof state.equipment];
      if (!item) return state;

      return {
        items: {
          ...state.items,
          [item.id]: { ...item, isEquipped: false },
        },
        equipment: {
          ...state.equipment,
          [slotId]: null,
        },
      };
    }),

    useItem: (itemId) => set((state) => {
      const item = state.items[itemId];
      if (!item || item.kind !== 'consumable') return state;

      // Применить эффект и уменьшить количество
      get().removeItem(itemId, 1);
      // TODO: Применить эффект предмета (зелье, граната, и т.д.)
      
      return state;
    }),

    dropItem: (itemId) => set((state) => {
      const item = state.items[itemId];
      if (!item) return state;

      const { [itemId]: _, ...rest } = state.items;
      return { items: rest };
    }),

    sortInventory: (sortBy) => set((state) => {
      const sorted = Object.values(state.items).sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'weight':
            return a.stats.weight - b.stats.weight;
          case 'rarity':
            const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
            return rarityOrder[b.rarity] - rarityOrder[a.rarity];
          case 'recent':
            return 0; // TODO: добавить timestamp при добавлении
          default:
            return 0;
        }
      });

      return {
        items: Object.fromEntries(sorted.map(item => [item.id, item])),
      };
    }),
  }), { name: 'inventory-store' })
);
```

### src/shared/stores/inventoryOutbox.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { client } from '@/convex/client';
import type { InventoryOutboxState, InventoryOutboxEvent } from '@/shared/types/item';

export const useInventoryOutbox = create<InventoryOutboxState>()(
  persist(
    (set, get) => ({
      outbox: [],
      deviceSeq: 0,
      lastSyncedSeq: 0,
      isSyncing: false,

      enqueue: (event) => set((state) => {
        const newEvent: InventoryOutboxEvent = {
          ...event,
          seq: state.deviceSeq + 1,
          timestamp: Date.now(),
        };

        return {
          outbox: [...state.outbox, newEvent],
          deviceSeq: state.deviceSeq + 1,
        };
      }),

      syncNow: async (deviceId) => {
        set({ isSyncing: true });
        try {
          const state = get();
          const events = state.outbox.filter(e => e.seq > state.lastSyncedSeq);

          if (events.length === 0) {
            set({ isSyncing: false });
            return;
          }

          const response = await client.mutation('inventory:sync', {
            deviceId,
            lastKnownSeq: state.lastSyncedSeq,
            events,
          });

          set({
            lastSyncedSeq: response.lastSyncedSeq,
            outbox: state.outbox.filter(e => e.seq > response.lastSyncedSeq),
          });
        } catch (error) {
          console.error('Failed to sync inventory:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      markSynced: (seq) => set((state) => ({
        lastSyncedSeq: Math.max(state.lastSyncedSeq, seq),
        outbox: state.outbox.filter(e => e.seq > seq),
      })),

      clear: () => set({ outbox: [], deviceSeq: 0, lastSyncedSeq: 0 }),
    }),
    {
      name: 'inventory-outbox',
      partialize: (state) => ({
        outbox: state.outbox,
        deviceSeq: state.deviceSeq,
        lastSyncedSeq: state.lastSyncedSeq,
      }),
    }
  )
);
```

---

## Convex схема

### convex/schema.ts (добавить)

```typescript
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ... существующие таблицы (players, quests, и т.д.)

  // Таблица предметов в игре (каталог)
  items: defineTable({
    kind: v.string(), // 'weapon', 'armor', и т.д.
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    rarity: v.string(),
    stats: v.object({
      damage: v.optional(v.number()),
      defense: v.optional(v.number()),
      weight: v.number(),
      width: v.number(),
      height: v.number(),
      maxDurability: v.optional(v.number()),
      capacity: v.optional(v.number()),
    }),
    lore: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  }).index('by_kind', ['kind']),

  // Таблица инвентаря игрока
  inventory: defineTable({
    playerId: v.id('players'),
    items: v.array(
      v.object({
        id: v.string(),
        itemId: v.id('items'),
        quantity: v.number(),
        gridPosition: v.optional(
          v.object({
            x: v.number(),
            y: v.number(),
            rotation: v.optional(v.number()),
          })
        ),
        containerId: v.optional(v.string()),
        isEquipped: v.boolean(),
        condition: v.optional(v.number()),
      })
    ),
    containers: v.array(
      v.object({
        id: v.string(),
        kind: v.string(),
        width: v.number(),
        height: v.number(),
      })
    ),
    equipment: v.object({
      primary: v.optional(v.string()),
      secondary: v.optional(v.string()),
      // ... остальные слоты
    }),
    weight: v.number(),
    maxWeight: v.number(),
    lastUpdated: v.number(),
  }).index('by_playerId', ['playerId']),

  // Таблица мастерства предметов
  itemMasteries: defineTable({
    playerId: v.id('players'),
    itemId: v.id('items'),
    level: v.number(),
    xp: v.number(),
    unlockedCards: v.array(v.string()),
  }).index('by_playerId_itemId', ['playerId', 'itemId']),

  // Таблица для синхронизации (outbox)
  inventorySyncQueue: defineTable({
    deviceId: v.string(),
    events: v.array(
      v.object({
        seq: v.number(),
        type: v.string(),
        timestamp: v.number(),
        payload: v.any(),
      })
    ),
    lastProcessedSeq: v.number(),
    createdAt: v.number(),
  }).index('by_deviceId', ['deviceId']),
});
```

### convex/inventory.ts (мутации и запросы)

```typescript
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Запрос инвентаря игрока
export const getPlayerInventory = query({
  args: { playerId: v.id('players') },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query('inventory')
      .withIndex('by_playerId', q => q.eq('playerId', args.playerId))
      .first();

    return inventory;
  },
});

// Мутация для синхронизации инвентаря
export const syncInventory = mutation({
  args: {
    deviceId: v.string(),
    playerId: v.id('players'),
    lastKnownSeq: v.number(),
    events: v.array(
      v.object({
        seq: v.number(),
        type: v.string(),
        timestamp: v.number(),
        payload: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inventory = await ctx.db
      .query('inventory')
      .withIndex('by_playerId', q => q.eq('playerId', args.playerId))
      .first();

    if (!inventory) {
      // Создать новый инвентарь, если не существует
      inventory = {
        playerId: args.playerId,
        items: [],
        containers: [],
        equipment: {},
        weight: 0,
        maxWeight: 100,
        lastUpdated: Date.now(),
      };
      // inventory._id = await ctx.db.insert('inventory', inventory);
    }

    // Обработать события из очереди
    for (const event of args.events) {
      if (event.seq <= args.lastKnownSeq) continue;

      switch (event.type) {
        case 'item_added':
          inventory.items.push(event.payload);
          break;
        case 'item_removed':
          inventory.items = inventory.items.filter(
            item => item.id !== event.payload.itemId
          );
          break;
        case 'item_moved':
          const item = inventory.items.find(i => i.id === event.payload.itemId);
          if (item) {
            item.gridPosition = event.payload.position;
            item.containerId = event.payload.containerId;
          }
          break;
        case 'item_equipped':
          const equippedItem = inventory.items.find(i => i.id === event.payload.itemId);
          if (equippedItem) {
            equippedItem.isEquipped = true;
            inventory.equipment[event.payload.slotId] = event.payload.itemId;
          }
          break;
        // ... остальные типы событий
      }
    }

    inventory.lastUpdated = Date.now();
    
    // Обновить в БД
    await ctx.db.patch(inventory._id, {
      items: inventory.items,
      equipment: inventory.equipment,
      weight: calculateWeight(inventory.items),
      lastUpdated: inventory.lastUpdated,
    });

    return {
      lastSyncedSeq: args.lastKnownSeq + args.events.length,
      inventory,
    };
  },
});

function calculateWeight(items: any[]): number {
  return items.reduce((total, item) => total + item.weight * item.quantity, 0);
}
```

---

## React компоненты

### src/features/inventory/ui/InventoryPage.tsx

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '@/shared/stores/inventoryStore';
import { useInventoryOutbox } from '@/shared/stores/inventoryOutbox';
import { useSyncInventory } from '@/features/inventory/model/hooks/useSyncInventory';
import InventoryGrid from './InventoryGrid';
import EquipmentSlots from './EquipmentSlots';
import EncumbranceBar from './EncumbranceBar';
import QuickAccessBar from './QuickAccessBar';
import ItemSearch from './ItemSearch';
import DetailedTooltip from './DetailedTooltip';
import clsx from 'clsx';

interface InventoryPageProps {
  playerId: string;
}

export default function InventoryPage({ playerId }: InventoryPageProps) {
  const {
    items,
    equipment,
    encumbrance,
    selectedItemId,
    activeFilter,
    searchQuery,
  } = useInventoryStore();

  const { isSyncing } = useInventoryOutbox();
  const { loading } = useSyncInventory(playerId);

  const [showEquipment, setShowEquipment] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    if (selectedItemId && items[selectedItemId]) {
      setSelectedItem(items[selectedItemId]);
    }
  }, [selectedItemId, items]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Инвентарь</h1>
        <p className="text-slate-400">Управляй добычей и снаряжением</p>
      </div>

      {/* Синхронизация статус */}
      {isSyncing && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500 rounded text-blue-300 text-sm">
          🔄 Синхронизация...
        </div>
      )}

      {/* Основной контейнер */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Левая колонка: поиск и сетка */}
        <div className="lg:col-span-3">
          <ItemSearch />

          {/* Полоса нагрузки */}
          <EncumbranceBar
            currentWeight={encumbrance.currentWeight}
            maxWeight={encumbrance.maxWeight}
            level={encumbrance.level}
          />

          {/* Вкладки: Инвентарь / Экипировка */}
          <div className="mt-4 flex gap-2 mb-4">
            <button
              onClick={() => setShowEquipment(false)}
              className={clsx(
                'px-4 py-2 rounded font-semibold transition',
                !showEquipment
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
            >
              Инвентарь
            </button>
            <button
              onClick={() => setShowEquipment(true)}
              className={clsx(
                'px-4 py-2 rounded font-semibold transition',
                showEquipment
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
            >
              Экипировка
            </button>
          </div>

          {/* Содержимое */}
          {!showEquipment ? (
            <InventoryGrid items={items} />
          ) : (
            <EquipmentSlots equipment={equipment} />
          )}
        </div>

        {/* Правая колонка: информация о предмете */}
        <div className="lg:col-span-1">
          {selectedItem ? (
            <DetailedTooltip item={selectedItem} />
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 h-full flex items-center justify-center text-slate-400">
              <p className="text-center">Выбери предмет для просмотра подробностей</p>
            </div>
          )}
        </div>
      </div>

      {/* Быстрый доступ внизу */}
      <div className="mt-8 fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-700 p-4">
        <QuickAccessBar quickSlots={equipment.quick} />
      </div>
    </div>
  );
}
```

### src/features/inventory/ui/InventoryGrid.tsx

```typescript
'use client';

import React, { useCallback } from 'react';
import { useInventoryStore } from '@/shared/stores/inventoryStore';
import ItemCard from './ItemCard';
import DragDropOverlay from './DragDropOverlay';
import clsx from 'clsx';

interface InventoryGridProps {
  items: Record<string, any>;
}

const GRID_COLS = 10;
const GRID_ROWS = 6;
const CELL_SIZE = 60; // px

export default function InventoryGrid({ items }: InventoryGridProps) {
  const { draggedItemId, moveItem } = useInventoryStore();
  const [draggedItem, setDraggedItem] = React.useState<any | null>(null);
  const [dropPosition, setDropPosition] = React.useState<{ x: number; y: number } | null>(null);

  const handleDragStart = useCallback((itemId: string) => {
    setDraggedItem(items[itemId]);
  }, [items]);

  const handleDragOver = useCallback((e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    setDropPosition({ x, y });
  }, []);

  const handleDrop = useCallback((x: number, y: number) => {
    if (draggedItem) {
      moveItem(draggedItem.id, 'main', { x, y });
      setDraggedItem(null);
      setDropPosition(null);
    }
  }, [draggedItem, moveItem]);

  // Создать сетку слотов
  const gridSlots = Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, idx) => {
    const x = idx % GRID_COLS;
    const y = Math.floor(idx / GRID_COLS);
    return { x, y, id: `slot-${x}-${y}` };
  });

  // Отфильтровать предметы по контейнеру 'main'
  const mainInventoryItems = Object.values(items).filter(
    item => !item.containerId || item.containerId === 'main'
  );

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div
        className="grid gap-1 bg-slate-900 rounded p-2 relative"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(${CELL_SIZE}px, 1fr))`,
        }}
      >
        {gridSlots.map((slot) => (
          <div
            key={slot.id}
            className={clsx(
              'aspect-square rounded border-2 cursor-grab active:cursor-grabbing transition',
              dropPosition?.x === slot.x && dropPosition?.y === slot.y
                ? 'border-amber-400 bg-amber-400/20'
                : 'border-slate-600 hover:border-slate-500 bg-slate-700/50 hover:bg-slate-700'
            )}
            onDragOver={(e) => handleDragOver(e, slot.x, slot.y)}
            onDrop={() => handleDrop(slot.x, slot.y)}
          />
        ))}

        {/* Предметы */}
        {mainInventoryItems.map((item) => (
          <div
            key={item.id}
            onDragStart={() => handleDragStart(item.id)}
            onDragEnd={() => setDraggedItem(null)}
          >
            <ItemCard item={item} isDragging={draggedItem?.id === item.id} />
          </div>
        ))}

        {/* Overlay при перетаскивании */}
        {draggedItem && <DragDropOverlay item={draggedItem} position={dropPosition} />}
      </div>
    </div>
  );
}
```

### src/features/inventory/ui/ItemCard.tsx

```typescript
'use client';

import React from 'react';
import { useInventoryStore } from '@/shared/stores/inventoryStore';
import Image from 'next/image';
import clsx from 'clsx';

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-400',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-orange-500',
};

const RARITY_BG: Record<string, string> = {
  common: 'bg-gray-500/20',
  uncommon: 'bg-green-500/20',
  rare: 'bg-blue-500/20',
  epic: 'bg-purple-500/20',
  legendary: 'bg-orange-500/20',
};

interface ItemCardProps {
  item: any;
  isDragging?: boolean;
}

export default function ItemCard({ item, isDragging }: ItemCardProps) {
  const selectItem = useInventoryStore((state) => {
    return (itemId: string) => {
      // Обновить UI для выбранного предмета
    };
  });

  return (
    <div
      className={clsx(
        'relative aspect-square rounded border-4 cursor-grab active:cursor-grabbing',
        'overflow-hidden transition transform hover:scale-105',
        RARITY_COLORS[item.rarity] || RARITY_COLORS.common,
        RARITY_BG[item.rarity] || RARITY_BG.common,
        isDragging && 'opacity-50 scale-110'
      )}
      draggable
      onClick={() => selectItem(item.id)}
    >
      {/* Иконка предмета */}
      <div className="w-full h-full relative">
        <Image
          src={item.icon}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Количество (для предметов со стаком) */}
      {item.quantity > 1 && (
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
          {item.quantity}
        </div>
      )}

      {/* Прочность */}
      {item.condition !== undefined && (
        <div className="absolute top-1 left-1 w-full h-1 bg-black/50 rounded">
          <div
            className={clsx(
              'h-full rounded transition',
              item.condition > 75 ? 'bg-green-500' :
              item.condition > 50 ? 'bg-yellow-500' :
              item.condition > 25 ? 'bg-orange-500' :
              'bg-red-500'
            )}
            style={{ width: `${item.condition}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

### src/features/inventory/ui/DetailedTooltip.tsx

```typescript
'use client';

import React from 'react';
import Image from 'next/image';
import clsx from 'clsx';

const RARITY_TEXT: Record<string, string> = {
  common: 'Обычное',
  uncommon: 'Необычное',
  rare: 'Редкое',
  epic: 'Эпическое',
  legendary: 'Легендарное',
};

interface DetailedTooltipProps {
  item: any;
}

export default function DetailedTooltip({ item }: DetailedTooltipProps) {
  return (
    <div className="bg-slate-800 border-2 border-amber-600 rounded-lg overflow-hidden">
      {/* Заголовок с иконкой */}
      <div className="flex items-center gap-3 p-4 bg-slate-700/50 border-b border-slate-600">
        <div className="w-16 h-16 relative rounded border-2 border-amber-600 overflow-hidden bg-slate-900">
          <Image src={item.icon} alt={item.name} fill className="object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{item.name}</h3>
          <p className={clsx(
            'text-sm font-semibold',
            item.rarity === 'common' && 'text-gray-400',
            item.rarity === 'uncommon' && 'text-green-400',
            item.rarity === 'rare' && 'text-blue-400',
            item.rarity === 'epic' && 'text-purple-400',
            item.rarity === 'legendary' && 'text-orange-400',
          )}>
            {RARITY_TEXT[item.rarity]}
          </p>
        </div>
      </div>

      {/* Описание */}
      <div className="p-4 border-b border-slate-600">
        <p className="text-slate-300 text-sm">{item.description}</p>
      </div>

      {/* Статистика */}
      <div className="p-4 border-b border-slate-600">
        <div className="space-y-2 text-sm">
          {item.stats.damage && (
            <div className="flex justify-between">
              <span className="text-slate-400">Урон:</span>
              <span className="text-red-400 font-bold">{item.stats.damage}</span>
            </div>
          )}
          {item.stats.defense && (
            <div className="flex justify-between">
              <span className="text-slate-400">Защита:</span>
              <span className="text-blue-400 font-bold">{item.stats.defense}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Вес:</span>
            <span className="text-amber-400">{item.stats.weight} кг</span>
          </div>
          {item.condition !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-400">Прочность:</span>
              <span className={clsx(
                'font-bold',
                item.condition > 75 ? 'text-green-400' :
                item.condition > 50 ? 'text-yellow-400' :
                item.condition > 25 ? 'text-orange-400' :
                'text-red-400'
              )}>{item.condition}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Лор */}
      {item.lore && (
        <div className="p-4 border-b border-slate-600 bg-slate-900/30 italic text-slate-400 text-xs">
          &quot;{item.lore}&quot;
        </div>
      )}

      {/* Действия */}
      <div className="p-4 space-y-2">
        <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition">
          Надеть
        </button>
        <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition">
          Выбросить
        </button>
      </div>
    </div>
  );
}
```

### src/features/inventory/ui/EquipmentSlots.tsx

```typescript
'use client';

import React from 'react';
import Image from 'next/image';
import clsx from 'clsx';

interface EquipmentSlotsProps {
  equipment: any;
}

const SLOT_LABELS: Record<string, string> = {
  helmet: '🪖 Шлем',
  armor: '🛡️ Броня',
  clothing_top: '👕 Верхняя одежда',
  clothing_bottom: '👖 Нижняя одежда',
  primary: '🔫 Основное оружие',
  secondary: '🔪 Вторичное оружие',
  melee: '⚔️ Ближний бой',
  backpack: '🎒 Рюкзак',
  rig: '🧵 Тактический жилет',
};

export default function EquipmentSlots({ equipment }: EquipmentSlotsProps) {
  const slots = Object.entries(SLOT_LABELS).map(([key]) => ({
    id: key,
    label: SLOT_LABELS[key as keyof typeof SLOT_LABELS],
    item: equipment[key as keyof typeof equipment],
  }));

  return (
    <div className="grid grid-cols-2 gap-4">
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="bg-slate-800 border border-slate-700 rounded-lg p-4 min-h-40 flex flex-col"
        >
          <p className="text-slate-400 text-sm mb-3">{slot.label}</p>

          {slot.item ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-32 h-32 relative rounded border-2 border-amber-600 overflow-hidden">
                <Image src={slot.item.icon} alt={slot.item.name} fill className="object-cover" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">{slot.item.name}</p>
                <button className="mt-2 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded">
                  Снять
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <p className="text-center">Пусто</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### src/features/inventory/ui/EncumbranceBar.tsx

```typescript
'use client';

import React from 'react';
import clsx from 'clsx';

interface EncumbranceBarProps {
  currentWeight: number;
  maxWeight: number;
  level: 'light' | 'normal' | 'strained' | 'overloaded' | 'immobile';
}

const LEVEL_INFO: Record<string, { label: string; color: string; description: string }> = {
  light: {
    label: 'Легко',
    color: 'bg-green-500',
    description: 'Без штрафов',
  },
  normal: {
    label: 'Нормально',
    color: 'bg-blue-500',
    description: 'Оптимальный вес',
  },
  strained: {
    label: 'Обремененный',
    color: 'bg-yellow-500',
    description: '-10% скорость, -5% выносливость',
  },
  overloaded: {
    label: 'Перегруженный',
    color: 'bg-orange-500',
    description: '-20% скорость, -15% выносливость, -10% здоровье',
  },
  immobile: {
    label: 'Неподвижный',
    color: 'bg-red-500',
    description: 'Не можешь двигаться',
  },
};

export default function EncumbranceBar({
  currentWeight,
  maxWeight,
  level,
}: EncumbranceBarProps) {
  const percentage = (currentWeight / maxWeight) * 100;
  const info = LEVEL_INFO[level];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-300 font-semibold">Нагрузка</span>
        <span className={clsx('text-sm font-bold', info.color)}>
          {info.label}: {currentWeight}/{maxWeight} кг
        </span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={clsx('h-full transition-all duration-300', info.color)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <p className="text-slate-400 text-sm mt-2">{info.description}</p>
    </div>
  );
}
```

### src/features/inventory/ui/QuickAccessBar.tsx

```typescript
'use client';

import React from 'react';
import Image from 'next/image';
import clsx from 'clsx';

interface QuickAccessBarProps {
  quickSlots: any[];
}

export default function QuickAccessBar({ quickSlots }: QuickAccessBarProps) {
  const slots = Array.from({ length: 10 }).map((_, idx) => quickSlots[idx] || null);

  return (
    <div className="flex items-center gap-2 max-w-4xl mx-auto">
      <span className="text-slate-400 text-sm font-semibold">Быстрый доступ:</span>
      <div className="flex gap-2">
        {slots.map((item, idx) => (
          <div
            key={idx}
            className={clsx(
              'w-12 h-12 rounded border-2 relative cursor-pointer hover:border-amber-400 transition',
              'flex items-center justify-center font-bold text-white text-sm',
              item
                ? 'border-amber-600 bg-amber-600/20'
                : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
            )}
            title={item ? item.name : `Слот ${idx + 1}`}
          >
            {item ? (
              <Image src={item.icon} alt={item.name} width={40} height={40} className="rounded" />
            ) : (
              <span className="text-slate-500">{idx + 1}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### src/features/inventory/ui/ItemSearch.tsx

```typescript
'use client';

import React from 'react';
import { useInventoryStore } from '@/shared/stores/inventoryStore';
import clsx from 'clsx';

const ITEM_KINDS = [
  { value: 'all', label: '📦 Все' },
  { value: 'weapon', label: '🔫 Оружие' },
  { value: 'armor', label: '🛡️ Броня' },
  { value: 'artifact', label: '✨ Артефакты' },
  { value: 'consumable', label: '🧪 Расходники' },
  { value: 'misc', label: '📝 Разное' },
];

export default function ItemSearch() {
  const { searchQuery, activeFilter } = useInventoryStore();

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
      {/* Поиск */}
      <input
        type="text"
        placeholder="Поиск по названию..."
        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-amber-600 transition mb-4"
      />

      {/* Фильтры по типам */}
      <div className="flex flex-wrap gap-2">
        {ITEM_KINDS.map((kind) => (
          <button
            key={kind.value}
            className={clsx(
              'px-3 py-1 rounded text-sm font-semibold transition',
              activeFilter === kind.value
                ? 'bg-amber-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            )}
          >
            {kind.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### src/features/inventory/ui/DragDropOverlay.tsx

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface DragDropOverlayProps {
  item: any;
  position: { x: number; y: number } | null;
}

export default function DragDropOverlay({ item, position }: DragDropOverlayProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!position) return null;

  return (
    <div
      className="fixed w-16 h-16 pointer-events-none z-50 opacity-75"
      style={{
        left: `${mousePos.x - 32}px`,
        top: `${mousePos.y - 32}px`,
      }}
    >
      <Image
        src={item.icon}
        alt={item.name}
        width={64}
        height={64}
        className="rounded border-2 border-amber-400"
      />
    </div>
  );
}
```

---

## Hooks для логики

### src/features/inventory/model/hooks/useInventory.ts

```typescript
'use client';

import { useInventoryStore } from '@/shared/stores/inventoryStore';
import { useInventoryOutbox } from '@/shared/stores/inventoryOutbox';
import { useCallback } from 'react';

export function useInventory() {
  const store = useInventoryStore();
  const outbox = useInventoryOutbox();

  const addItem = useCallback((item: any, quantity = 1) => {
    store.addItem(item, quantity);
    outbox.enqueue({
      type: 'item_added',
      payload: { itemId: item.id, quantity },
    });
  }, [store, outbox]);

  const removeItem = useCallback((itemId: string, quantity = 1) => {
    store.removeItem(itemId, quantity);
    outbox.enqueue({
      type: 'item_removed',
      payload: { itemId, quantity },
    });
  }, [store, outbox]);

  const equipItem = useCallback((itemId: string, slotId: string) => {
    store.equipItem(itemId, slotId as any);
    outbox.enqueue({
      type: 'item_equipped',
      payload: { itemId, slotId },
    });
  }, [store, outbox]);

  const unequipItem = useCallback((slotId: string) => {
    const item = store.equipment[slotId as keyof typeof store.equipment];
    if (item) {
      store.unequipItem(slotId as any);
      outbox.enqueue({
        type: 'item_unequipped',
        payload: { slotId, itemId: item.id },
      });
    }
  }, [store, outbox]);

  return {
    items: store.items,
    equipment: store.equipment,
    encumbrance: store.encumbrance,
    addItem,
    removeItem,
    equipItem,
    unequipItem,
  };
}
```

### src/features/inventory/model/hooks/useSyncInventory.ts

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useInventoryOutbox } from '@/shared/stores/inventoryOutbox';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useSyncInventory(playerId: string) {
  const [loading, setLoading] = useState(true);
  const outbox = useInventoryOutbox();
  const deviceId = typeof window !== 'undefined' 
    ? localStorage.getItem('deviceId') || generateDeviceId() 
    : '';

  // Синхронизировать при монтировании и когда вернулась сетевая связь
  useEffect(() => {
    const handleOnline = () => {
      outbox.syncNow(deviceId);
    };

    window.addEventListener('online', handleOnline);
    // Начальная синхронизация
    outbox.syncNow(deviceId).finally(() => setLoading(false));

    return () => window.removeEventListener('online', handleOnline);
  }, [playerId, deviceId, outbox]);

  return { loading };
}

function generateDeviceId(): string {
  const deviceId = `device-${Math.random().toString(36).substr(2, 9)}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}
```

---

## Система ограничений

### src/shared/lib/weightCalculations.ts

```typescript
import { ItemState, EncumbranceState } from '@/shared/types/item';

export const ENCUMBRANCE_LEVELS = {
  light: { maxPercent: 0.5, speedPenalty: 0, staminaPenalty: 0, noisePenalty: 0 },
  normal: { maxPercent: 0.8, speedPenalty: 0, staminaPenalty: 0, noisePenalty: 0 },
  strained: { maxPercent: 1.0, speedPenalty: 0.1, staminaPenalty: 0.05, noisePenalty: 0.1 },
  overloaded: { maxPercent: 1.2, speedPenalty: 0.2, staminaPenalty: 0.15, noisePenalty: 0.2, healthPenalty: 0.1 },
  immobile: { maxPercent: 999, speedPenalty: 1, staminaPenalty: 1, noisePenalty: 0.5, healthPenalty: 0.2 },
};

export function calculateTotalWeight(items: ItemState[]): number {
  return items.reduce((total, item) => total + (item.stats.weight * item.quantity), 0);
}

export function getEncumbranceLevel(
  currentWeight: number,
  maxWeight: number
): 'light' | 'normal' | 'strained' | 'overloaded' | 'immobile' {
  const ratio = currentWeight / maxWeight;

  if (ratio <= 0.5) return 'light';
  if (ratio <= 0.8) return 'normal';
  if (ratio <= 1.0) return 'strained';
  if (ratio <= 1.2) return 'overloaded';
  return 'immobile';
}

export function applyEncumbrancePenalties(level: string): Partial<EncumbranceState> {
  const config = ENCUMBRANCE_LEVELS[level as keyof typeof ENCUMBRANCE_LEVELS];
  if (!config) return {};

  return {
    speedPenalty: config.speedPenalty,
    staminaPenalty: config.staminaPenalty,
    noisePenalty: config.noisePenalty,
  };
}
```

---

## Пошаговая реализация

### Шаг 1: Типы и базовая архитектура
```bash
# Создать файлы типов
touch src/shared/types/item.ts
touch src/entities/item/model/types.ts
touch src/entities/item/lib/itemUtils.ts

# Создать директории
mkdir -p src/entities/item/{model,lib}
mkdir -p src/features/inventory/{ui,model/hooks}
mkdir -p src/shared/{stores,lib}
```

### Шаг 2: Zustand Store + Outbox
```bash
# Созданы в этой инструкции
# src/shared/stores/inventoryStore.ts
# src/shared/stores/inventoryOutbox.ts
```

### Шаг 3: Convex мутации и запросы
```bash
# Созданы в этой инструкции
# convex/inventory.ts (новая таблица и методы)
```

### Шаг 4: React компоненты
```bash
# Все компоненты созданы в src/features/inventory/ui/
# Подключить InventoryPage в маршруты приложения
```

### Шаг 5: Тестирование
- Добавить несколько предметов в тестовый инвентарь
- Проверить drag & drop в браузере
- Протестировать оффлайн-синхронизацию
- Убедиться, что мобильные жесты работают

---

## Дополнительные рекомендации

### UI/UX согласно Disco Elysium, Tarkov, Baldur's Gate

1. **Disco Elysium**: Текстовый акцент, мягкие цвета, атмосферный интерфейс
   - Используйте шрифты с засечками для лора
   - Добавьте цветные акценты (красный для низкого здоровья, синий для магии)
   - Показывайте короткие цитаты/описания при выборе предмета

2. **Escape from Tarkov**: Функциональность, сетка Tetris, реалистичные иконки
   - Поддержать вращение предметов (R) при перетаскивании
   - Показывать тактику и реальную вместимость
   - Добавить визуальное отображение состояния (грязь, следы использования)

3. **Baldur's Gate**: Классическая RPG-навигация, табы категорий, быстрый поиск
   - Поддержать горячие клавиши (F для фильтра, Ctrl+F для поиска)
   - Группировать предметы по типам с иконками
   - Показывать сравнение характеристик при выборе нового оружия

### Производительность

- Используйте виртуализацию для больших инвентарей (react-window)
- Кешируйте вычисления веса и рарности
- Ленивая загрузка иконок предметов
- Dебаунс при поиске (300 мс)

### Мобильная адаптация

- Сделайте слоты не менее 60px (для пальца)
- Добавьте haptic feedback (vibration API)
- Используйте long-press для контекстного меню
- Сделайте быстрый доступ горизонтальным скроллом внизу

---

## Интеграция с другими системами

- **Combat System**: Карточки боя разблокируются при мастерстве оружия
- **Player Stats**: Броня влияет на защиту, оружие на урон
- **Quest System**: Квестовые предметы отмечены специальной иконкой
- **Map System**: Предметы находятся на лут-локациях
