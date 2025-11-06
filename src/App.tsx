import { Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { ModernHomePage } from './pages/HomePage'

import { Routes as RoutePaths } from './shared/lib/utils/navigation'
import { Navbar } from '@/widgets/navbar'
import MapPage from '@/pages/MapPage'
import VisualNovelPage from '@/pages/VisualNovelPage'
import ProloguePage from '@/pages/ProloguePage'
import CharacterPage from '@/pages/CharacterPage'
import InventoryPage from '@/pages/InventoryPage'
import SettingsPage from '@/pages/SettingsPage'
import DevToolsPage from '@/pages/DevToolsPage'

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="text-[color:var(--color-text-secondary)]">Компонент находится в разработке</p>
    </div>
  </div>
)

const AppShell = () => (
  <>
    <Navbar />
    <div className="pt-16">
      <Outlet />
    </div>
  </>
)

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
        <Route path={RoutePaths.QUESTS} element={<PlaceholderPage title="Квесты" />} />
        <Route path={RoutePaths.COMBAT} element={<PlaceholderPage title="Бой" />} />
        <Route path={RoutePaths.QR_SCANNER} element={<PlaceholderPage title="QR сканер" />} />
      </Route>

      {/* VN routes without navbar */}
      <Route path={RoutePaths.PROLOGUE} element={<ProloguePage />} />
      <Route path={`${RoutePaths.VISUAL_NOVEL}/:sceneId?`} element={<VisualNovelPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={RoutePaths.HOME} replace />} />
    </Routes>
  )
}

export default App

