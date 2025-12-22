import { Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { ModernHomePage } from './pages/HomePage'

import { Routes as RoutePaths } from './shared/lib/utils/navigation'
import { Navbar } from '@/widgets/navbar'
import MapPage from '@/pages/MapPage'
import VisualNovelPage from '@/pages/VisualNovelPage'
import ProloguePage from '@/pages/ProloguePage'
import CityRegistrationPage from '@/pages/CityRegistrationPage'
import CharacterPage from '@/pages/CharacterPage'
import InventoryPage from '@/pages/InventoryPage'
import SettingsPage from '@/pages/SettingsPage'
import DevToolsPage from '@/pages/DevToolsPage'
import QuestsPage from '@/pages/QuestsPage'
import QRScannerPage from '@/pages/QRScannerPage'
import SquadPage from '@/pages/SquadPage'
import BattlePage from '@/pages/BattlePage'
import TutorialBattlePage from '@/pages/TutorialBattlePage'
import PvPPage from '@/pages/PvPPage'
import CoopPage from '@/pages/CoopPage'
import ResonancePage from '@/pages/ResonancePage'
import { useQuestInventoryProtection } from '@/processes/quests-inventory'
import { useQuestOutboxSync } from '@/processes/quests-sync'




const AppShell = () => {
  useQuestInventoryProtection()
  useQuestOutboxSync({ intervalMs: 30000 })

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

function App() {
  return (
    <Routes>
      {/* Non-VN routes with persistent navbar */}
      <Route element={<AppShell />}>
        <Route path={RoutePaths.HOME} element={<ModernHomePage />} />
        <Route path={RoutePaths.MAP} element={<MapPage />} />
        <Route path={RoutePaths.ENHANCED_MAP} element={<MapPage />} />
        <Route path={RoutePaths.CHARACTER} element={<CharacterPage />} />
        <Route path={RoutePaths.INVENTORY} element={<InventoryPage />} />
        <Route path={RoutePaths.SETTINGS} element={<SettingsPage />} />
        <Route path={RoutePaths.DEVTOOLS} element={<DevToolsPage />} />

        {/* Temporary placeholders for remaining routes */}
        <Route path={RoutePaths.QUESTS} element={<QuestsPage />} />
        <Route path={RoutePaths.COMBAT} element={<BattlePage />} />
        <Route path={RoutePaths.QR_SCANNER} element={<QRScannerPage />} />
        <Route path={RoutePaths.SQUAD} element={<SquadPage />} />
        <Route path={RoutePaths.PVP} element={<PvPPage />} />
        <Route path={RoutePaths.PVP_BATTLE} element={<PvPPage />} />
        <Route path={RoutePaths.RESONANCE} element={<ResonancePage />} />
      </Route>

      {/* VN routes without navbar */}
      <Route path={RoutePaths.PROLOGUE} element={<ProloguePage />} />
      <Route path={RoutePaths.REGISTRATION} element={<CityRegistrationPage />} />
      <Route path={`${RoutePaths.VISUAL_NOVEL}/:sceneId?`} element={<VisualNovelPage />} />

      {/* Tutorial Battle (no navbar) */}
      <Route path={RoutePaths.TUTORIAL_BATTLE} element={<TutorialBattlePage />} />
      <Route path={RoutePaths.BATTLE} element={<BattlePage />} />

      {/* LCSD Coop Routes (no navbar for immersion) */}
      <Route path={RoutePaths.COOP} element={<CoopPage />} />
      <Route path="/coop/:roomCode/*" element={<CoopPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={RoutePaths.HOME} replace />} />
    </Routes>
  )
}

export default App
