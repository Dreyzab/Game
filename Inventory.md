# Inventory: Roadmap & Status

## 1. Reference Material

- `inventory_system.md` – full architecture, data contracts, integrations.
- `inventory_ui_ux.md` – UI/UX inspirations (Tarkov, Disco Elysium, BG3).
- `integration_checklist.md` – combat / stats / quest touchpoints.
- `quick_start_testing.md` – “Hello World” bootstrap for the feature.

## 2. Milestones

- [x] **Stage 0 · Hello World**
  - Minimal `useInventoryStore` on Zustand.
  - Button on `InventoryPage` that spawns a test item.
  - Simple card list output (no grid logic).
- [x] **Stage 1 · Domain Types**
  - `src/entities/item/model/types.ts` with `Item`, `ItemState`, `EquipmentSlots`, `MasteryCard`, etc.
  - Shared rarity/slot/item kind enums.
- [ ] **Stage 2 · Store v1**
  - Extend store with `containers`, `encumbrance`, `masteries`, UI state.
  - Basic serialization (local only, no Convex yet).
- [x] **Stage 3 · UI v1 (Desktop + Mobile)**
  - `InventoryGrid`: 6×10 grid, occupied cell highlight, hover tooltip skeleton. _(done)_
  - `EquipmentSlots`: primary/secondary/melee/helmet/armor/clothes/backpack/rig/artifacts/quick. _(done)_
  - `QuickAccessBar`: horizontal five-slot ribbon. _(done)_
  - Aside panel “Item Details” with stats + placeholder action buttons. _(done)_
  - Responsive layout: ≥1024px → inventory + sidebar, <1024px → tabbed switcher. _(done)_
  - **Follow-up tasks**:
    - [x] Drag&drop placeholder overlay & hover tooltip skeleton.
    - [x] Keyboard navigation for grid (arrows to move selection).
    - [ ] Animated transitions when equipping / moving items.
- [ ] **Stage 4 · Integrations**
  - Mastery cards auto-load when equipping weapons. _(done)_
  - Player stats recompute from equipment. _(done)_
  - Quest item protection rules. _(done)_
  - **Follow-up tasks**:
    - Hook to emit inventory events to combat / quest systems.
    - Convex mutation skeleton for syncing equipment changes.
- [ ] **Stage 5 · Convex + Outbox**
  - Sync inventory between devices (Convex mutations/queries).
  - Offline-first via inventory outbox queue.
  - **Follow-up tasks**:
    - Schema for inventory collections in Convex (items, containers).
    - Conflict resolution strategy (server wins vs tombstones).

## 3. Status Checklist

- [x] Inventory page reads from `useInventoryStore`.
- [x] Domain model extracted into `src/entities/item/model/types.ts`.
- [x] UI MVP components (InventoryGrid + EquipmentSlots + QuickAccessBar) wired up (desktop layout + mobile tabs + ItemDetails panel).
- [ ] Store persists equipment/containers/encumbrance/masteries + UI state.
