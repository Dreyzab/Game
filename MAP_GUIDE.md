# Карта: архитектура, фичи, стиль и интеграция с Mapbox

> **Примечание:** Это техническое руководство по реализации карты.  
> Для концептуального описания геймдизайна см. `Map.md`  
> Для анализа проблем см. `MAP_CONFLICTS_AND_BUGS.md`  
> Для детального технического анализа см. `TECHNICAL_ANALYSIS_MAP.md`

---

## Кратко
- Карта рендерится через оболочку `MapboxMap` и композицию React‑компонентов поверх Mapbox GL.
- Данные (точки/зоны) приходят из Convex, фильтруются и превращаются в маркеры и слои.
- Взаимодействия: выбор точки, меню действий, запуск сцен VN, автоподсветка целей квеста.

## Предусловия
- Mapbox токен в `.env.local` клиента:
  - `VITE_MAPBOX_TOKEN=pk.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- CSS Mapbox подключается в обёртке:
  - `client/src/shared/ui/MapboxMap.tsx:3`
- Базовый стиль: `mapbox://styles/mapbox/dark-v11`, с автоматическим fallback на Carto при отсутствии токена.

## Ключевые файлы
- Обёртка карты: `client/src/shared/ui/MapboxMap.tsx:20`
- Вид карты: `client/src/widgets/map/map-view/MapView.tsx:1`
- Слой безопасных зон: `client/src/widgets/map/map-view/SafeZonesControl.ts:1`
- Маркеры точек: `client/src/entities/map-point/ui/MapPointMarker.tsx:1`
- Попап точки: `client/src/entities/map-point/ui/MapPointPopup.tsx` (иконка, действия)
- Страница карты: `client/src/pages/MapPage/MapPage.tsx:1`
- Фильтры/состояние UI: `client/src/features/map/filters/model/useMapState.ts:1`
- Фильтрация списка: `client/src/features/map/filters/useFilteredMapPoints.ts:1`
- API точек: `client/src/entities/map-point/api/convex.ts:1`
- Хук зон: `client/src/shared/api/zones/convex.ts:1`

## Поток данных (высокоуровнево)
1) BBox → сервер: Map сообщает текущие границы (bbox) через `onBoundsChange`.
2) Convex: `mapPoints.listVisible` возвращает точки с учётом `bbox`, фазы, флагов и `unlockRequirements`.
3) Клиент: точки попадают в zustand‑store (`useMapPointStore`) и фильтруются `useFilteredMapPoints`.
4) Рендер: `MapView` создаёт/обновляет маркеры (`MapPointMarker`) и React‑попап для `selectedPointId`.
5) Зоны: `useSafeZones` подаёт полигоны во встроенный `SafeZonesControl`, обновляя `GeoJSON` source/слои.

## Как собрать карту (по шагам)
1) Роутинг и страница
- Роут зарегистрирован в `client/src/main.tsx:27` (`/map`). Страница: `client/src/pages/MapPage/MapPage.tsx:1`.
- Компонент `MapPage` связывает данные, фильтры, выбор точки и меню взаимодействия.

2) Инициализация Mapbox
- Обёртка `MapboxMap` создает instance (`mapboxgl.Map`) и пробрасывает его в `onMapLoad`.
- Пропсы: `center`, `zoom`, `style` (по умолчанию тёмная тема Mapbox). Fallback Carto, если токена нет.
- Навигация/геолокация: добавляются `NavigationControl`, `GeolocateControl`.

3) Рендер карты и событий
- `MapView` получает пропсы: `points`, `safeZones`, `showSafeZones`, `selectedPointId`, `onSelectPoint`, `onBoundsChange`.
- Слушатели: `moveend` → отправка `bbox`; `zoom` → сохранение текущего зума для адаптивного размера маркеров.
- Выбор точки (store): `selectedPointId` приводит к `flyTo` и открытию React‑попапа.

4) Маркеры
- Создание: для каждой точки `MapView` создаёт `mapboxgl.Marker` с React‑обёрткой `MapPointMarker`.
- Обновление: при изменениях пропсов перерендерится только содержимое маркера (через сохранённый `root`).
- Визуал: цвет/подсветка зависят от типа, опасности, близости к QR‑радиусу и статуса квеста.

5) Попап
- Выбор точки создаёт React‑попап `MapPointPopup` и монтирует его в `mapboxgl.Popup` DOM.
- Закрытие попапа синхронизирует `selectedPointId=null` и аккуратно размонтирует React‑корень.

6) Безопасные зоны (слои)
- `SafeZonesControl` управляет `GeoJSON` sources и 3 слоями: `fill`, `line`, `symbol` (лейблы).
- Данные обновляются через `control.updateZones(safeZones)` и `control.setVisible(showSafeZones)`.
- Контроль пересоздания слоёв: `style.load`; защита от мерцания/двойных апдейтов.

7) Фильтры и список локаций
- Zustand‑стор `useMapState` хранит UI‑состояние (категория, фракция, поиск, QR‑зоны, safe‑zones).
- Хук `useFilteredMapPoints` применяет фильтры и добавляет дистанцию (если есть пользовательская локация).
- UI‑панели: `MapLegendPanel`, `LocationFilters`, `PointsListPanel`, `MapToolbar`.

8) Взаимодействие и сцены (VN)
- Клик по точке → `useMapPointInteraction`:
  - Подбирает `sceneBinding` с наивысшим приоритетом и подходящими условиями.
  - Показывает `InteractionMenu` или сразу навигирует на `/visual-novel` с `sceneId`.
- Автовыбор целей квеста/флагов (`info_bureau`) — логика в `MapPage` (авто‑flyTo, защита от вмешательства пользователя).

9) Загрузка данных
- Точки: `useVisibleMapPoints({ bbox })` → `api.mapPoints.listVisible`.
- Зоны: `useSafeZones({ bbox, enabled })` → `api.zones.listSafeZones`.
- Мировое состояние (HUD): `useWorldState()`.

## Пример интеграции (минимум)
```tsx
// MapPage.tsx (фрагмент)
<MapView
  center={center}
  points={filteredPoints}
  safeZones={safeZones || []}
  showSafeZones={showSafeZones}
  selectedPointId={selectedPointId}
  onSelectPoint={handleSelectPoint}
  onBoundsChange={handleBoundsChange}
  className="absolute inset-0"
/>
```

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
