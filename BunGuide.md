# Bun/Elysia: настройка, API и сиды

> Проект переведён с Convex на Bun + Elysia. Этот гид описывает, как запустить backend, какие маршруты доступны и как сидировать базовые данные (карта, зоны, инвентарь, квесты).

## Быстрый старт (локально)
- Требования: Bun >= 1.0, PostgreSQL (см. drizzle конфиг), Node не требуется для сервера.
- Установка: `cd server && bun install`
- Запуск dev: `bun run dev` (порт 3000 по умолчанию)
- Запуск prod: `bun run start`
- Тесты: `bun test`
- Swagger: `http://localhost:3000/swagger`

### ENV (скопируйте `server/.env.example` → `server/.env`)
```
DATABASE_URL=postgres://user:pass@localhost:5432/grezwanderer
CLERK_SECRET_KEY=...
CLERK_PUBLISHABLE_KEY=...
VITE_MAPBOX_TOKEN=...
```

## Скрипты Bun (`server/package.json`)
- `bun run dev` — Elysia в watch-режиме
- `bun run start` — прод-запуск
- `bun run src/scripts/seed.ts` — сиды (точки карты, зоны, предметы)
- `bun run db:generate|db:migrate|db:push` — drizzle миграции/синхронизация

## Основные маршруты (REST)
Файл входа: `server/src/index.ts` — регистрирует роуты и Swagger.

### Карта (`server/src/api/routes/map.ts`)
- `GET /map/points?minLat&maxLat&minLng&maxLng&limit` — активные точки в bbox
- `POST /map/discover { lat, lng }` — пометить обнаруженные точки в радиусе
- `GET /map/zones` — безопасные и опасные зоны
- (WIP) `GET /map/enemies?bbox` — дельты по врагам

### Инвентарь (`server/src/api/routes/inventory.ts`)
- `GET /inventory` — данные инвентаря (items, equipment, containers)
- `POST /inventory/equip` — экипировать предмет
- `POST /inventory/move` — переместить в сетке/контейнере
- `POST /inventory/quick-slot` — установить быстрый слот

### Квесты / навыки / VN
- `server/src/api/routes/quests.ts` — чтение/обновление прогресса
- `server/src/api/routes/skills.ts` — навыки и статы
- `server/src/api/routes/vn.ts` — фиксация сцен визуальной новеллы
- Другие подключенные: `player`, `combat`, `coop`, `pvp`, `presence`, `mastery`, `resonance`.

### WebSocket
- `server/src/sockets` — канал presence/coop (см. `wsRoutes` в `index.ts`).

## Сиды и данные
- Точки карты: `server/src/seeds/mapPoints.ts`
- Безопасные зоны: `server/src/seeds/safeZones.ts`
- Предметы/шаблоны: `server/src/seeds/itemTemplates.ts`
- Скрипт запуска: `bun run src/scripts/seed.ts`

## Drizzle
- Конфиг: `server/drizzle.config.ts`
- Схемы: `server/src/db/schema/*`
- Команды: `bun run db:generate`, `bun run db:migrate`, `bun run db:push`

## Клиентские вызовы (пример fetch)
```ts
// точки в bbox
await fetch("/map/points?minLat=47.99&maxLat=48&minLng=7.85&maxLng=7.9&limit=200")
  .then((r) => r.json())

// отметить обнаружение
await fetch("/map/discover", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ lat, lng })
})
```

## Миграция с Convex (кратко)
- Convex функции и схемы заменены на REST + Drizzle; Convex клиент больше не используется.
- Идентификаторы точек/квестов — строки (`id/pointKey`), без `_id` Convex.
- Фронт: см. `MAP_GUIDE.md` и `Inventory.md` — точки и инвентарь берут данные из Bun API.

## Проверка
- Открыть `http://localhost:3000/swagger` — маршруты зарегистрированы.
- Выполнить сид: `bun run src/scripts/seed.ts` — карта/зоны/предметы заполнятся.
- Запрос `GET /map/points` с bbox Freiburg — вернёт маркеры.
