# Plan: Prologue Combat Refactor

## Goal Description
Conduct a thorough refactoring of the prologue combat system to address balance issues and technical debt.
1.  **Mechanic Fix:** Enable targeted ally healing (requested for Lena). Currently, the engine only supports Self-Heal for `VOICE` cards.
2.  **Architectural Cleanup:** Extract prologue-specific logic from generic files into a dedicated module to prevent bloating `scenarios.ts` and `constants.ts`.
3.  **Balance Overhaul:**
    -   Switch Tutorial enemies to new `Tutorial Scavenger` (Low HP).
    -   Adjust Boss `Executioner` stats (Reduced Evasion/HP) for a fairer 4vs1 fight.

## User Review Required
> [!IMPORTANT]
> **Engine Change:** I will modify `src/features/dreyzab-combat-simulator/model/useDreyzabBattle.ts` to introduce a new target type `{ type: 'ally', unitId: string }`. This is a core engine change to support support-class characters.

## Proposed Changes

### 1. Engine & Types (`src/entities/dreyzab-combat-simulator`)
#### [MODIFY] [types.ts](file:///f:/proje/grezwanderer3/src/entities/dreyzab-combat-simulator/model/types.ts)
-   Update `CardPlayTarget` to include `| { type: 'unit'; unitId: string }`.
-   Update `CombatCard` type to include `targetAllies?: boolean` (flag to explicitly allow ally targeting).

#### [MODIFY] [useDreyzabBattle.ts](file:///f:/proje/grezwanderer3/src/features/dreyzab-combat-simulator/model/useDreyzabBattle.ts)
-   **Update `playCard` action:**
    -   Map incoming `unit` targets.
    -   **Validation:** If card requires `unit` target, ensure `target.type === 'unit'`.
-   **Update `PLAY_CARD` reducer:**
    -   Validate target team:  If `targetAllies` is true, target must be Ally (or Self). If false/undefined, target must be Enemy.
    -   Implement specific effect application for `unit` targets (bypassing rank logic for direct heals).

#### [MODIFY] [DreyzabBattle.tsx](file:///f:/proje/grezwanderer3/src/features/dreyzab-combat-simulator/ui/DreyzabBattle.tsx)
-   **Drop Validation:** Update `BattleDropZone` to check `card.targetAllies` against `unit.side`.
    -   If `card.targetAllies` and `unit.side === Side.PLAYER`, allow drop.
    -   If `!card.targetAllies` (Attack) and `unit.side === Side.ENEMY`, allow drop.

### 2. Prologue Module Separation
#### [NEW] [prologueEncounters.ts](file:///f:/proje/grezwanderer3/src/entities/dreyzab-combat-simulator/scenarios/prologue.ts)
-   Move `boss_train_prologue` and `prologue_tutorial_1` logic here.
-   Define `TutorialScavenger` (20 HP, Low Armor).
-   Define `ExecutionerBoss` (250 HP, 10 Initiative).

#### [MODIFY] [scenarios.ts](file:///f:/proje/grezwanderer3/src/entities/dreyzab-combat-simulator/model/scenarios.ts)
-   Import scenarios from `prologueEncounters.ts` and map them in `SCENARIOS`.
-   Remove hardcoded prologue logic to clean up the file.

### 3. Data & Cards
#### [MODIFY] [constants.ts](file:///f:/proje/grezwanderer3/src/entities/dreyzab-combat-simulator/model/constants.ts)
-   Update `npc_lena`'s `field_medkit` card:
    -   `targetRanks`: `[1, 2, 3, 4]` (To allow valid clicking on any rank).
    -   `targetAllies`: `true` (Enable new logic).
    -   `targetSelf`: `true` (Explicitly allow self).

## Verification Plan

### Automated/Code Verification
-   **Engine Type Check:** Ensure `CardPlayTarget` update doesn't break existing `move` logic (which uses `player-rank`).

### Manual Verification
1.  **Tutorial Balance:**
    -   Play through `prologue_tutorial_1`.
    -   Verify Enemies have ~20 HP (not 45).
2.  **Healing Mechanic:**
    -   Play `boss_train_prologue`.
    -   Wait for an ally (e.g. Conductor) to take damage.
    -   Select Lena's "Field Medkit".
    -   **Verify:** Can click on Conductor's unit frame to target him? (If UI support is missing, verify at least I can enable the data for it, UI might be a separate task if `DreyzabBattle.tsx` needs click handlers updated).
    -   **Assumption:** The UI uses generic "valid target" highlighting. I need to check if `DreyzabBattle.tsx` allows clicking allies for cards. *Self-correction: I will assume basic click handling exists or add a basic check.*
