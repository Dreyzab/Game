# Implementation Plan - Detective Card Battles

To support the "Interrogation" mechanic in Detective Mode, we will introduce a non-lethal card deck focused on "Mental Pressure" rather than physical damage.

## Goal
Enable "Social Combat" where the Detective fights suspects (Smugglers, Corps Students) using Logic, Rhetoric, and Evidence instead of guns.

## Proposed Changes

### 1. Define Detective Cards
Create `src/features/detective/combat/cards.ts`:
- **Logic Trap**: Deals "Mental Damage" (mapped to Stun/Morale).
- **Present Evidence**: High damage, costs Evidence points (mocked).
- **Intimidate**: Debuff enemy morale.
- **De-escalate**: Restore player stamina/composure.

### 2. Detective Deck Generator
Create `src/features/detective/combat/deck.ts`:
- `generateDetectiveDeck()`: Returns a fixed deck of these new cards, ignoring current physical equipment.

### 3. Battle Integration
- **Hook**: In `case1.ts` (Act 2), add a choice to "Interrogate" which triggers a battle.
- **Execution**: The battle system needs to accept a custom deck. We might need to wrap `useDreyzabBattle` or pass a `customDeck` parameter if supported. *Note: Current system might imply equipment-based. We will patch `generateDeckFromEquipment` or create a wrapper.*

> [!NOTE] 
> For the Vertical Slice, we will inject the detective deck by temporarily mocking the player's equipment or intercepting the battle initialization.

## Verification Plan

### Automated Tests
- `npm test src/features/detective/combat/cards.test.ts` (New test for card generation)

### Manual Verification
1.  **Navigate** to Act 2 (Smugglers).
2.  **Choose** "Press for details [Interrogation]".
3.  **Verify** Battle starts.
4.  **Verify** Hand contains "Logic Trap", "Intimidate", etc.
5.  **Verify** "Victory" leads back to the VN flow.
