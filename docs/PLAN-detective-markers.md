# Plan: Detective Markers & Interactions (A+)

> **Goal**: Implement a "Fog of War" map style for Detective Mode where markers act as narrative anchors.
> **Style**: Option A+ (Narrative First + Light Simulation) -> Minimalist map, specific active leads, 1-2 functional city locations.

---

## 1. Marker Types & Logic

### 1.1 The Bureau (Base)
*   **Role**: The safe haven and central hub.
*   **Behavior**: Always visible.
*   **Interactions**:
    *   `Review Dossier`: Open the Notebook (already implemented).
    *   `Rest`: (Future) Advance time/heal.
*   **Visuals**: House/Shield icon, distinct "Home" color (Gold/Warm).

### 1.2 Crime Scenes / Leads (Active)
*   **Role**: The current objective.
*   **Behavior**: Hidden until triggered by a Clue (Hardlink/VN).
*   **Interactions**:
    *   `Investigate`: Triggers a specific VN Scene.
    *   State Change: Active (Pulsing) -> Cleared (Greyed out) after investigation.
*   **Visuals**: Dark/High-Contrast contour, "Pulse" animation effect.

### 1.3 Witnesses / Informants (NPCs)
*   **Role**: Narrative information sources.
*   **Behavior**: Appear based on plot triggers.
*   **Interactions**:
    *   `Interrogate`: Triggers a dialogue (VN).
    *   Outcomes: New Dossier Entry, potentially new Lead.
*   **Visuals**: Neutral icon (Eye/Silhouette), "Suspicion" indicator if hostile.

### 1.4 Support Locations (City Feel)
*   **Role**: Functional spots to make the city feel alive.
*   **Behavior**: Always "Discovered" (visible but not active) to avoid player confusion.
*   **Selections**: Archive, Pub.
*   **Visuals**: Calm, desaturated icons.

---

## 2. Marker States & Transitions

| State | Visibility | Visual Style | Interaction | Transition Source |
|-------|------------|--------------|-------------|-------------------|
| **Locked** | Hidden | None | None | Initial State |
| **Discovered** | Visible | Normal / Sepia | Tooltip: "Details" | `Hardlink` / `unlock_point` |
| **Active** | Visible | Pulsing / Highlight | Button: "INVESTIGATE" | VN Scene Start |
| **Cleared** | Visible | Faded / Grey | Button: "REVIEW" | VN Scene Complete |

### 2.1 Bureau Special Logic
*   **State**: Always "Discovered" (Anchor).
*   **Style**: Distinct "Home" icon. No pulsing (unless critical defense event).
*   **Tooltip**: "BUREAU" -> Button: "OPEN DOSSIER".

---

## 3. Implementation Steps

### Epic A: Marker Data Structure
*   [ ] **Type Definition**: Update `DetectivePoint` with `type` and `state`.
*   [ ] **Store Update**: Update `DossierStore` to handle specific state transitions.

### Epic B: Marker Rendering (Map)
*   [ ] **Player Marker**: `DetectiveMarker.tsx` stays as the **Player** pawn.
*   [ ] **Point Markers**: Modify `MapMarkers.tsx` (or created `DetectivePointMarker.tsx`) to render detective points.
*   [ ] **Visuals**:
    *   Bureau: Shield/House.
    *   Crime: High-contrast + Pulse animation.
    *   NPC: Silhouette/Eye.
    *   Support: Book (Archive), Mug (Pub).

### Epic C: Interaction Logic
*   [ ] **Popups**: Implement context-aware buttons:
    *   Crime: "ОСМОТРЕТЬ" (Investigate)
    *   NPC: "ДОПРОСИТЬ" (Interrogate)
    *   Support: "ПОСЕТИТЬ" (Visit)
*   [ ] **Navigation**: "Investigate" -> Triggers associated Scene/Activity.

### Epic D: Integration (Case #1 Canon)
*   [ ] **Progression**:
    1.  **Bureau**: Always Visible.
    2.  **Station**: Starts `Discovered`, becomes `Cleared` after Briefing.
    3.  **Bank**: Becomes `Active` after Briefing.
    4.  **Pub/Archive**: Become `Discovered` after Bank investigation.
    5.  **Warehouse**: Becomes `Active` after Archive/Pub clues.

---

## 4. Verification Checklist
- [ ] **Bureau**: Is always visible and opens Dossier.
- [ ] **Fog of War**: Map is empty initially (except Bureau).
- [ ] **Discovery**: Reading the "Briefing" spawns the "Bank" marker.
- [ ] **Active State**: The "Bank" marker pulses.
- [ ] **Investigation**: Clicking "Investigate" on Bank opens the VN scene.
- [ ] **Clear**: Finishing the Bank scene turns the marker grey.
