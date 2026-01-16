# Survival: время (06:00→06:00), daily events, взаимодействия локаций (locks)

Документ фиксирует текущую реализацию и описывает дальнейшую работу.

## 1) Цели геймдизайна (как договорились)

- **Владелец времени — сервер**: клиенты не «продвигают» время, а синхронизируются со `session.worldTimeMs`.
- **Каноническое время — лоровое**: `worldTimeMs` хранит **ускоренное** мировое время (lore ms).
- **Сутки**: 06:00 → 06:00 следующего дня.
- **Длительность суток**: **12 минут реального времени**.
- **Ускорение**: \(k = 120\) (1 real ms = 120 lore ms), т.е. 1 реальная секунда = 2 лоровые минуты.
- **Daily события**: гибрид
  - 1 глобальное событие на сессию на сутки (например: торговцы/кризис).
  - локальная активация взаимодействий в локациях, где игроки находятся в момент 06:00.
- **Взаимодействия в локациях**: общие и эксклюзивные (shared_locked)
  - суточные лимиты
  - серверный lock/lease
  - действия выполняются с ETA в лоровом времени

## 2) Что уже сделано (код)

### 2.1 Типы (shared)

Добавлены типы на фронте и на сервере:

- `SurvivalWorldTimeConfig`, `DEFAULT_SURVIVAL_TIME_CONFIG`
- `DailyEventState`, `DailyEventType`
- `ZoneState`, `ZoneActionState`, `ZoneActionLock`, `ZoneActionInProgress`, `ZoneActionId`

Файлы:
- `src/shared/types/survival.ts`
- `server/src/shared/types/survival.ts`

Ключевое: в `SurvivalState` добавлено
- `worldTimeMs: number` — каноническое лоровое время
- `timeConfig?: SurvivalWorldTimeConfig`
- `dailyEvent?: DailyEventState | null`
- `zones?: Record<ZoneType, ZoneState>`

### 2.2 Серверный тайм-движок (ускоренное lore time)

Файл: `server/src/services/survivalService.ts`

Сделано:
- Убрана старая модель «5 минут реала = 1 сутки (1440 минут)» и её распределение минут.
- Добавлен `lastRealTickAt` для корректного `deltaRealMs`.
- Введён расчёт:
  - `state.worldTimeMs += deltaRealMs * timeScale`
  - `state.worldTimeMinutes = floor((worldTimeMs % dayMs) / 60000)`
  - `state.worldDay` вычисляется по переходам через 06:00 (day-start).
- `timerSeconds` теперь означает **реальные секунды до следующего 06:00** (то есть до конца суток/фазы 06:00→06:00).

### 2.3 Daily события (глобальные)

Файл: `server/src/services/survivalService.ts`

Добавлено:
- `state.dailyEvent = rollDailyGlobalEvent(state)` на старте суток.
- `applyDailyEventSideEffects(state)` — MVP эффекты:
  - `crisis` снижает мораль и ставит `crisisLevel = 'crisis'`
  - иначе `crisisLevel = 'calm'`
- `onDayStart(state)` вызывается на фазе `start` (06:00), делает:
  - `resetZonesForNewDay(state)` (сброс суточных лимитов/локов)
  - ролл `dailyEvent`
  - логирование начала дня
  - логирование доступных взаимодействий в тех зонах, где стоят игроки
  - запуск «утренней сводки» (сохранён флейвор + утренние события по зонам)

### 2.4 Zone interactions с эксклюзивным lock/lease и in-progress

Файл: `server/src/services/survivalService.ts`

Механика (MVP):
- `zones[zoneId].actions.scavenge`:
  - `chargesPerDay` / `chargesRemaining` (в `living_room` по умолчанию 0)
  - `lock { lockedByPlayerId, lockExpiresAtWorldTimeMs }` (lease на 10 лоровых минут)
  - `inProgress { startedByPlayerId, completesAtWorldTimeMs }`

Завершение выполняется на серверном тике:
- `processZoneActions(state)` проверяет `worldTimeMs >= completesAtWorldTimeMs` и выдаёт лут.

Лут (MVP):
- зависит от `ZONE_DEFINITIONS[zoneId].primaryLoot`
- выдаётся 1–2 предмета (пример: `canned_food`, `fuel`, `bandage`, `scrap`).

### 2.5 Новый REST endpoint: запуск взаимодействия

Файл: `server/src/api/routes/survival.ts`

Добавлено:
- `POST /survival/sessions/:id/zone-action`
  - body: `{ zoneId: string, actionId: string }`
  - сейчас поддерживается `actionId = "scavenge"`

Сервис:
- `survivalService.startZoneAction(sessionId, playerId, zoneId, actionId)`
  - проверяет, что игрок в зоне, не занят другим, есть charges
  - берёт lock/lease, ставит `inProgress`, уменьшает `chargesRemaining`
  - логирует старт и рассылает `survival_update`

## 3) Инварианты и важные замечания

### 3.1 Время

- `worldTimeMs` — **lore time**, ускоренное относительно реального.
- Клиенты **не должны** использовать `Date.now()` как источник world time. Только значение из сессии/сокета.
- Для UI можно отображать `worldTimeMinutes` (`HH:MM`) и `timerSeconds` (реальный countdown до 06:00).

### 3.2 Locks

- Lock — lease-образный. Если клиент упал, lock истечёт и освобождается.
- В будущем надо:
  - продлевать lease при активности,
  - добавить «cancel»/«abandon» по желанию.

### 3.3 В данный момент состояние сессий — in-memory

`sessions` в `survivalService` — `Map<string, SurvivalState>` (без персистенции).
Для реального мультиплеера понадобится:
- восстановление после рестарта (DB или Redis),
- корректная «истина» по времени при рестарте (epoch + offset или stored worldTimeMs + lastRealTickAt).

## 4) Дальнейшая работа (пошагово)

Ниже — рекомендуемый порядок, чтобы не расползлось.

### 4.1 Backend: стабилизация времени

- **Сделать `worldTimeMs` обязательным** в `SurvivalState` (убрать optional-совместимость, когда накатим миграцию in-memory формата).
- Добавить событие сокета/пэйлоад в `SurvivalSocketEvents` для `worldTimeMs` (сейчас в `survival_timer_sync` его нет).
- Добавить тест на «сутки = 12 минут реала»:
  - симулировать `deltaRealMs` и проверять переход 06:00→06:00.

### 4.2 Backend: DailyEvent как полноценная система

Сейчас daily event — только состояние + базовые эффекты. Дальше нужно:
- Перевести daily event в **интерактив**:
  - `DailyEventState` + набор `options` (как у `SurvivalEvent`) или ссылка на `SurvivalEvent` с тегом `daily`.
  - эндпоинт `POST /sessions/:id/daily/resolve` (или reuse `/resolve`).
- Для `traders_arrived`:
  - завести «магазин» (ассортимент, цены, скидки по роли `face`).
  - эндпоинт на покупку/продажу.
- Для `crisis`:
  - минимум 2–3 варианта реакции, влияющие на `resources`/`morale`/`defense`.

### 4.3 Backend: Zone interactions как расширяемая система

Сейчас есть `scavenge`. Дальше:
- Добавить `repair`/`heal`/`trade` как `ZoneActionId` (зависят от `ZoneType` и/или `dailyEvent`).
- Ввести «доступность действий»:
  - `getAvailableZoneActions(session, player)` → список (с ETA, lock status, charges).
- Добавить «очередь» или «совместные эффекты» (если нужно), но это позже.

### 4.4 Frontend (datapad): показать daily и взаимодействия

Файлы:
- `src/pages/SurvivalPlayerPage.tsx`
- `src/features/survival-datapad/ui/screens/StandbyScreen.tsx`
- `src/features/survival-datapad/ui/screens/EncounterScreen.tsx`

Сделать:
- В `StandbyScreen` вывести:
  - `timerSeconds` как «до 06:00 осталось …»
  - `dailyEvent` (title/desc) если есть
  - текущую зону `player.currentZone` + список доступных взаимодействий
- Добавить кнопку «ОБЫСК» если:
  - игрок в зоне
  - `zones[zoneId].actions.scavenge.chargesRemaining > 0`
  - lock свободен или принадлежит игроку
  - нет `inProgress` у другого
- При нажатии вызывать `POST /survival/sessions/:id/zone-action` и показывать прогресс/ETA.
- В UI отобразить «занято другим игроком» и таймер аренды (опционально).

### 4.5 Интеграция с hex-картой, выносливостью и временем перемещения

Сейчас hex-карта (`src/features/survival-hex-map/*`) живёт отдельно от серверной сессии.
Дальше рекомендуемый путь:

1) Ввести в `SurvivalPlayer` серверную позицию на hex-карте (например `hexPos: {q,r}`) и состояние движения:
   - `isMoving`, `movePath`, `arriveAtWorldTimeMs`, `stamina`.
2) Перенести движение в сервер:
   - клиент отправляет команду «двигайся в гекс X»
   - сервер считает путь/скорость/ETA в `worldTimeMs`
   - сервер двигает игрока по arrival-таймам, обновляет разведку/открытие
3) На клиенте `SurvivalMapbox` отображает позицию и прогресс по `worldTimeMs`.

Отдельно (важно):
- `stepMeters` на карте выводим из геометрии: `stepMeters = sqrt(3) * GEO_HEX_SIZE_METERS` (в рамках текущих формул `hexToPixel`/`hexToGeo`).
- Скорость и расход выносливости считаем в **лоровом времени** (м/лоро-мин), как договорились.

### 4.6 Технический долг / баги (карта)

- В `src/features/survival-hex-map/ui/SurvivalMapbox.tsx` есть риск рассинхрона id слоёв для кликов (`HEX_FILL` vs `'hex-fill'`). Это нужно унифицировать перед интеграцией с серверной логикой.

## 5) Быстрый чек-лист “готово для демо”

- Сервер: сутки 12 минут реала, 06:00 триггерит day-start, генерируется daily event, сбрасываются действия зон.
- Игроки в зонах получают активные взаимодействия.
- `zone-action` можно запустить, действие лочится, завершается по `worldTimeMs`, выдаёт лут.
- Клиент показывает countdown до 06:00, current day/time и статус daily event.

