# QR‑активация (MVP)

Этот документ описывает текущую реализацию QR‑активации в Grenzwanderer3: сканирование QR возвращает **список действий** (actions), которые клиент может выполнить (показать сообщение, открыть VN‑сцену, запустить бой‑туториал), а сервер — применить награды/прогресс (лут, XP, золото, флаги) и/или **разблокировать mapPoint**.

## 1) Базовая идея: “QR → Trigger → Actions”

- QR‑код содержит **payload** (строку), которую клиент отправляет на backend.
- Backend парсит payload как **триггер**:
  - `point` — разблокировать взаимодействие с mapPoint
  - `bonus` — запустить “бонусное событие” (лут / VN / бой / флаги и т.д.)
- Backend возвращает массив `actions[]` (и при необходимости применяет изменения на стороне сервера).

## 2) Типы QR

### A) Point‑QR (разблокировка точки)

Назначение: “сканирование на объекте → точка становится доступной для взаимодействия”.

Хранение:
- `point_discoveries.researched_at` — факт разблокировки (per‑user / per‑device).
- В `GET /map/points` backend добавляет `point.metadata.isUnlocked` для точек с `metadata.qrRequired === true`.

### B) Bonus‑QR (бонусное событие)

Назначение: “сканирование → выдача наград/запуск VN/бой/другие эффекты”.

Хранение:
- Для одноразовых бонусов используется флаг в прогрессе игрока:  
  `game_progress.flags.qr_bonus_<bonusId>_claimed = true`

Каталог бонусов:
- `server/src/lib/qrBonuses.ts`

## 3) Поддерживаемые форматы QR payload

### Point‑QR

Любой из вариантов:
- JSON: `{"pointId":"old_terminal"}`
- URI:
  - `gw3:point:old_terminal`
  - `point:old_terminal`
  - `map_point:old_terminal`
  - `echo://point/old_terminal`
- URL:
  - `https://example.com/point/old_terminal`
  - `https://example.com/qr/old_terminal`
  - `https://example.com/?pointId=old_terminal`
- MVP fallback: просто `old_terminal`

### Bonus‑QR

- JSON: `{"bonusId":"cache_medical_01"}`
- URI:
  - `gw3:bonus:cache_medical_01`
  - `bonus:cache_medical_01`
  - `qr_bonus:cache_medical_01`
  - `echo://bonus/cache_medical_01`
- URL:
  - `https://example.com/bonus/cache_medical_01`
  - `https://example.com/qr/bonus/cache_medical_01`
  - `https://example.com/?bonusId=cache_medical_01`

Важно: “голая строка” без префикса трактуется как **pointId** (MVP).

## 4) API: `POST /map/activate-qr`

Файл: `server/src/api/routes/map.ts`

### Request

```json
{
  "qrData": "gw3:point:old_terminal",
  "pointId": "old_terminal"
}
```

- `qrData` — строка, считанная сканером (обязательно).
- `pointId` — опционально. Если передан, запрос трактуется как “активация QR для конкретного mapPoint” (удобно для UI на карте).

### Response (пример: point)

```json
{
  "success": true,
  "kind": "point",
  "pointId": "old_terminal",
  "status": "researched",
  "unlockStatus": "researched",
  "actions": [{ "type": "unlock_point", "pointId": "old_terminal" }]
}
```

### Response (пример: bonus)

```json
{
  "success": true,
  "kind": "bonus",
  "bonusId": "cache_medical_01",
  "title": "Медицинский тайник",
  "alreadyClaimed": false,
  "actions": [
    { "type": "notice", "message": "Вы находите тайник с медикаментами." },
    { "type": "grant_items", "items": [{ "itemId": "bandage", "quantity": 2 }] },
    { "type": "grant_xp", "amount": 25 }
  ],
  "awardedItems": [{ "itemId": "bandage", "quantity": 2, "dbId": "..." }]
}
```

## 5) Action‑контракт (что может вернуть сервер)

Реально используется/поддерживается MVP:

- `notice` — показать сообщение
- `unlock_point` — точка считается разблокированной
- `grant_items` — выдать предметы (сервер применяет через `awardItemsToPlayer`)
- `grant_gold` — выдать золото
- `grant_xp` — выдать XP (level‑up через `awardXPAndLevelUp`)
- `add_flags` / `remove_flags` — изменить флаги прогресса
- `grant_reputation` — изменить репутацию фракций
- `start_vn` — перейти в VN‑сцену (клиент делает `navigate`)
- `start_tutorial_battle` — запустить бой‑туториал (клиент делает `navigate`)

Типы/каталог: `server/src/lib/qrBonuses.ts`

## 6) Как включить QR‑гейтинг для mapPoint

На точке должно быть:
- `metadata.qrRequired = true`

Рекомендуется также задать ожидаемый payload, чтобы “просто знать pointId” было недостаточно:
- `map_points.qr_code = "<строка payload из QR>"` (или `metadata.qrCode`)

Если ожидаемый payload не задан, MVP допускает вариант, где QR содержит `pointId` (см. форматы выше).

## 7) Фронтенд: где это используется

- Карта:
  - UI сканера: `src/entities/map-point/ui/QRPointActivation.tsx`
  - Вызов активации: `src/pages/MapPage.tsx` → `client.map['activate-qr'].post({ pointId, qrData })`
  - После успеха: инвалидация `['mapPoints']` и обработка `actions` (VN/бой/обновления инвентаря/прогресса).
- Универсальный сканер:
  - `src/pages/QRScannerPage.tsx` (route: `Routes.QR_SCANNER`)
  - Отправляет только `qrData` и применяет `actions`.

## 8) Как добавить новый Bonus‑QR

1) Открыть `server/src/lib/qrBonuses.ts`
2) Добавить новый `BonusQrDefinition` в `QR_BONUSES`:
   - `id` (используется в QR payload как `gw3:bonus:<id>`)
   - `oneTime` (по умолчанию одноразовый)
   - `outcomes[]` (можно сделать несколько исходов с `weight`)
   - `actions[]` (список эффектов)
3) Если используете `grant_items`:
   - `itemId` должен существовать в шаблонах: `server/src/shared/itemTemplates.ts`

## 9) Рекомендации (MVP → Production)

- Для QR‑гейтинга точек лучше использовать **секретный payload** в `map_points.qr_code` (а не `pointId`), чтобы нельзя было “подставить ID точки” вручную.
- Для бонусов вместо `flags` можно завести отдельную таблицу `qr_claims` (история сканов, cooldowns, аналитика).
- Для боёв/боссов сейчас используется `start_tutorial_battle` как заглушка; позже можно добавить action `start_combat` с созданием battle‑сессии на сервере.

