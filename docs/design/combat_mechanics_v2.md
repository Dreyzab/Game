# Combat Mechanics Design: Hybrid System v3 (Voices Integrated)

This document defines the combat mechanics, fully integrated with the **18 Voices** attribute system (Force, Coordination, Reaction, etc.).

---

## 1. Core Combat Loop & AP Economy

**Cycle**: `Initiative -> Card Selection -> Action -> State Check (Ammo/Jam) -> Effect Resolution`.

- **AP (Action Points)**:
  - **Base AP**: 3 AP per turn (Fixed standard).
  - **Bonuses**: Specific high-tier Perks or **Reaction** threshold (e.g., Lvl 10 Reaction = +1 Max AP) can increase this cap, max 5.
  - **Consumption**: No free actions. Reloading, Swapping, Moving all cost AP.

**Initiative & Turn Order**:
- Determined by `Reaction` + Equipment Weight Penalty.
- High `Reaction` allows "Interrupt" cards (Reaction Fire).

---

## 2. 18 Voices Attribute Mapping

We map classic combat stats to the Project Echo "Voices".

| Voice | Combat Role | Effect Formula (Approx) |
| :--- | :--- | :--- |
| **Coordination** | Accuracy, Crit, Gun Dmg | `HitMod = Coord * 1.0`<br>`CritChance = Base + Coord * 0.3%` |
| **Force** | Melee Dmg, Recoil Control | `MeleeDmg = Base * (1 + Force * 0.02)` |
| **Reaction** | Initiative, Evasion | `Evasion = Reaction * 0.5%`<br>`Initiative = d20 + Reaction` |
| **Perception** | Armor Penetration | `IgnoreArmor% = Perception * 2%` (See Armor Section) |
| **Endurance** | Max HP, Stamina | `MaxHP = Base + Endurance * 2`<br>`MaxStamina = Base + Endurance * 5` |
| **Resilience** | Resistances, Mitigation | `AllResist = Resilience * 1%` |
| **Knowledge** | Tech/Artifact Dmg, Reliability | `ArtifactDmg = Base * (1 + Knowledge * 0.015)`<br>`JamChance -= Knowledge * 0.1%` |
| **Azart (Gambling)**| Crit Multiplier | `CritMult = 1.5 + (Azart * 0.05)` |

---

## 3. Combat Capability Constructor (Card Generation)

`Deck = GenerateCards(Voices, WeaponInstance, AmmoType, Artifacts)`

### A. Weapon Cards (Dynamic Scaling)

**Example: Glock-19 (Tier 1)**
1.  **Quick Shot (1 AP)**:
    - *Condition*: `Ammo > 0`
    - *Cost*: `ceil(AmmoInMag / 2)` Ammo. (Fixes exploit: consumes half mag for burst damage).
    - *Damage*: `BaseDmg * 0.8 * BulletsFired`.
    - *Accuracy*: `-10%` (Fast firing penalty).
    - *Description*: "Unload half the mag in a panic. Inaccurate."
2.  **Aimed Shot (2 AP)**:
    - *Condition*: `Ammo > 0`
    - *Cost*: 1 Ammo.
    - *Damage*: `BaseDmg * (1 + Coordination / 100)`. (Diminishing returns logic applied in code).
    - *Crit*: `Roll(BaseCrit + Coordination * 0.3)`.
    - *Description*: "Precise shot scaling with Coordination."

### B. Hand Limit & Autocards
- **Hand Limit**: 5 Cards.
- **Emergency Reload**:
    - If `Ammo == 0` and `Hand < Limit`: Add `Emergency Reload` to hand.
    - If `Hand >= Limit`: Add `Emergency Reload` to **Top of Deck** (drawn next turn).
    - *Effect*: Restores 50% Mag, Costs 3 AP.

---

## 4. Defense & Armor Mechanics

Dual-layer RNG is standard (Hit -> Penetrate), but we use **Perception** to mitigate the frustration.

**Layer 1: Evasion (Did you hit?)**
- `HitChance = WeaponAcc + Coordination - (TargetEvasion + Cover)`.

**Layer 2: Mitigation (Did it penetrate?)**
- **Armor Class (AC) vs Weapon Penetration**.
- **Perception Bonus**: `EffectiveArmor = TargetArmor * (1 - Perception * 0.02)`.
    - Use Case: A high Perception character "sees the weak spots", effectively ignoring % of armor.

**Block Mechanics**:
- If Armor "Blocks": Damage is reduced by `Reduction%` (not 0).
- **Example**: AC 3 vs Pistol.
    - 60% Chance to Block.
    - Blocked Hit = 30% Damage.
    - Penetrating Hit = 100% Damage.

---

## 5. Resistances & Status Effects

Status effects are gated by **Resilience** and Enemy Types.

| Effect | Description | Resistance Check |
| :--- | :--- | :--- |
| **Bleed** | DoT scaling with Target Max HP | `Roll vs (TargetResilience + BleedResist)` |
| **Stun** | Skip Turn / -AP | `Roll vs (TargetResilience + StunResist)` |
| **Armor Break** | Reduce AC temporarily | Guaranteed on specific Criticals/Ammo |

*Note*: Robots/Undead have `BleedResist: 100%`.

---

## 6. Implementation Strategy

Refactor `cardGenerator.ts` and `types.ts` to support this structure.

### Interfaces
```typescript
interface CombatantVoices {
    coordination: number;
    force: number;
    reaction: number;
    perception: number;
    endurance: number;
    resilience: number;
    knowledge: number;
    azart: number;
}

interface WeaponInstance {
    templateId: string;
    currentAmmo: number;
    ammoType: 'standard' | 'hollow' | 'ap';
    attachments: string[]; 
    condition: number; // 0-100, impacts JamChance
}
```

### Formulas (Diminishing Returns)
For Critical Chance or Damage Scaling, use:
```typescript
function getScalingBonus(statValue: number, factor: number) {
    // Soft cap logic: Linear up to 20, then logarithmic
    if (statValue <= 20) return statValue * factor;
    return (20 * factor) + Math.log10(statValue - 19) * (factor * 5);
}
```

---

## 7. Balance Check

**Scenario**: Player (5 Perception, 20 Coordination) vs Iron-Clad Orc (AC 3).
- **Weapon**: M4A1 (Penetration Tier 2).
- **Armor Interaction**:
    - Base Block Chance for AC3 vs Rifle: 30%.
    - Perception Bonus: Ignores `5 * 2% = 10%` of armor effectiveness.
    - Modified Block Chance: `30% * 0.9 = 27%`.
    - **Result**: Player penetrates more often due to Perception.

**Scenario**: Quick Shot with Glock (10 rounds).
- Cost: 5 Ammo.
- Damage: `Base(10) * 0.8 * 5 = 40`.
- Tradeoff: High Burst, but empties mag immediately. Precision cards unavailable next turn.
