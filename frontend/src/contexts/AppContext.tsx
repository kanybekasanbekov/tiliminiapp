import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import WebApp from '@twa-dev/sdk'

interface AppContextType {
  user: {
    id: number
    first_name: string
    last_name?: string
    username?: string
  } | null
  colorScheme: 'light' | 'dark'
  dueCount: number
  setDueCount: (count: number) => void
}

const AppContext = createContext<AppContextType>({
  user: null,
  colorScheme: 'light',
  dueCount: 0,
  setDueCount: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [dueCount, setDueCount] = useState(0)
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
    WebApp.colorScheme || 'light'
  )

  const user = WebApp.initDataUnsafe?.user
    ? {
        id: WebApp.initDataUnsafe.user.id,
        first_name: WebApp.initDataUnsafe.user.first_name,
        last_name: WebApp.initDataUnsafe.user.last_name,
        username: WebApp.initDataUnsafe.user.username,
      }
    : null

  useEffect(() => {
    const handler = () => {
      setColorScheme(WebApp.colorScheme || 'light')
    }
    WebApp.onEvent('themeChanged', handler)
    return () => WebApp.offEvent('themeChanged', handler)
  }, [])

  return (
    <AppContext.Provider value={{ user, colorScheme, dueCount, setDueCount }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
