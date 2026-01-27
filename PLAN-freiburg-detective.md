# Plan: Detective Mode & Freiburg 1905 Pack (v3)

> **Goal**: Implement a modular "Detective Mode" where the Core System (mechanics) is separated from the Content Pack (Freiburg 1905, later Karlsruhe).
> **Key mechanics**: Hardlinks (QR = Reality), Map as Investigation Tool, Dossier-based deduction.

## 1. Architecture: Core vs. Pack

### 1.1 Detective Core (Reusable System)
*   **Game Mode Isolation**: Separation of Inventory (Evidence/Tools vs. Scrap/Weapons), Skills (Methods vs. Stats), and Reputation (Faction trust).
*   **Systems**:
    *   **Dossier UI**: Unlocks clues/profiles, distinct from standard quest log.
    *   **Deduction Board**: Logic layer connecting Evidence + Hypotheses.
    *   **Hardlink Resolver**: Handles QR payloads `gw3:hardlink:{pack}:{id}` -> Actions.
    *   **Investigation Clock**: Abstract time tracking (Heat/Deadlines).

### 1.2 Freiburg 1905 Pack (Content Layer)
*   **Region Config**: `FREIBURG_1905` (Vintage Mapbox Style).
*   **Districts**: Altstadt, Schneckenvorstadt, Wiehre, Stühlinger (with risk/classBias params).
*   **Factions**: Police, Corps, Underworld, Banks, Socialists.
*   **Case #1 "Haus Kapferer"**: Full narrative arc (Station -> Crime Scene -> Vectors -> Resolution).

## 2. Hardlink Contract (QR)
> **Principle**: Hardlink is the source of truth, bypassing GPS drift.

### 2.1 Payload Format
```
gw3:hardlink:fbg1905:HBH_ENTRY_01
gw3:hardlink:fbg1905:KAPFERER_GATE_02
```

### 2.2 Resolver Actions (Client Sim -> Server)
*   `start_vn`: Trigger specific dialogue/interrogation.
*   `add_flags`: Update investigation state.
*   `grant_evidence`: Add item to specific Detective Inventory.
*   `unlock_point`: Reveal map location.
*   `grant_reputation`: Affect faction standing.

### 2.3 Fallback & Logic
*   **Remote Play**: "Police Line Inquiry" option allows triggering a hardlink remotely but with penalties (Cost/Reputation/Time).
*   **Skill Gates**: High "Logic" or "Empathy" reveals extra layers (hidden narrative) but does not block critical path.

## 3. Implementation Steps (Epics)

### Epic A: Core Foundation & Isolation
*   [ ] **Model**: Add `gameMode` to `UserProfile`.
*   [ ] **Isolation**: Ensure `useInventory` and `useSkills` switch context based on mode.
*   [ ] **Menu**: Add "Detective Mode" entry point.
*   **DoD**: Starting Detective Mode gives empty detective inventory, distinct skills, and 0 rep with new factions.

### Epic B: Freiburg 1905 Map & Districts
*   [ ] **Region**: Define `FREIBURG_1905` in `regions.ts`.
*   [ ] **Map Style**: Integrate vintage Mapbox overlay.
*   [ ] **Districts**: Define polygons/zones for the 4 key districts with metadata (Risk/Bias).
*   **DoD**: Player sees vintage map, entering Schneckenvorstadt shows distinct UI indicator.

### Epic C: Hardlink Resolver (Client Sim)
*   [ ] **Resolver**: Create `HardlinkService` to parse `gw3:hardlink:...`.
*   [ ] **Table**: Mock hardlink table for Case #1.
*   [ ] **UI**: "Scanner" interface (Simulated for desktop).
*   **DoD**: Entering `gw3:hardlink:fbg1905:TEST` triggers a specific VN scene.

### Epic D: Investigation UI (Dossier & Board)
*   [ ] **Dossier**: UI component for "Operational File" (Profiles/Lore).
*   [ ] **Evidence**: Item type `evidence` with tags (Source, Reliability).
*   [ ] **Board**: Simple UI to view collected Clues vs Hypotheses.
*   **DoD**: Finding a clue adds it to Board; clicking Clue opens details.

### Epic E: Case #1 "Haus Kapferer" (Vertical Slice)
*   [ ] **Act 0**: Station Arrival (Tutorial).
*   [ ] **Act 1**: Crime Scene (Haus Kapferer) - Inspection scenes.
*   [ ] **Act 2**: 3 Vectors (Construction, Smugglers, Corps).
*   [ ] **Act 3**: Resolution & Newspaper Epilogue.
*   **DoD**: Playable end-to-end.

### Epic F: Card Battles (Climax)
*   [ ] **Integration**: Trigger card battle from VN scene.
*   [ ] **Context**: Non-lethal decks (Interrogation/Chase).
*   **DoD**: Winning/Losing a "debate" branches the story correctly.

## 4. Verification Checklist
- [ ] **Mode Switch**: Clean separation from Survival.
- [ ] **Hardlink**: QR codes trigger correct actions (Simulated).
- [ ] **Map**: Vintage style acts as navigation layer.
- [ ] **Case Flow**: All 3 vectors in Case #1 are explorable.
- [ ] **Language**: RU/DE toggles correctly for text content.
