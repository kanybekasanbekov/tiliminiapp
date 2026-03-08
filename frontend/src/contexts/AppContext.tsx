import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'

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
  activeLanguagePair: string
  setActiveLanguagePair: (pair: string) => void
  languagePairVersion: number
  langSwitchMessage: string
  setLangSwitchMessage: (msg: string) => void
}

const AppContext = createContext<AppContextType>({
  user: null,
  colorScheme: 'light',
  dueCount: 0,
  setDueCount: () => {},
  activeLanguagePair: 'ko-en',
  setActiveLanguagePair: () => {},
  languagePairVersion: 0,
  langSwitchMessage: '',
  setLangSwitchMessage: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [dueCount, setDueCount] = useState(0)
  const [activeLanguagePair, setActiveLanguagePairRaw] = useState('ko-en')
  const [languagePairVersion, setLanguagePairVersion] = useState(0)
  const [langSwitchMessage, setLangSwitchMessage] = useState('')

  const setActiveLanguagePair = (pair: string) => {
    setActiveLanguagePairRaw(pair)
    setLanguagePairVersion((v) => v + 1)
  }
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

  useEffect(() => {
    api.getPreferences().then((prefs) => {
      if (prefs.active_language_pair) {
        setActiveLanguagePairRaw(prefs.active_language_pair)
      }
    }).catch(() => {})
  }, [])

  return (
    <AppContext.Provider value={{ user, colorScheme, dueCount, setDueCount, activeLanguagePair, setActiveLanguagePair, languagePairVersion, langSwitchMessage, setLangSwitchMessage }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
