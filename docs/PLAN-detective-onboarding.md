# Plan: Detective Onboarding Flow

> **Goal**: Implement a narrative onboarding screen for Detective Mode where the player learns about the Case and enters their name.

---

## 1. UI Components

### 1.1 `OnboardingModal.tsx` (New)
*   **Location**: `src/features/detective/ui/OnboardingModal.tsx`
*   **Visuals**:
    *   Overlay/Modal with vintage paper style.
    *   Heading: "URGENT TELEGRAM" or "POLICE REPORT".
    *   Body: "Bankhaus Krebs robbed. 100,000 Marks gone. We need an expert."
    *   Input: "Name of the Inspector" (Style: Handwritten font).
    *   Action: "ACCEPT CASE" (Button).

### 1.2 `HomePage.tsx` (Modification)
*   **Logic**:
    *   Clicking "Открыть Дело" checks if `detectiveName` is set.
    *   If NO name -> Open `OnboardingModal`.
    *   If YES name -> Navigate to Map directly (or offer "Continue").

---

## 2. State Management

### 2.1 `DossierStore`
*   Add `detectiveName: string | null`.
*   Add `setDetectiveName(name: string)`.
*   Add `hasStarted: boolean`.

---

## 3. Map Spawn Logic

### 3.1 Spawn Point
*   The `MapView.tsx` already has logic to center on `DETECTIVE_CONFIG.SPAWN_LNG_LAT`.
*   We will ensure this routes correctly after onboarding.

---

## 4. Verification
*   [ ] **Fresh Start**: Clear data. Click "Open Case". Modal appears.
*   **Input**: Enter name "Sherlock". Click Start.
*   **Navigation**: Redirects to Map.
*   **Spawn**: Map centers on Station/Bureau. Player marker is visible.
*   **Persistence**: Refresh page. Name is remembered.
