# Walkthrough: Freiburg 1905 Detective Mode

> **Status**: Core Systems Implemented (v3 Vertical Slice)
> **Mode**: Detective (Selected via Main Menu)

## 🕵️ Feature Overview

We have successfully implemented the foundation for the "Detective Mode" separate from the Survival game loop.

### 1. Game Mode & Isolation
- **Entry Point**: New "Archiv: Freiburg 1905" panel on the Home Page.
- **State Isolation**: `useInventoryStore` manages separate state for `detective` mode (items, equipment, containers are swapped).
- **Persistence**: Player GameMode is tracked in `PlayerProgress`.

### 2. Vintage Map (Freiburg 1905)
- **Visual Style**: When in Detective Mode, the map applies a "Vintage Sepia" filter with paper texture overlay.
- **Region**: Defined `FREIBURG_1905` config with 4 districts:
    - *Altstadt* (Elite)
    - *Schneckenvorstadt* (Underworld)
    - *Wiehre* (Bourgeois)
    - *Stühlinger* (Workers)

### 3. Hardlink Resolver (QR Simulation)
- **Resolver**: `src/features/detective/hardlinks.ts` simulates physical QR codes.
- **Scanner**: The QR Scanner page intercepts scans in Detective Mode.
- **Test Links**:
    - `gw3:hardlink:fbg1905:HBH_ENTRY_01` -> Station Arrival Scene
    - `gw3:hardlink:fbg1905:KAPFERER_GATE_02` -> Crime Scene & Clue

### 4. Operational Dossier (UI)
- **New Interface**: A "Case File" UI accessible from the Map.
- **Features**:
    - **Files Tab**: View unlocked profiles and lore documents.
    - **Board Tab**: View collected Evidence (e.g. Broken Lock).
    - **State**: Managed via `useDossierStore`.

### 5. Case #1: "Haus Kapferer" (Vertical Slice)
- **Act 0**: Station Arrival scenario implemented.
- **Act 1**: Haus Kapferer Crime Scene implemented.
- **Flow**: Arrival -> Scan QR at Bank -> Inspect Gate -> Collect Evidence ("Broken Lock").

## 📸 Usage Guide

1.  **Start Investigation**: Go to Home Page -> Click "Open Case File" (Detective Mode).
2.  **View Map**: Observe the vintage style overlay.
3.  **Open Dossier**: Click the "Case File" button on the map (top-left) to review initial intel ("Saccharin War").
4.  **Simulate QR**:
    - Go to QR Scanner / Simulator.
    - Scan/Simulate `gw3:hardlink:fbg1905:HBH_ENTRY_01`.
    - Experience the intro VN scene.

## 🛠️ Technical Components
- `src/features/detective/hardlinks.ts`: Resolver logic.
- `src/features/detective/dossier/Dossier.tsx`: UI Component.
- `src/entities/inventory/model/store.ts`: State management.
- `src/widgets/map/map-view/MapView.tsx`: Style overrides.
- `src/entities/visual-novel/scenarios/detective/case1.ts`: Narrative content.
