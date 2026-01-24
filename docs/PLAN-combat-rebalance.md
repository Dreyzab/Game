# Plan: Combat Rebalance & Fixes (Prologue)

## Goal Description
Improve the pacing and balance of the prologue combat encounters based on user feedback.
1.  **Tutorial Battle:** Reduce enemy durability to prevent the fight from dragging on, given the limited player deck (2 attacks, 2 moves).
2.  **Boss Battle:** Balance the "Executioner" fight:
    *   Enable Lena (Medic) to heal allies (currently self-heal only).
    *   Slightly reduce Boss HP (from 300 to 250).
    *   Reduce Boss evasion (currently too high for Conductor's attacks).

## User Review Required
> [!IMPORTANT]
> **Lena's Healing:** I will modify `NPC_CARDS` specifically for Lena to include a targetable healing ability. This will replace her current non-functional or self-only behavior.

> [!NOTE]
> **Tutorial Balance:** I am introducing a new "Weakened Scavenger" template explicitly for the tutorial to ensure a smooth onboarding experience without affecting difficulty elsewhere.

## Proposed Changes

### Component: Combat Data (`src/entities/dreyzab-combat-simulator/model`)

#### [MODIFY] [constants.ts](file:///f:/proje/grezwanderer3/src/entities/dreyzab-combat-simulator/model/constants.ts)
1.  **Update `NPC_CARDS`**:
    *   Modify `lena_medkit` to include `effects: [{ type: 'heal', value: 25 }]` and `targetRanks: [1, 2, 3, 4]` (to allow targeting allies).
    *   Ensure `targetSelf` is NOT set to `true`.
2.  **Update `ENEMY_TEMPLATES`**:
    *   Add a new template `Tutorial Scavenger` (Index 0 or new index) with **20 HP** (down from 45) and lower Defense.
    *   (Optional) Adjust `Mutant Marauder` if it's too tanky generally, but creating a specific tutorial variant is safer.

#### [MODIFY] [scenarios.ts](file:///f:/proje/grezwanderer3/src/entities/dreyzab-combat-simulator/model/scenarios.ts)
1.  **Update `prologue_tutorial_1`**:
    *   Switch enemies to use the new `Tutorial Scavenger` template (or reduced ranks).
    *   Ensure enemies match the narrative "Scout" description but are mechanically weaker.
2.  **Update `boss_train_prologue`**:
    *   **Boss HP:** Change `createBoss` call from `300` to `250`.
    *   **Boss Evasion:** Explicitly set `initiative` to `10` (down from `20`) or reduce `armor` slightly to improve hit rates.

## Verification Plan

### Manual Verification
1.  **Run Tutorial Battle:**
    *   Start game, skip to/select `prologue_start`.
    *   Reach the first battle `prologue_tutorial_1`.
    *   **Verify:** Enemies die in 2-3 hits max? Player cards are sufficient?
2.  **Run Boss Battle:**
    *   Skip to `boss_train_prologue` (can use `prologue_otto_warning`).
    *   **Verify:** Boss HP is 250.
    *   **Verify:** Lena has "Field Medkit" card. Select it -> Verify distinct allies are selectable (not just self).
    *   **Verify:** Healing actually restores Ally HP.
    *   **Verify:** Conductor hits the boss more often (lower evasion/initiative).
