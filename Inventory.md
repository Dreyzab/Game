# Инвентарь: обзор и архитектура страницы

> Backend: Bun + Elysia (`server/src/api/routes/inventory.ts`). UI — React + Zustand. актуальный API — Bun.

## Цели и возможности
- Сетка 10×6 (Tarkov-style), drag & drop между сеткой, слотами экипировки, контейнерами и быстрыми слотами.
- Экипировка со слотами: шлем, броня, primary/secondary, штаны, рюкзак, rig, quick access.
- Вес и нагрузка (4 уровня), редкость, защита квестовых предметов, поиск/фильтры/сортировка.
- Мобильный UX: тап/долгое нажатие/свайп, крупные кликабельные зоны, haptic feedback.

## Структура страницы `/inventory`
- Главный компонент: `src/features/inventory/ui/InventoryPage.tsx` (ModernInventoryPage).
- Layout 12 колонок:
  - Левая (4): Character Panel с `EquipmentSlots`, `QuickAccessBar`, `QuickStatsPanel`, `ContainerPanel`.
  - Правая (8): Search Bar, `EnhancedInventoryGrid` (Tetris‑сетка), `ItemDetailsPanel`.
- Модалки: `ItemComparison` (долгое нажатие/hover), планируемые Inspect/контекстное меню.

## Основные компоненты
- `EquipmentSlots/EquipmentSlots.tsx` — силуэт + слоты, двойной тап снимает предмет, долгое нажатие сравнивает.
- `QuickAccessBar/QuickAccessBar.tsx` — 5 быстрых слотов, drag & drop, нумерация.
- `QuickStatsPanel.tsx` — DMG/DEF/Weight (тек/макс), автопересчёт.
- `ContainerPanel.tsx` — динамические контейнеры от экипированных предметов (1×1 шлем, 4×2 rig, 4×4 рюкзак, 4×1 ремень).
- `EnhancedInventoryGrid.tsx` → `InventoryGrid.tsx` — Tetris‑сетка, подсветка, drag overlay, защита квестовых предметов.
- `ItemDetailsPanel.tsx` — статы (DMG/DEF/Weight/Size/Condition), теги, действия Equip/Unequip.
- `ItemComparison/ItemComparison.tsx` — сравнение с экипированным, цветовые дельты.

## State management (Zustand, `src/shared/stores/inventoryStore.ts`)
- Состояние: `items`, `equipment`, `containers`, `encumbrance`, `playerStats`, `selectedItemId`, `searchQuery`, `activeFilter`, `questProtectedItemIds`.
- Методы: `equipItem`, `setQuickSlot`, `moveItemWithinGrid`, `selectItem`, `setSearchQuery`, `syncWithBackend`, `getContainers`.
- Производные: автоматический пересчёт `encumbrance`, `playerStats`, авто‑создание контейнеров при экипировке.
- Drag & drop: `useInventoryDragStore` управляет состоянием перетаскивания и валидирует целевые зоны.
- Защита квестовых: `useQuestItemProtection` блокирует удаление и выделяет badge.

## Поток данных (упрощённо)
1) `InventoryPage` запрашивает данные через Elysia API `/inventory` (см. `server/src/api/routes/inventory.ts`).
2) Ответ → `syncWithBackend` в zustand store.
3) UI читает store в слотах/сетке/контейнерах/деталях.
4) Действия (equip/move/setQuickSlot) пишут в store и вызывают соответствующие API (см. TODO в server).
5) Автосохранение локально (localStorage) + outbox-паттерн для оффлайн‑событий (из `inventory_system.md`).

## UX и управление
- Горячие клавиши: Alt+I (открыть), F/R/D/S/1-5 (действия/слоты), вращение R в `ItemCardWithRotation`.
- Анимации: Framer Motion (`AnimatedCard`, overlay drag), hover/transition.
- Поиск и фильтры: реакт‑фильтрация, debounce для ввода.

## Backend и интеграции
- REST (Bun/Elysia): `GET /inventory`, `POST /inventory/equip`, `POST /inventory/move`, `POST /inventory/quick-slot` (см. фактические маршруты в `server/src/api/routes/inventory.ts`).
- Связанные фронтовые точки входа: `features/inventory/model/*`, `features/inventory/ui/*`.

## Приоритеты улучшений
- Завершить серверные мутации equip/move/quick-slot под Bun.
- Вынести общие константы редкости/цветов, единообразные типы предметов.
- Добавить оптимистичные обновления и обработку ошибок синхронизации.
- Виртуализация сетки для больших инвентарей; тесты (Vitest/Playwright) — см. `quick_start_testing.md`.

## Куда смотреть дальше
- Детальная спецификация: `inventory_system.md`.
- UI/UX детали и жесты: `inventory_ui_ux.md`.
- Чек‑лист интеграции и метрики: `integration_checklist.md`.
- Быстрый старт и тесты: `quick_start_testing.md`.
