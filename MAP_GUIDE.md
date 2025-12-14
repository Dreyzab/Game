# Карта: актуальное руководство (Mapbox + Bun/Elysia backend)

> ⚠️ Backend переехал на Bun + Elysia. Источник данных — REST в `server/src/api/routes/map.ts` (`/map/points`, `/map/zones`, `/map/discover`). Все упоминания Convex устарели.
>
> Для концепции см. `Map.md`. Технические разборы: `MAP_CONFLICTS_AND_BUGS.md`, `TECHNICAL_ANALYSIS_MAP.md`.

---

## Кратко

- Рендер: Mapbox GL через обёртку `MapboxMap` + React‑слои/маркеры.
- Данные: TanStack Query хук `useMapData` (точки + зоны), отдельные хелперы `useVisibleMapPoints` и `useSafeZones`.
- Взаимодействия: выбор точки, попап, действия/сцены, туман войны, безопасные/опасные зоны.
- Видимость: туман имеет базовый слой фракций (виден всегда), условные сюжетные зоны, динамическое раскрытие поинтов/квестов и временные подсветки врагов в опасных зонах.

### Быстрые ссылки

- Backend Bun/Elysia: см. `server/src/api/routes/map.ts`.
- Гайд по Bun: `BunGuide.md`.
- Исторические Convex материалы: `TECHNICAL_ANALYSIS_MAP.md` (устаревшее, в этот документ интегрированы актуальные фрагменты).

## Предусловия

- `.env.local`: `VITE_MAPBOX_TOKEN=pk...`
- Mapbox CSS подключается в `src/shared/ui/MapboxMap.tsx`.
- Базовый стиль: `mapbox://styles/mapbox/dark-v11`, есть fallback Carto, если токен не задан.

## Ключевые файлы (клиент)

- Обёртка карты: `src/shared/ui/MapboxMap.tsx`
- Основной вид: `src/widgets/map/map-view/MapView.tsx`
- Маркеры: `src/widgets/map/map-view/MapMarkers.tsx` + `src/entities/map-point/ui/MapPointMarker.tsx`
- Попапы: `src/widgets/map/map-view/MapPopups.tsx`
- Слои зон: `src/widgets/map/map-view/FactionZonesLayer.tsx` (safe), `src/widgets/map/map-view/DangerZonesLayer.tsx`
- Туман: `src/widgets/map/map-view/FogOfWarLayer.tsx`
- Страница: `src/pages/MapPage.tsx`
- Хуки данных: `src/shared/hooks/useMapData.ts` (`useVisibleMapPoints`, `useSafeZones`, геолокация)

## Ключевые файлы (сервер)

- Эндпоинты карты: `server/src/api/routes/map.ts`
- Сиды точек: `server/src/seeds/mapPoints.ts`
- Сиды безопасных зон: `server/src/seeds/safeZones.ts`

## Архитектура (кратко)

- UI: React + Mapbox GL, FSD-структура (entities/features/widgets/pages/shared).
- Данные: TanStack Query, хуки `useMapData`, `useVisibleMapPoints`, `useSafeZones`.
- Потоки: `MapView` → подписка на bbox → REST `/map/points` и `/map/zones` → рендер маркеров/слоёв.
- Гео-логика: туман войны (`FogOfWarLayer`), зоны (`FactionZonesLayer`, `DangerZonesLayer`), enemies (WIP `EnemyLayer`).
- Сервер: Bun + Elysia REST; данные из сидов `mapPoints.ts` и `safeZones.ts`; маршруты `/map/points`, `/map/zones`, `/map/discover`.

## Критичные проблемы и решения (актуально)

- Safe Zones: два механизма (`SafeZonesControl` vs `FactionZonesLayer`) → используем единый `FactionZonesLayer`; убрать/объединить `SafeZonesControl`, исключить дублирование запросов `useSafeZones`.
- QR активация: в `MapPage` не передаём `pointId` (сервер ждёт только `qrCode`); убедиться, что фронт не отправляет `_id`.
- Selected point: единый источник истины — использовать `selectedPointId`, восстанавливать объект по списку точек, убрать параллельный `selectedPoint`.
- Дублирование иконок: вынести `getIconForPoint` в общую утилиту, переиспользовать в `MapPointMarker` и `MapPointPopup`.
- XP за точки: вынести расчёт XP по `danger_level` в общую функцию, использовать в `markResearched` и `activateByQR`.
- Слои зон: общая фабрика/хук для зон, чтобы не дублировать создание источника/слоёв в `FactionZonesLayer` и `DangerZonesLayer`.
- ID точек: единообразно использовать `pointKey/id` (строка), не использовать `_id` Convex.

## Рекомендации по производительности и безопасности

- Оптимизировать загрузку точек: фильтрация по bbox на сервере (уже в Bun), избегать лишних запросов при минимальном движении (epsilon).
- Маркеры: при большом числе точек — кластеризация/виртуализация, `React.memo` для `MapPointMarker`.
- Туман войны: вынести тяжёлые `turf.union/difference` в Web Worker; обновлять только при смещении >10 м.
- Tooltip: заменить `innerHTML` на React-компонент/санитизацию.
- Геолокация/QR: добавить rate limiting и специфичные сообщения об ошибках.

## Поток данных (актуально)

1) `MapView` подписывается на движение/зум и пробрасывает bbox через `onBoundsChange`.
2) `useMapData` (TanStack Query) дергает `/map/points?bbox` и `/map/zones`.
3) Внутри `useMapData` выполняется нормализация API → типов `MapPoint`, `SafeZone`, `DangerZone`.
4) `MapView` фильтрует точки по `activeFilters` (локальный стейт) и рендерит маркеры/попапы.
5) Зоны подаются в `FactionZonesLayer` (safe) и `DangerZonesLayer` (danger) как GeoJSON‑слои.
6) `POST /map/discover` дергается при движении игрока (радиус 15 м) для отметки обнаруженных точек.

## Как собрать карту (минимум)

```tsx
// src/pages/MapPage.tsx (фрагмент)
<MapView
  showSafeZones={showSafeZones}
  showDangerZones={showDangerZones}
  showFog={showFog}
  activeFilters={activeFilters}
  onSelectPoint={handleSelectPoint}
  onInteractPoint={handlePointInteract}
  onNavigatePoint={handleNavigatePoint}
  onScanQRPoint={handleScanQRPoint}
  onBoundsChange={setBbox}
/>
```

`MapView` сам вызывает `useVisibleMapPoints({ bbox })` и `useSafeZones({ bbox, enabled })`, передавая данные во внутренние слои.

## Маркеры и попапы

- Маркеры: `MapMarkers` создаёт `mapboxgl.Marker`, React‑контент — `MapPointMarker`.
- Попап: `MapPopups` монтирует React‑дерево в `mapboxgl.Popup`, синхронизирует `selectedPointId`.
- Подсветка: зависит от `type`, статуса (`status: not_found|discovered|researched`) и выбранного/hover.

## Зоны

- Safe: `FactionZonesLayer` рендерит полигоны, окрашивает по `faction`; ожидает `polygon` и `isActive`.
- Danger: `DangerZonesLayer` рендерит полигоны, окрашивает по `dangerLevel` и тянет `spawnRules` (аркетипы врагов, лимиты, тайминги респауна) — см. «Модель врагов».
- Источник данных — `/map/zones` (сервер возвращает `zones`, `safeZones`, `dangerZones`).

## Геолокация и центр

- `useGeolocation` + `useCenterOnUser` внутри `useMapData` набора: позволяют запросить позицию и центровать карту.
- Дополнительно Mapbox `GeolocateControl` подключён в `MapboxMap`.

## Backend API (кратко)

- `GET /map/points?minLat&maxLat&minLng&maxLng&limit` — активные точки, фильтрация по bbox и флагам игрока.
- `POST /map/discover { lat, lng }` — отметить обнаруженные точки в радиусе.
- `GET /map/zones` — `zones`, `safeZones`, `dangerZones`.
- (WIP) `GET /map/enemies?bbox` или сокет `world/enemies` — дельты по врагам в видимых опасных зонах; клиентский слой `EnemyLayer` обновляет маркеры/пинги (см. «Модель врагов»).

## Сиды

- Точки: `server/src/seeds/mapPoints.ts` (Freiburg, типы: poi/quest/npc/location/board/settlement/anomaly).
- Безопасные зоны: `server/src/seeds/safeZones.ts`.
- Запуск: `server/src/scripts/seed.ts` (upsert точек, пересоздание safe_zones, вставка item templates).

## Отладка и частые проблемы (актуально)

- Нет токена — карта падает в fallback стиль без Mapbox.
- Пустые точки — проверьте сиды/авторизацию: `/map/points` требует пользователя; `isLoaded` (Clerk) должен быть true.
- BBox вне Freiburg — маркеры не появятся; приблизьтесь к lat≈47.99 / lng≈7.85 или временно уберите bbox.
- Фильтры: дефолт `['quest','npc','poi','board','anomaly']`; settlement/location могут быть скрыты.
- Зоны не видны — убедитесь, что `showSafeZones/showDangerZones` включены и слои создались после `style.load`.

---

Если нужен пример кастомного слоя или кластеризации — дайте знать, добавлю с кодом.

## Как это работает с Mapbox

- Инициализация:
  - `MapboxMap` создаёт `mapboxgl.Map`, включает контролы, отслеживает ошибки/загрузку.
  - При ошибке стиля (нет токена) — автоматическая смена на `FALLBACK_STYLE` без падения UI.
- События:
  - `moveend` → bbox в стор/сервер (экономный запрос точек).
  - `zoom` → адаптивный размер маркеров.
- Маркеры:
  - Реализованы как `mapboxgl.Marker` + React‑контент (иконка и сияние по типу/статусу/квесту).
- Попапы:
  - Реализованы как `mapboxgl.Popup` с React‑деревом внутри (`setDOMContent`).
- Слои зон:
  - Создаются через `map.addSource`/`map.addLayer`; обновление `setData` без пересоздания карты.

## Центровка на текущем местоположении

- Хуки:
  - `useGeolocation({ accuracy: 'high', watch: false })` — одноразовый запрос точного положения.
  - `useCenterOnUser({ position, getCurrentPosition })` — обёртка, которая по клику запрашивает свежий фикс и, когда координаты обновятся, выставляет `center`.
- Использование в `MapPage`:

```tsx
// client/src/pages/MapPage/MapPage.tsx (фрагмент)
const { position, isLoading: isGeoLoading, getCurrentPosition } = useGeolocation({ accuracy: 'high', watch: false })
const { center, setCenter, handleLocateUser } = useCenterOnUser({ position, getCurrentPosition })

<MapView
  center={center}
  // ...
/>

// Кнопка в тулбаре карты
<MapControls
  onCenterOnUser={handleLocateUser}
  isGeoLoading={isGeoLoading}
  // ...
/>
```

- Что происходит под капотом:
  - `handleLocateUser()` инициирует `getCurrentPosition()` и запоминает координаты на момент клика.
  - После получения нового `position` хук выставляет `center` в `[lng, lat]`.
  - `MapboxMap` ловит изменение пропа `center` и делает `jumpTo({ center })`.
- Встроенный контрол:
  - Дополнительно `MapboxMap` добавляет `GeolocateControl` (иконка навигации в правом верхнем углу), но UX центрации управляется через кнопку `MapControls`.

## Фильтры: тип, фракция, поиск, QR‑зоны

- Состояние UI (zustand): `useMapState`
  - `selectedCategory: 'all' | poi | quest | npc | location | board | settlement | anomaly | 'shop'`
  - `selectedFaction: 'all' | FactionType`
  - `showCompleted: boolean` — отображать ли исследованные
  - `showQRZones: boolean` — показывать ли точки‑QR‑зоны
  - `searchQuery: string`
- Применение фильтров: `useFilteredMapPoints(points, filters)`
  - Категория: прямое соответствие `p.type`, для `'shop'` — сервисы в `metadata.services` (`trade|repair|crafting|upgrade`).
  - Фракция: `p.metadata?.faction === selectedFaction`.
  - Выполненные: скрывает `status === 'researched'`, если `showCompleted === false`.
  - QR‑зоны: скрывает `metadata.isQRZone`, если `showQRZones === false`.
  - Поиск: по `title`/`description` (регистронезависимый).
  - Если известна локация пользователя — добавляет `distance` (км, Haversine).
- Связка с UI:

```tsx
// Mobile фильтры (фрагмент)
<LocationFilters
  selectedCategory={selectedCategory}
  onChangeCategory={setSelectedCategory}
  showCompleted={showCompleted}
  onToggleCompleted={setShowCompleted}
  searchQuery={searchQuery}
  onSearch={setSearchQuery}
  selectedFaction={selectedFaction}
  onChangeFaction={setSelectedFaction}
  showQRZones={showQRZones}
  onToggleQRZones={setShowQRZones}
  showSafeZones={showSafeZones}
  onToggleSafeZones={setShowSafeZones}
/>
```

- Боковая легенда (desktop): `MapLegendPanel` управляет `selectedCategory`, `selectedFaction`, `showQRZones`, `showSafeZones`.

## Поток активации поинтов (QR/условия)

- **Состояния/данные**: у точки есть `status` (`not_found|discovered|researched`), `visibility` (авто‑раскрытие, радиус, сторифлаг) и `activation` (`activationType: qr|conditional|auto`, `qrCodeId`, `conditionalTriggerId`, `conditions`). В тумане войны дырки строятся по `status`/`visibility.isDiscovered`.
- **Общий пайплайн**: (1) клиент получает точки через `/map/points` (учёт bbox/флагов/phase); (2) при движении `POST /map/discover` отмечает точки в радиусе 15 м как `discovered` (без награды); (3) UI решает, показать кнопку действия или QR, опираясь на `activation.activationType` и выполненные условия; (4) успешная активация помечает точку `researched`, выдаёт награду/флаги, перезапрашивает точки → `useFogOfWar` открывает область.
- **QR‑флоу**: игрок нажимает `onScanQRPoint` → сканер → мутация `activateByQR` (по `qrCodeId`). Сервер сверяет: точка активна, не закрыта по `visibility.storyUnlockId/skill`, код совпадает, не исследована. При успехе: записывает `point_discoveries.researchedAt`, начисляет XP (по `danger_level`), возвращает новый статус; фронт обновляет список точек/попап, туман открывается вокруг радиуса точки.
- **Условный флоу (без QR)**: триггеры — кнопка "Взаимодействовать", вход в радиус (`visibility.revealOnProximityRadius`), внешние события (`conditionalTriggerId`). Перед активацией сервер проверяет `activation.conditions` (флаги сюжета/квеста, предметы, репутацию, кулдауны). Если условия не выполнены, попап показывает причину (локализованный message) и точка остаётся `discovered`. При выполнении: ставим `researched`, отправляем награду/флаги, открываем зависимые зоны/точки (через сторифлаги или `requiresZoneId`), пушим обновление тумана.
- **Авто‑флоу**: `activationType:auto` для событий «подошёл и получи». Условие — proximity + `autoReveal` или `alwaysVisible`; сервер сразу отмечает `researched`, может запускать VN‑сцену/квест‑шаг без участия игрока (но с защитой от повторов).
- **Синхронизация с туманом**: после любой успешной активации клиент либо повторно дергает `/map/points`, либо локально помечает точку `status: 'researched'`/`visibility.isDiscovered=true`; `useFogOfWar` добавляет круг в mask → слой `FogOfWarLayer` перерисовывает маску. Для сюжетных зон `conditionalZones.isDiscovered/alwaysVisible` аналогично пробивает туман.
- **UX/ошибки**: QR — показывать hint из `metadata.qrHint`, повторные сканы возвращают «уже активировано». Условные — кнопка disabled с причинами (нет навыка/флага/времени). Все ветки должны быть идемпотентны: повторная активация не меняет XP, но подтверждает статус и обновляет туман, если ранее был рассинк.

## Модель врагов (спаун, обзор, заметность)

- **Данные**:
  - `danger_zones` расширяются конфигом `spawnRules`: `archetypes: enemy_template_id[]`, `maxAlive`, `spawnBudgetPerPlayer` (зависит от `dangerLevel`: low 1–2, medium 3–5, high 6–8), `respawnCooldownSec`, `despawnDelaySec`, `patrolPaths` (массив waypoints), `spawnRadius`/`spawnPoints` внутри полигона.
  - `enemy_templates` содержат `tier`, `faction`, `aiProfile` (`idle|patrol|raider|sniper`), `vision` (`radius`, `angle`, `peripheralPenalty`, `nightPenalty`), `hearing` (`radius`, `noiseThreshold`), `lootTable`, `xpReward`.
  - Временные инстансы врагов: `{ id, zoneId, templateId, position { lat, lng }, state: idle|patrol|alert|chase|return, targetPlayerId?, pathProgress?, lastSeenAt, detectedBy: userId[] }`. Инстансы не пишутся в БД — только в оперативное хранилище/кэш.
- **Спаун/деспаун**:
  - Триггер: вход игрока в `danger_zone` или шумовое событие выше `spawnRules.noiseThreshold` (выстрел, взрыв). На каждого активного игрока выделяется `spawnBudgetPerPlayer`, но общее число врагов ограничено `maxAlive`.
  - Позиции: либо предзаданные `spawnPoints`, либо псевдослучайно по полигонам с удержанием `minDistanceFromPlayer` (не под ногами). Для патрульных — привязка к ближайшему `patrolPath`.
  - Респаун: по таймеру `respawnCooldownSec`, если в зоне всё ещё есть игроки и живых меньше `maxAlive`. `despawnDelaySec` срабатывает, когда зона пустеет (враги «рассасываются» без дропа/XP).
- **Обзор и шум**:
  - Видимость: первичная модель — круг `vision.radius`; при наличии данных об укрытиях можно добавить конус `angle` + рейкаст по тайлам. Ночная сцена даёт штраф `nightPenalty`, перки игрока — бонус к скрытности.
  - Слух: события карты создают `noiseLevel` и радиус (выстрел > взрыв > шаги). Если `noiseLevel` ≥ `hearing.noiseThreshold`, враг переходит в `alert` и идёт к источнику.
  - Стадии замечания: `idle/patrol` → `suspicious` (красный пинг на карте, но без привязки к игроку) → `chase` (фиксированная цель, обновляется при LoS/шуме) → `return` к патрулю.
- **Отображение на карте/тумане**:
  - Базовая видимость врагов выключена: игрок видит только полигоны `danger_zones`. Появление пингов/маркеров разрешено, если: (а) игрок имеет прямой LoS, (б) враг в состоянии `suspicious/chase` и недавно был виден (`lastSeenAt` < TTL), (в) действует эффект «сканер»/перки (`parliament.enemy_reveal`).
  - Клиентский слой `EnemyLayer` (отдельный source+layer) рисует: красный круг‑пинг (`suspicious`), маркер с направлением обзора (`chase`), полупрозрачный «след» для `lastSeen` с таймаутом. Туман войны не снимается, но маркер пробивает маску локально (виден как heatmap/контур).
  - После деспауна или потери цели UI скрывает маркеры, остаётся только предупреждение «опасная зона» по полигону.
- **Доставка данных**:
  - API-скиз: `GET /map/enemies?bbox` (пуллинг) или канал `socket:world/enemies` с дельтами `{ added, updated, removed }`. Клиент хранит `enemyStore` и синхронизирует слой без пересоздания карты.
  - На клиенте события шумов (выстрелы, сканы) можно пушить через `POST /map/noise` или сокет-событие `world/noise`, чтобы сервер корректно будил спаун.

## Расширение

- Новый тип точки:
  - Добавить тип в `MapPointType` и отрисовку в `MapPointMarker` (иконка/цвет/темы).
- Новый слой:
  - Создать control по образцу `SafeZonesControl`, выделить отдельный source + слои, добавить методы `update/setVisible`.
- Кастомный стиль Mapbox:
  - Передать `style` в `MapboxMap`; убедиться, что есть токен.

## Производительность и UX

- Не пересоздавайте карту при каждом рендере (обновляйте `style`, `center`, `zoom` аккуратно).
- Используйте сравнение bbox с `epsilon` (см. `MapPage`) чтобы не триггерить лишние запросы.
- Обновляйте только данные источника (`setData`) вместо пересоздания слоёв.
- Popup/marker React‑деревья размонтируйте через `queueMicrotask` для избежания гонок.

## Отладка и частые проблемы

- Нет токена → проверьте `VITE_MAPBOX_TOKEN` или используйте не‑Mapbox стиль.
- Слои исчезают после смены стиля → подписывайтесь на `style.load` и пересоздавайте слои (см. `SafeZonesControl`).
- Маркеры «мигают» → переиспользуйте DOM‑элемент/React‑root, не удаляйте без надобности.
- Точки не фильтруются → проверьте `useFilteredMapPoints` и состояние стора `useMapState`.

## Чит‑лист

- Токен: `VITE_MAPBOX_TOKEN`
- Карта: `MapboxMap` → `onMapLoad` → `MapView`
- Точки: `useVisibleMapPoints({ bbox })` → `useMapPointStore.setPoints`
- Фильтры: `useMapState` + `useFilteredMapPoints`
- Маркеры: `MapPointMarker`
- Попап: `MapPointPopup`
- Зоны: `useSafeZones` + `SafeZonesControl`
- Взаимодействие: `useMapPointInteraction` + `InteractionMenu`

---
Нужны примеры кастомного слоя/кластеризации или шаблон для собственных иконок? Скажи — добавлю с кодом.
