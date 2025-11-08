# Convex: настройка, схемы, API и сиды

## Назначение
Этот гид описывает, как запустить Convex локально/в облаке, какие таблицы и функции используются проектом, как сидировать базовые данные (точки на карте, зоны, квесты) и как обращаться к API из клиента.

## Быстрый старт
- Установи зависимости: `cd client && npm i`
- Запусти Convex локально: `npm run convex:dev`
  - По умолчанию клиент коннектится к `http://127.0.0.1:3210` (см. `client/src/shared/lib/convexClient/convexClient.ts:1`).
  - Для прод/облака задай `VITE_CONVEX_URL=https://<deployment>.convex.cloud` в `client/.env.local`.
- Запусти клиент: `npm run start` (или `npm run dev`)
- После изменений схем/функций: `npm run convex:codegen`
- Деплой в облако: `npm run convex:deploy`

## Важные файлы
- Схема БД: `client/convex/schema.ts`
- Общие константы прогресса: `client/convex/gameProgress.ts`
- Точки на карте (API): `client/convex/mapPoints.ts`
- Квесты (API): `client/convex/quests.ts`
- Визуальная новелла (API): `client/convex/vn.ts`
- Игрок (API): `client/convex/player.ts`
- Зоны (API): `client/convex/zones.ts`
- Сиды: `client/convex/mapPointsSeed.ts`, `client/convex/zonesSeed.ts`
- Клиент Convex: `client/src/shared/lib/convexClient/convexClient.ts`

## Схема данных (основное)
- `players` — профиль по `deviceId`/`userId`: имя, фаза, скилы, уровень, XP, skillPoints.
- `game_progress` — текущая сцена, флаги, фаза, скилы, уровень/XP, skillPoints, visitedScenes.
- `map_points` — точки карты: `id`, `title`, `coordinates`, `type`, `phase`, `metadata` (в т.ч. `sceneBindings`, `unlockRequirements`, `qrCode`, `danger_level`).
- `point_discoveries` — персональный статус точки: discovered/reserached с таймстампами.
- `mappoint_bindings` — привязки точка↔квест (start/progress/complete).
- `quests` / `quest_progress` — квесты и прогресс игрока.
- `safe_zones` и `danger_zones` — полигоны зон (фракции/опасность).
- `world_state` — ключ‑значение для состояния мира (см. индексы в `schema.ts`).

## Точки карты (mapPoints.ts)
- `listVisible({ deviceId?, userId?, bbox?, phase?, limit? })`
  - Возвращает активные точки с учётом `bbox`, `phase` и `unlockRequirements` согласно флагам игрока.
  - Обогащает `info_bureau` дефолтным биндингом/категорией, если не задано.
- `markResearched({ deviceId?|userId?, pointKey })`
  - Помечает точку как исследованную, начисляет XP по `danger_level` и обрабатывает level‑up.
- `activateByQR({ deviceId?|userId?, qrCode })`
  - Находит точку по `qrCode` (индекс/metadata), помечает discovered/researched, начисляет XP.
- `getPointsInRadius({ lat, lng, radiusKm?, type?, phase?, limit? })`
  - Возвращает точки в радиусе, отсортированные по расстоянию.
- `getDiscoveryStats({ deviceId?|userId? })`
  - Аггрегированная статистика открытий.

Пример вызовов из клиента:
```ts
import convexClient from '@/shared/lib/convexClient/convexClient'
import { api } from '@/../convex/_generated/api'

await convexClient.query(api.mapPoints.listVisible, { deviceId, bbox })
await convexClient.mutation(api.mapPoints.markResearched, { deviceId, pointKey: 'info_bureau' })
await convexClient.mutation(api.mapPoints.activateByQR, { deviceId, qrCode: 'TEST_QR_ABC' })
```

## Квесты (quests.ts)
- `getActiveQuests({ deviceId, userId? })` — активные квесты игрока.
- `getQuestStats({ deviceId, userId? })` — статистика квестов.
- `getAvailableQuests({ deviceId, userId? })` — доступные квесты по фазе и prerequisites.
- `startQuest({ deviceId, userId?, questId, initialStep })` — стартует квест.
- `updateQuestProgress({ deviceId, userId?, questId, newStep, progressData? })` — шаг квеста.
- `completeQuest({ deviceId, userId?, questId, finalStep? })` — завершение, награды (+XP в `game_progress`).
- `syncQuestState({ deviceId, userId?, questUpdates: [...] })` — пакетная синхронизация состояния.
- `getNextStep({ deviceId, userId?, sceneId?, context? })` — подсказка следующего шага/точки из флагов.
- Сиды: `seedBaseQuests()`, `seedStoryQuests()` — наполняют квесты и привязки.

Примеры:
```ts
await convexClient.mutation(api.quests.startQuest, { deviceId, questId: 'first_steps_in_freiburg', initialStep: 'find_info_bureau' })
await convexClient.mutation(api.quests.completeQuest, { deviceId, questId: 'first_steps_in_freiburg' })
```

## Визуальная новелла (vn.ts)
- `commitScene({ deviceId?|userId?, sceneId, payload: { startedAt?, finishedAt?, flags?, choices?, skillChecks? } })`
  - Обновляет `game_progress` (flags/visitedScenes/phase) и возвращает `next` подсказку из `questEngine`.
- (Также есть `quests.commitScene` в `quests.ts` с похожей логикой эффектов XP/flags.)

Пример:
```ts
await convexClient.mutation(api.vn.commitScene, {
  deviceId,
  sceneId: 'gustav_aftermath',
  payload: {
    flags: { arrived_at_freiburg: true },
    choices: [{ choiceId: 'agree', timestamp: Date.now() }]
  }
})
```

## Игрок (player.ts)
- `ensureByDevice({ deviceId, userId? })` — гарантирует существование `players` и `game_progress`.
- `getProfile({ userId? })`, `getStats({ userId? })` — базовые чтения профиля/статистики.

Пример:
```ts
await convexClient.mutation(api.player.ensureByDevice, { deviceId })
```

## Зоны (zones.ts, zonesSeed.ts)
- `listSafeZones({ bbox? })`, `listDangerZones()` — чтение зон.
- Сиды: `seedSafeZones()`, `clearSafeZones()` — наполнение/очистка `safe_zones`.

Пример:
```ts
await convexClient.query(api.zones.listSafeZones, { bbox })
await convexClient.mutation(api.zonesSeed.seedSafeZones, {})
```

## Сиды (mapPointsSeed.ts, zonesSeed.ts)
- Точки карты:
  - `seedMapPoints()`, `reseedMapPoints()`, `clearMapPoints()`
  - Добавление QR к точке: `addQRToPoint({ pointId, qrCode, qrHint, qrRequired? })`
- Зоны:
  - `seedSafeZones()`, `clearSafeZones()`
- Квесты:
  - `quests.seedBaseQuests()`, `quests.seedStoryQuests()`

Вызов из DevTools/Settings (см. UI) или напрямую:
```ts
await convexClient.mutation(api.mapPointsSeed.seedMapPoints, {})
await convexClient.mutation(api.zonesSeed.seedSafeZones, {})
await convexClient.mutation(api.quests.seedBaseQuests, {})
await convexClient.mutation(api.quests.seedStoryQuests, {})
```

## Жизненный цикл карты ↔ Convex
1) `MapView` сообщает `bbox` → `useVisibleMapPoints({ bbox })` → `mapPoints.listVisible`.
2) Сервер фильтрует точки по `phase` и `unlockRequirements` с учётом `game_progress.flags` игрока.
3) Клиент фильтрует UI‑категории/фракции/поиск и рендерит маркеры.
4) Попап/меню генерит действия; при выборе — `vn.commitScene`/квестовые мутаторы.
5) QR‑активация — `mapPoints.activateByQR` → discovery + XP.

## Переменные окружения
- `VITE_CONVEX_URL` — адрес Convex (локально не обязателен; есть дефолт).
- `VITE_MAPBOX_TOKEN` — токен Mapbox (для карты).

## Безопасность и прод
- Сид‑эндпойнты не должны быть доступны обычным пользователям в проде; вызывай их только при админ‑ролях/скрытых UI.
- `addTestQRCode` заблокирован в `production` (проверяет `process.env.NODE_ENV`).
- Валидируй все входные данные (Convex уже валидирует через `v.*`, но логику доступа добавляй по необходимости).

## Отладка
- `npm run convex:dev` — локальный сервер и дашборд (URL в консоли CLI).
- Если `api` типы не подтянулись — выполни `npm run convex:codegen`.
- Проблемы со связью — проверь `VITE_CONVEX_URL` и логи в `convex dev`.

---
Нужно расписать миграцию/наполнение контента (готовый CSV/JSON → `map_points`/`quests`), или добавить примеры cURL для Cloud? Скажи — расширю разделы.
## Реальные примеры Convex queries (клиент)

### Точки видимости по bbox
```ts
// client/src/entities/map-point/api/convex.ts
export function useVisibleMapPoints({ bbox, phase, limit = 100, enabled = true } = {}) {
  const { deviceId } = useDeviceId()
  return useQuery(api.mapPoints.listVisible, enabled ? { deviceId, bbox, phase, limit } : 'skip')
}

// Прямой вызов
const res = await convexClient.query(api.mapPoints.listVisible, {
  deviceId,
  bbox: { minLat, maxLat, minLng, maxLng },
  phase: 1,
  limit: 100,
})
```

### Точки в радиусе
```ts
const around = await convexClient.query(api.mapPoints.getPointsInRadius, {
  lat, lng, radiusKm: 1.2, type: 'poi', phase: 1, limit: 50,
})
```

### Статусы открытий
```ts
const stats = await convexClient.query(api.mapPoints.getDiscoveryStats, { deviceId })
```

### Активация по QR и исследование точки
```ts
await convexClient.mutation(api.mapPoints.activateByQR, { deviceId, qrCode: 'TEST_QR_ABC' })
await convexClient.mutation(api.mapPoints.markResearched, { deviceId, pointKey: 'info_bureau' })
```

### Зоны (Safe Zones) по bbox
```ts
// client/src/shared/api/zones/convex.ts
export function useSafeZones({ bbox, enabled = true } = {}) {
  return useQuery(api.zones.listSafeZones, enabled ? { bbox } : 'skip')
}
```

### Квесты (старты/прогресс/завершение)
```ts
await convexClient.mutation(api.quests.startQuest, {
  deviceId,
  questId: 'first_steps_in_freiburg',
  initialStep: 'find_info_bureau',
})

await convexClient.mutation(api.quests.updateQuestProgress, {
  deviceId,
  questId: 'first_steps_in_freiburg',
  newStep: 'talk_to_registrar',
})

await convexClient.mutation(api.quests.completeQuest, {
  deviceId,
  questId: 'first_steps_in_freiburg',
})
```

### Визуальная новелла (фиксация сцены)
```ts
await convexClient.mutation(api.vn.commitScene, {
  deviceId,
  sceneId: 'gustav_aftermath',
  payload: {
    flags: { arrived_at_freiburg: true },
    choices: [{ choiceId: 'agree', timestamp: Date.now() }],
  },
})
```
