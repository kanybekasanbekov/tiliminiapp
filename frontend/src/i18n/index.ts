import { useApp } from '../contexts/AppContext'
import { translations } from './translations'

export type AppLanguage = 'en' | 'ru'

export function useTranslation() {
  const { appLanguage } = useApp()

  function t(key: string, params?: Record<string, string | number>): string {
    const lang = translations[appLanguage] || translations.en
    let text = lang[key] || translations.en[key] || key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
      }
    }
    return text
  }

  return { t, appLanguage }
}
