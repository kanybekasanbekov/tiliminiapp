import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import NavigationBar from './components/NavigationBar'
import HomePage from './pages/HomePage'
import AddCardPage from './pages/AddCardPage'
import PracticePage from './pages/PracticePage'
import CardsListPage from './pages/CardsListPage'
import DecksPage from './pages/DecksPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddCardPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/decks" element={<DecksPage />} />
          <Route path="/cards" element={<CardsListPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <NavigationBar />
      </HashRouter>
    </AppProvider>
  )
}
