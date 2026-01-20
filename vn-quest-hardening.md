# VN Commit Hardening + QuestDTO/UI

## Goal
Harden VN commit flow with strict session validation and idempotency, and unify quest contract/UI around shared QuestDTO with consistent statuses.

## Tasks
- [x] Add stateVersion to game progress and enforce session-based mutation lock in `/vn/commit` -> Verify: commit rejects stale stateVersion and increments on success.
- [x] Enforce strict session requirements and idempotency in VN commit (token + nonce + session) -> Verify: missing token returns 400; duplicate nonce returns cached result.
- [x] Align questCommands contract (progress delta vs absolute) and persist decisionLog -> Verify: quest command updates behave deterministically and logs include decisionLog.
- [x] Unify QuestDTO/statuses and normalize `/quests` response shape without N+1 -> Verify: `/quests` returns consistent fields and no per-row lookup.
- [x] Align QuestTracker + ActiveQuestsWidget with shared quest card UI and status semantics -> Verify: both widgets render identical quest items.
- [x] Update VN immediate quest effects to call `/quests` (hybrid flow) -> Verify: start/progress/complete actions trigger server updates.

## Done When
- [x] VN commit is strict, idempotent, and stateVersion-locked.
- [x] QuestDTO is shared and UI widgets are visually consistent.
- [x] `/quests` response uses unified shape and avoids N+1 queries.

## Notes
- Strict `/vn/commit` may require client session-start integration.
- Quest statuses: `active` | `completed` | `abandoned` | `failed`.
