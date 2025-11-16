# Интеграция Modern Inventory UI в Grenzwanderer

Этот файл описывает, как использовать уже реализованный современный инвентарь (ModernInventoryPage) в текущем проекте и как он связан с другими подсистемами.

## 🚀 Быстрая интеграция

### 1. Где живёт новый инвентарь

- `src/features/inventory/ui/InventoryPage.tsx` — экспортирует `ModernInventoryPage`.
- Вспомогательные компоненты:
  - `EnhancedInventoryGrid`, `CharacterPanel`, `QuickStatsPanel`, `InventoryDetailPanel`, `InventoryContainer` — в `src/features/inventory/ui/`.
  - `AnimatedCard`, `MotionContainer`, `DetailedTooltip` — в `src/shared/components/`.

### 2. Подключение к роутеру

Проект использует `react-router-dom` и страницу `src/pages/InventoryPage.tsx`, которая уже подключена в `src/App.tsx` через `RoutePaths.INVENTORY`.

Чтобы использовать современный UI, достаточно сделать переэкспорт:

```ts
// src/pages/InventoryPage.tsx
import React from 'react'
import { ModernInventoryPage } from '@/features/inventory/ui/InventoryPage'

export default function InventoryPage() {
  return <ModernInventoryPage />
}
```

После этого переход по маршруту `/inventory` будет открывать новый интерфейс.

### 3. Зависимости

Все нужные зависимости уже есть в `package.json`:

- `zustand` — стор инвентаря и квестов.
- `framer-motion` — анимации сетки, слотов и drag‑ghost.
- `clsx` — удобное комбинирование классов.
- `convex` — backend (квесты, прогресс, далее — инвентарь).

При необходимости обновить версии достаточно выполнить:

```bash
npm install
```

---

## 🔌 Связь с Zustand‑стором инвентаря

ModernInventoryPage использует существующий `useInventoryStore` (`src/shared/stores/inventoryStore.ts`).

Упрощённый контракт стора:

```ts
type InventoryState = {
  items: Record<string, ItemState>
  equipment: EquipmentSlots
  containers: Record<string, InventoryContainer>
  encumbrance: EncumbranceState
  playerStats: PlayerStatsSummary
  activeMasteryCards: ActiveMastery[]
  masteries: Record<string, ItemMastery>
  questProtectedItemIds: Record<string, true>

  selectedItemId: string | null
  searchQuery: string
  activeFilter: ItemKind | 'all'

  addItem(item: ItemState): void
  equipItem(itemId: string, slotId: EquipmentSlotKey): void
  setQuickSlot(index: number, itemId: string | null): void
  moveItemWithinGrid(itemId: string, pos: { x: number; y: number }): void
  setQuestProtectedItems(ids: string[]): void
  isQuestItem(itemId: string): boolean
  setSearchQuery(q: string): void
  setActiveFilter(filter: ItemKind | 'all'): void
  selectItem(itemId: string | null): void
}
```

ModernInventoryPage забирает только нужные части через селекторы:

```ts
const {
  items,
  equipment,
  encumbrance,
  containers,
  playerStats,
  activeMasteryCards,
  selectedItemId,
  selectItem,
  searchQuery,
  activeFilter,
  setSearchQuery,
  setActiveFilter,
  isQuestItem,
} = useInventoryStore()
```

---

## 🧠 Поведение ModernInventoryPage

Главные элементы экрана:

- **EnhancedInventoryGrid** — сетка 6×10, drag&drop, тултипы, клавиатурная навигация, подсветка quest‑предметов.
- **CharacterPanel** — слоты экипировки + Encumbrance + суммарные статы и активные mastery‑карты.
- **QuickStatsPanel** — быстрые показатели (урон, защита, вес) под строкой поиска.
- **InventoryDetailPanel** — подробная карточка текущего предмета, с Quest‑badge при необходимости.
- **InventoryContainer** — переключатель активного контейнера (main / backpack / rig и т.д.).

Всё это обёрнуто в `Layout` и использует `AnimatedCard`/`MotionContainer` для плавных анимаций.

---

## 🔗 Интеграция с Quest System

Для защиты квестовых предметов используется хук `useQuestItemProtection`:

```ts
// src/features/quests/lib/questItemProtection.ts

export const useQuestItemProtection = () => {
  const { quests } = useActiveQuests()
  const setQuestProtectedItems = useInventoryStore((state) => state.setQuestProtectedItems)
  const isQuestItem = useInventoryStore((state) => state.isQuestItem)

  const questItemIds = useMemo(() => {
    const ids = new Set<string>()
    quests.forEach((quest) => {
      const required = extractIds((quest as any)?.requiredItems)
      required.forEach((id) => ids.add(id))
    })
    return Array.from(ids)
  }, [quests])

  useEffect(() => {
    setQuestProtectedItems(questItemIds)
  }, [questItemIds, setQuestProtectedItems])

  const canDropItem = (itemId: string) => !isQuestItem(itemId)

  return { questItemIds, canDropItem }
}
```

ModernInventoryPage просто вызывает `useQuestItemProtection()` и использует `isQuestItem` для бейджей и блокировки опасных действий.

---

## 🛡️ Интеграция с Combat System

На стороне боевой системы планируется использовать хук `useMasteryCardUnlock` (см. `integration_checklist.md`):

- при экипировке оружия стор инвентаря предоставляет `activeMasteryCards`;
- CombatStore может добавлять соответствующие карточки в руку боя;
- при получении XP за использование оружия вызывается `incrementMasteryXp`.

Пока этот хук описан в документации и частично реализован, но не подключён к реальным боевым событиям — это следующий шаг интеграции.

---

## 🌐 Convex и синхронизация инвентаря

Инвентарь сейчас живёт только на клиенте. Далее планируется:

- добавить Convex‑схему для таблиц `inventory`/`inventory_events`;
- реализовать outbox‑паттерн по аналогии с `questOutbox` (`src/shared/stores/questOutbox.ts`);
- добавить мутации `inventory:sync` и использовать их из стора/ModernInventoryPage.

Эти шаги описаны концептуально в `inventory_system.md` и `integration_checklist.md` и будут реализованы после стабилизации клиентского UI. 

