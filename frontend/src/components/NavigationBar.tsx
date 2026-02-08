import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const tabs = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/add', label: 'Add', icon: '➕' },
  { path: '/practice', label: 'Practice', icon: '📖' },
  { path: '/cards', label: 'Cards', icon: '🗂' },
  { path: '/stats', label: 'Stats', icon: '📊' },
]

export default function NavigationBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { dueCount } = useApp()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: '64px',
      backgroundColor: 'var(--tg-bg-color)',
      borderTop: '1px solid var(--tg-secondary-bg-color)',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 12px',
              fontSize: '20px',
              opacity: isActive ? 1 : 0.5,
              transition: 'opacity 0.2s',
              position: 'relative',
            }}
          >
            <span>{tab.icon}</span>
            <span style={{
              fontSize: '10px',
              color: isActive ? 'var(--tg-button-color)' : 'var(--tg-hint-color)',
              fontWeight: isActive ? 600 : 400,
            }}>
              {tab.label}
            </span>
            {tab.path === '/practice' && dueCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: '#ff3b30',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '1px 5px',
                minWidth: '16px',
                textAlign: 'center',
              }}>
                {dueCount > 99 ? '99+' : dueCount}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
