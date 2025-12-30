# Резонанс — кооперативный квест (синтез спецификации)

## Ключевые механики
- Архетипы: Скептик, Эмпат, Защитник, Визионер. Ранги 1–4 с позиционным градиентом эффективности (оптимум даёт +3, иначе штраф по разнице).
- Метрики: Strain (напряжение), Trust (доверие), Alert (тревога), Conviction (прерывания), Social HP/Composure.
- Голосования: взвешенные по архетипам; при низком Trust можно включать скрытые. Прерывание (Rebellion) форсирует опцию, тратит Conviction и даёт Strain +10.
- Safety: Brake (пауза таймеров), Kudos (пост-сцена).
- Инъекции (приватные тексты) по архетипу; флаги от проверок и инъекций влияют на ветки.

## Техническая архитектура
- Backend: Bun + Elysia + Drizzle (PostgreSQL).
- Routes: `/resonance/sessions` (create/join/state/vote/check/item-use/interrupt/brake/kudos/advance/proxemic).
- In-memory FSM с best-effort персистом в Postgres; сессия хранит `dbId`.

## База данных (резонанс)
- `resonance_sessions(id, code, episode_id, scene_id, status, strain, trust, alert, brake, created_at, updated_at)`
- `resonance_players(id, session_id, user_id, device_id, name, archetype, rank, conviction, is_host, statuses, joined_at, updated_at)`
- `resonance_scenes(id, episode_id, scene_key, type, config)`
- `resonance_votes, resonance_interrupts, resonance_strain_log, resonance_proxemic_log, resonance_kudos`
- `resonance_items(id, name, slot, charges, cooldown_scenes, data)`
- `resonance_player_items(session_id, player_id, item_id, state)` upsert по (session, player, item)
- `resonance_checks_log` (skill/DC/roll/result/deltas), `resonance_item_uses`

## FSM и данные сцен (Episode `divergent_realities`)
- Сцены: briefing → entry_vote → hard_landing → statue_decision → golem_combat → aftermath → parley → debrief → complete.
- Каждая сцена/опция: `checks[{skill, dc, positionOptimum, onSuccess/onFail (trustDelta/strainDelta/alertDelta/grantFlag/statusAdd)}]`, `rewards{items, flagsAdd/Remove, trust/strain/alert, cooldownReset}`.
- Alert: боевые +1, parley +1, complete -1; дельты из наград/проверок.
- Strain/Trust/Alert применяются на сервере при выборе и при входе в сцену.

## Предметы и кулдауны
- Формат предмета у игрока: `{ id, charges?, data? { cooldown? } }`.
- `useItem`: ошибки NO_CHARGES/COOLDOWN; списывает заряд, ставит `cooldown = cooldownScenes`, пишет в `resonance_item_uses` и `resonance_player_items`.
- Кулдауны тикают при каждом переходе сцены; `cooldownReset` в наградах сбрасывает.
- Словарь (пример): `insight_lens_t1` (+Insight, 2 заряда, КД 1), `data_copy`, `bonus_pay`.

## Клиент (React/TS/Tailwind)
- HostPanel: создание/брейк/форс-сцена, отображение Strain/Trust/Alert, список игроков.
- PlayerPanel: инъекции, статусы, Strain/Trust/Alert, инвентарь с КД/зарядами, голосования, прерывания, Brake, ошибки useItem.

## API полезные тела
- Vote: `{ optionId }`
- Check: `{ skill, dc, positionOptimum?, onSuccess?, onFail? }`
- Item use: `{ itemId, targetPlayerId?, context? }` → в ответе `error` может быть `COOLDOWN/NO_CHARGES/ITEM_NOT_FOUND`.
- Interrupt: `{ type: 'rebellion'|'force_next'|'brake', targetOptionId? }`

## Следующие шаги (рекомендации)
- Валидация кулдаунов/зарядов на клиенте с показом сообщения из ответа.
- Визуализация alert/trust/strain на Host/Player (цветовые зоны).
- Seed предметов в БД, хранение сценариев в JSON/таблице `resonance_scenes`.
- Авто-рестарт/очистка сессии, реконнект по code/deviceId.

## Нарративные штрихи по сценам
- Briefing: инъекции вскрывают ложь про «40 мин», страх Хольца, ранения; Perception check (DC 11) даёт флаг «кто-то подслушивает».
- Entry_vote: Storm (Alert+2, быстрый вход), Stealth (DC 12, шанс Alert+1), Lenses (Alert+1) — влияет на подготовку перед посадкой.
- Hard_landing: фиксированный Strain+2, статус disoriented у медика.
- Statue_decision: Authority/Insight проверки (оптимум ранги 1/3) — либо тревога растёт, либо сюрприз-раунд.
- Golem_combat: Authority/Insight/Empathy проверки с позиционными бонусами снижают Strain/Alert или накидывают их при провале.
- Aftermath: выбор судьбы данных — `data_copy` или флаги `sanitized`/чистый отчёт; Trust/Strain корректируются.
- Parley: базово Alert+1; Fight/Peace/Wait с проверками/дельтами, флаг `lever_spotted` раскрывает ловушку.
- Debrief: Truth/Blackmail/Report — финальные Trust/Strain, лут `bonus_pay` за шантаж, проверка Rhetoric.
