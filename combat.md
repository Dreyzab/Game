# Modern Inventory Page (Gemini Canvas Package)

> ⚠️ **Примечание о миграции:** Backend мигрирован с Convex на Bun + Elysia.
> API эндпоинты см. в `server/src/api/routes/inventory.ts`. Упоминания Convex в документе устарели.

Готовый набор заметок, который собирает всё, что относится к экрану `http://localhost:5173/inventory`. Используйте файл, чтобы быстро переносить макет и логику в Gemini Canvas или другой песочнице без необходимости постоянно читать исходники.

## Маршрут и точка входа
- `src/pages/InventoryPage.tsx` оборачивает `ModernInventoryPage` в `ErrorBoundary`, чтобы не ронять приложение при сбоях.
- Роут прописан в `src/App.tsx` (`<Route path={RoutePaths.INVENTORY} element={<InventoryPage />} />`), а сам путь `'/inventory'` задан в `src/shared/lib/utils/navigation.ts`.

## Основной компонент `ModernInventoryPage`
Источник: `src/features/inventory/ui/InventoryPage.tsx`.

- Использует `useMyInventory` хук для получения данных через Elysia API и синхронизирует с zustand-хранилищем через `syncWithBackend`.
- Достаёт из `useInventoryStore` все необходимые куски состояния: предметы, экипировку, энкамбранс, статистику игрока, выбранный предмет, строку поиска, фильтр и утилиты `selectItem`, `setSearchQuery`, `isQuestItem`.
- Управляет локальным `comparingItem`, чтобы открыть модальное сравнение.
- Фильтрует массив предметов (`filterItems`) и вычисляет текущий `selectedItem`.
- Оборачивает весь экран в тёмный фон: `min-h-screen bg-slate-950 text-slate-200`.

### Опорный JSX

```82:151:src/features/inventory/ui/InventoryPage.tsx
return (
  <div className="min-h-screen bg-slate-950 text-slate-200">
    <div className="container mx-auto h-[calc(100vh-80px)] max-w-7xl p-4">
      <div className="grid h-full grid-cols-12 gap-6">
        {/* Левая колонка */}
        <div className="col-span-4 flex flex-col gap-4">
          <AnimatedCard className="glass-panel p-4">
            <Heading level={2} className="text-lg">Character</Heading>
            <EquipmentSlots ... />
            <QuickAccessBar slots={equipment.quick} />
          </AnimatedCard>
          <QuickStatsPanel stats={playerStats} encumbrance={encumbrance} />
        </div>

        {/* Правая колонка */}
        <div className="col-span-8 flex flex-col gap-4">
          <AnimatedCard className="glass-panel flex items-center gap-4 p-3">
            <input ... placeholder="Search items..." />
          </AnimatedCard>
          <EnhancedInventoryGrid ... />
          <InventoryDetailPanel ... />
        </div>
      </div>
    </div>

    {comparingItem && (
      <ItemComparison ... />
    )}
  </div>
)
```

## Состояние, данные, побочные эффекты
- `useDeviceId()` → уникальный идентификатор клиента.
- `useQuery(api.inventory.get, deviceId ? { deviceId } : 'skip')` → Convex backend.
- `useEffect` с `syncWithBackend` → заполняет zustand-состояние после ответа API.
- `useQuestItemProtection()` (пока заглушка) зарезервировано под защиту квестовых предметов.
- `useMemo` используется для `itemsArray`, `filteredItems` и `selectedItem`, чтобы не пересоздавать списки.
- `handleCompare` + `getEquippedItemForComparison` подготавливают данные для модального окна.

## Лейаут и визуальный скелет
Tailwind-классы следуют рекомендациям Tailwind v3 (`grid`, `col-span`, `gap`, `h-screen`, см. `/websites/v3_tailwindcss`, разделы `grid-column`, `gap`, `height`, `space`). Ключевые блоки:

### Левая колонка (`col-span-4`)
1. **Character panel** (`AnimatedCard`, `glass-panel p-4`):
   - Заголовок “Character”, бейдж “Level 1”.
   - `EquipmentSlots` рендерит ячейки `Head`, `Body`, `Primary`, `Secondary`, `Legs`, `Backpack`, `Rig`.
   - `QuickAccessBar` сразу под силой силуэта.
2. **QuickStatsPanel** (`glass-panel flex ...`):
   - Показывает Damage / Defense / Weight (`{encumbrance.currentWeight}/{encumbrance.maxWeight} kg`).

### Правая колонка (`col-span-8`)
1. **Search bar** — `input` с градиентной рамкой (`focus:border-amber-500`), базируется на zustand `searchQuery`.
2. **EnhancedInventoryGrid** (обёртка вокруг `InventoryGrid`):
   - Тело сетки (`glass-panel`, `h-[600px]`) с заголовком `Stash {items.length} items`.
   - Хранит drag-n-drop через `useInventoryDragStore`, подсвечивает цель перемещения и вызывает Convex мутации (`inventory.move`, `inventory.equip`).
3. **InventoryDetailPanel** (`h-48`):
   - Переиспользует `ItemDetailsPanel`: иконка, редкость, бейдж Quest Item, набор статов (`DMG`, `DEF`, `WT`, `SIZE`, `COND`), теги и кнопки `Equip` / `Inspect`.

### Модальное окно сравнения
`ItemComparison` показывает:
- Левый блок “Equipped” (только если есть предмет в соответствующем слоте).
- Правый блок “Comparing” с цветовой подсветкой (`text-green-400` / `text-red-400`) при улучшении/ухудшении статов.
- Закрывается кликом по заднему фону или `onClose`.

## Подкомпоненты и файлы
- `EquipmentSlots` (`src/features/inventory/ui/EquipmentSlots/EquipmentSlots.tsx`): силует персонажа, лонг-пресс для сравнения, drag target для `useInventoryDragStore`.
- `QuickAccessBar` (`.../QuickAccessBar.tsx`): 5 слотов, подсветка активного drop target.
- `QuickStatsPanel` (`.../QuickStatsPanel.tsx`): компактные метрики.
- `EnhancedInventoryGrid` + `InventoryGrid` (`.../InventoryGrid/InventoryGrid.tsx`): отвечает за сетку, перетаскивания, тултипы (`ItemTooltip`), Convex мутации `inventory.move`/`inventory.equip`.
- `InventoryDetailPanel` → `ItemDetailsPanel` (`.../ItemDetailsPanel/ItemDetailsPanel.tsx`): карточка выбранного предмета.
- `ItemComparison` (`.../ItemComparison/ItemComparison.tsx`): сравнение выбранного предмета с экипированным.
- Утилиты: `filterItems` (`src/features/inventory/model/utils.ts`), `useQuestItemProtection`, zustand-стор `src/shared/stores/inventoryStore.ts`.

## UI-копия (для быстрой вставки)

```
Character — Level 1
HEAD · BODY · PRIMARY · SECONDARY · LEGS · BACKPACK · RIG
Quick Access — 5 slots (ячейки #1 … #5, статус Empty/название предмета)
Damage — 0
Defense — 0
Weight — 0/45 kg
Stash — 0 items (динамическая цифра)
Search placeholder — “Search items…”
Detail placeholder — “Select an item in the grid to inspect stats…”
Quest badge — “Quest Item”
Сравнение — бейджи “Equipped” / “Comparing”
```

## Минимальный HTML-снимок
Подходит для быстрой отрисовки в Gemini Canvas (упрощён без состояния):

```html
<div class="min-h-screen bg-slate-950 text-slate-200">
  <div class="container mx-auto h-[calc(100vh-80px)] max-w-7xl p-4">
    <div class="grid h-full grid-cols-12 gap-6">
      <section class="col-span-4 flex flex-col gap-4">
        <article class="glass-panel p-4">
          <header class="flex justify-between">
            <h2 class="text-lg font-semibold">Character</h2>
            <span class="text-xs text-slate-400">Level 1</span>
          </header>
          <div class="h-[500px] border border-slate-800 rounded-lg bg-slate-950/50">EquipmentSlots</div>
          <div class="mt-4 glass-panel p-4">
            <div class="text-xs uppercase tracking-[0.3em] text-slate-400 flex justify-between">
              <span>Quick Access</span><span>5 slots</span>
            </div>
            <div class="grid grid-cols-5 gap-2 mt-3 text-[11px] text-slate-500">
              <div class="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-3 text-center">#1 Empty</div>
              <div class="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-3 text-center">#2 Empty</div>
              <div class="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-3 text-center">#3 Empty</div>
              <div class="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-3 text-center">#4 Empty</div>
              <div class="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-3 text-center">#5 Empty</div>
            </div>
          </div>
        </article>
        <div class="glass-panel flex justify-between p-3 text-xs">
          <div><div class="uppercase tracking-[0.3em] text-slate-500">Damage</div><div class="text-sm font-semibold">0</div></div>
          <div><div class="uppercase tracking-[0.3em] text-slate-500">Defense</div><div class="text-sm font-semibold">0</div></div>
          <div><div class="uppercase tracking-[0.3em] text-slate-500">Weight</div><div class="text-sm font-semibold">0/45 kg</div></div>
        </div>
      </section>
      <section class="col-span-8 flex flex-col gap-4">
        <div class="glass-panel flex items-center gap-4 p-3">
          <input class="flex-1 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm" placeholder="Search items..." />
        </div>
        <div class="flex-1 glass-panel p-4">
          <div class="mb-2 flex justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
            <span>Stash</span><span>0 items</span>
          </div>
          <div class="h-full border border-slate-800 bg-slate-950/80">EnhancedInventoryGrid</div>
        </div>
        <div class="glass-panel p-4 h-48 text-sm text-slate-500">
          Select an item in the grid to inspect stats, condition and possible actions.
        </div>
      </section>
    </div>
  </div>
</div>
```

## Данные и API
- Zustand-хранилище (`src/shared/stores/inventoryStore.ts`) хранит:
  - `items` по `id` (из демо-данных или Convex).
  - `equipment`, `containers`, `encumbrance`, `playerStats`, `questProtectedItemIds`.
  - Экшены `moveItemWithinGrid`, `equipItem`, `setQuickSlot`, `setSearchQuery`, `selectItem`.
- Convex API:
  - `api.inventory.get` → начальное состояние.
  - `api.inventory.move` и `api.inventory.equip` вызываются из `InventoryGrid` при drop.

## Интерактивность
- **Поиск:** `input` меняет `searchQuery`, после чего `filterItems` отбирает список.
- **Выбор предмета:** клик/тап по карточке ставит `selectedItemId`, нижняя панель обновляется.
- **Drag-n-drop:** длинное нажатие активирует перетаскивание; цели — сетка, equipment, quick slots.
- **Двойные/долгие тапы:** предусмотрены в `EquipmentSlots` и `InventoryGrid` (TODO: автоэкип).
- **Сравнение:** длинный тап запускает `handleCompare`, что открывает `ItemComparison`.

## Быстрые идеи для развития
- Добавить фильтры по типам (`activeFilter` есть, UI ещё не подключён).
- Реализовать `useQuestItemProtection` (предупреждения, блокировка drop).
- Подтянуть реальные значения Damage/Defense/Weight, используя `playerStats`.
- Интегрировать действия `Equip` / `Inspect` в `ItemDetailsPanel`.

---
Готовый документ можно импортировать в Gemini Canvas: вставьте блок "Минимальный HTML-снимок" для визуала и используйте остальные секции как справочник по данным и логике.

 












