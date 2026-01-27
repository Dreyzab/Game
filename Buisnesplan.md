# Business Plan: Grenzwanderer3

> **Version:** 1.1 (Draft)
> **Date:** January 2026
> **Status:** Alpha Stage v0.3.1 (Stable Build)

---

## 1. Executive Summary

**Grenzwanderer3 (GW3)** is a **Post-Apocalyptic Location-Based RPG** that bridges the digital and physical worlds. Unlike traditional "Go-like" games that focus on simple collection mechanics, GW3 delivers a deep **Narrative RPG experience** combining **Visual Novel storytelling**, **Strategic Card Combat**, and **Urban Exploration**.

The project is currently in the **Alpha stage (v0.3.0)**, with a robust technical foundation (FSD Architecture, React 19, Bun/Elysia) and is moving towards its first major vertical slice: the **"Freiburg 1905" Detective Mode**.

**Value Proposition:** "Disco Elysium meets Pokémon GO" — A game where the real world is not just a board for collecting generic monsters, but a canvas for deep, atmospheric storytelling and investigation.

---

## 2. Product & Technology: The "Phygital" Layer Cake

Our technology stack doesn't just display a map; it creates a persistent, multi-layered reality where the physical and digital worlds intersect.

### 2.1 Concept: Virtual Layers of Reality
The game treats the real world as the "Base Layer" and superimposes multiple distinct interactive realities on top of it. Players switch between these layers using the game interface (The "Echo-7" PDA).

*   **Layer 0: The Physical Base:** The actual city of Freiburg (streets, buildings, terrain). We use Mapbox Vector Tiles for precise, global coverage.
*   **Layer 1: The Survival Plane (Procedural):** A dynamic overlay of post-apocalyptic elements.
    *   *Fog of War:* Unexplored physical areas are shrouded.
    *   *Hazard Zones:* Real-world industrial or noisy areas may be mapped as "High Radiation" or "Psy-Fields".
    *   *Loot:* Procedural spawn points for resources based on OpenStreetMap tags (e.g., Pharmacy tag -> Medical Loot).
*   **Layer 2: The Narrative Plane (Curated):** The "Detective Mode" and historical content.
    *   *Invisible Objects:* Quest NPCs, clues, and distinct locations (e.g., "The Haus Kapferer Crime Scene") that are invisible to casual players and only revealed during specific investigations.
    *   *Temporal Echoes:* Seeing the city as it was in 1905 (via vintage map overlays).

### 2.2 Technology: Hardlinks & The QR Bridge
To enable "true" location-based gaming that resists GPS spoofing and creates deeper immersion, we utilize our proprietary **"Hardlink" System** (Implemented v0.3).

*   **The "Anchor" Philosophy:** A Hardlink (Digital or Physical QR) acts as a cryptographically verifiable anchor. It acts as a "Key" to unlock specific nodes in the Narrative Layer.
*   **Interaction Flow:**
    1.  **Discovery:** Player finds a physical sticker or a digital marker at a specific GPS coordinate.
    2.  **Scanning:** Using the In-App "Scanner", the player scans the code.
    3.  **Validation:** The app verifies the cryptographic signature (preventing code generation by cheaters) and GPS proximity (preventing remote scanning).
    4.  **Unlock:** A "Hidden Reality" is revealed (e.g., a secret dialogue, a loot stash, or a narrative clue).

*   **Dossier Integration:**
    *   Collected evidence is stored in a persistent **Detective Dossier** (Implemented).
    *   Players can review found clues, combine evidence, and deduce outcomes even when away from the location.

### 2.3 Future Technology Strategy: AR Progression
We are adopting a phased approach to Augmented Reality, prioritizing battery life and narrative utility over gimmicks.

*   **Phase 1: "Diegetic AR" (Current / Mobile):**
    *   Camera overlay acts as an "Enhanced Vision" mode.
    *   Reticle-based interaction (scanning codes, identifying objects).
    *   UI elements float in screen-space, simulating a HUD (Heads-Up Display).
*   **Phase 2: "Location Anchor AR" (Post-Launch):**
    *   Using SLAM (Simultaneous Localization and Mapping) to place persistent 3D objects on the ground (e.g., a virtual dead drop that stays at a specific street corner).
    *   Visualizing "The Pale" (Fog) as a particle effect overlaying the real world camera feed.
*   **Phase 3: "Spatial Computing" (R&D / Vision Pro):**
    *   Full immersion where the "destroyed" version of landmarks is rendered over the real ones.
    *   Looking at the Freiburg Münster through smart glasses reveals its "Spirit World" counterpart active and glowing.

---

## 3. Market Analysis

### 3.1 Target Audience
*   **Primary:** Fans of "Crunchy" RPGs & Narrative Games (e.g., *Disco Elysium*, *Baldur's Gate 3*, *Cyberpunk 2077*).
*   **Secondary:** Urban Explorers and Geocachers looking for narrative context to their walks.
*   **Niche:** Board Game enthusiasts who appreciate card mechanics and distinctive aesthetics.

### 3.2 Market Gap
*   **Casual Location Games (Pokemon GO):** High accessibility, low depth.
*   **Hardcore Geocaching (Ingress):** High abstraction, low narrative.
*   **GW3 Opportunity:** Occupies the **"Narrative Location RPG"** niche. It treats the city as a *setting*, not just a *grid*.

---

## 4. Monetization Strategy

The recommended business model aligns with the "Base + Premium Content" structure, avoiding "Pay-to-Win" mechanics to preserve immersion.

### 4.1 Digital Content (DLC/Expansions)
*   **F2P Base Layer:** Survival Mode features, random encounters, and procedural loot are free to ensure user acquisition and map density.
*   **Premium Story Packs (The "Season Pass" Model):**
    *   *Example:* **"Freiburg 1905 Pack"** sold as a verified content module.
    *   Includes: Exclusive map layer, curated storyline, unique distinct faction quests, and specialized "Detective" tools.
    *   *Revenue Potential:* High margin, repeatable for different cities content (e.g., "Berlin 2088", "Vienna Noir").

### 4.2 "Phygital" Merchandise
*   **Physical Hardlinks:** Selling high-quality printed cards or stickers (QR codes) that unlock unique in-game items or start secret quests.
*   **Collector's Kits:** "Detective Dossiers" containing physical evidence (letters, photos) with embedded QR codes that interact with the app.

### 4.3 B2B / Partnerships (Long Term)
*   **City Tourism:** Partnering with municipalities to create "Historical Detective Tours" (like *Freiburg 1905*) that guide tourists through real landmarks using the game engine.
*   **Museum Mode:** Custom instances for museums to gamify exhibits.

---

## 5. Development Roadmap (2025-2026)

### Phase 1: Foundation (Q1 2025)
*   **Goal:** Technical Stability & System Unification.
*   **Key Deliverables:**
    *   Unify "Parliament of Voices" (18-24 voices finalization).
    *   Stabilize Map System (Mapbox + Custom Layers).
    *   Implement "Protocol Trinity" basic card mechanics.

### Phase 2: Vertical Slice (Q2 2025)
*   **Goal:** "Freiburg 1905" Playable Demo.
*   **Key Deliverables:**
    *   **Detective Mode:** Dossier UI, Investigation Board (Core Systems Complete).
    *   **Case #1:** Complete narrative arc "Haus Kapferer".
    *   **Hardlink System:** Fully functional QR scanner and resolver (Implemented).

### Phase 3: Beta & Content Scaling (Q3 2025)
*   **Goal:** User Retention & Expansion.
*   **Key Deliverables:**
    *   **Multiplayer Basics:** Faction reputation visibility.
    *   **Content Tools:** Pipeline for rapid quest creation.
    *   **Public Beta:** Closed testing in target city (Freiburg).

### Phase 4: Launch (Q4 2025 / Q1 2026)
*   **Goal:** Release & Monetization.
*   **Key Deliverables:**
    *   Launch on App Stores (iOS/Android wrappers).
    *   First Commercial Content Pack sale.
    *   Physical Merch drop.

---

## 6. Operational Plan

### 6.1 Team Structure (Lean)
*   **Core Dev:** Fullstack (React/Bun/Postgres) - *Current focus*.
*   **Narrative Designer:** Scripting VN scenes, Dossier content.
*   **Weird-Designer/Artist:** UI aesthetics (Cyberpunk/Vintage), Map styles, Card art.

### 6.2 Technology Advantage
*   **Stack:** Bun + Elysia (High perf, low cost) + React 19 (Modern UX).
*   **Infrastructure:** Self-hosted DB/Backend (Docker) minimizes cloud costs during scaling.
*   **Mapbox:** Efficient vector tiles for global coverage without massive storage needs.

---

## 7. Risk Assessment & Mitigation

| Impact | Risk | Mitigation Strategy |
| :--- | :--- | :--- |
| High | **GPS Spoofing** | Use "Hardlinks" (physical QRs) for critical progression points. |
| High | **Content Burnout** | Players consume stories faster than written. **Sol:** Procedural "Survival Mode" quests + Community Content tools. |
| Med | **Weather/Seasonality** | Location games dip in winter. **Sol:** "Remote Investigation" features (play from home with penalties/resource costs). |
| Med | **Privacy Concerns** | GDPR compliance by design; non-exact location sharing for multiplayer features. |

---

## 8. Conclusion

Grenzwanderer3 is positioned to define a new genre of **"Literary Location Gaming"**. By leveraging the technical scalability of modern web frameworks and the deep engagement of narrative RPGs, it offers a sustainable product model that scales through content packs rather than predatory microtransactions. The immediate focus remains on shipping the **Freiburg 1905** vertical slice to prove the "Detective Mode" concept.
