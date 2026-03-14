import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Section, Cell } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { useApp } from '../contexts/AppContext'
import { useTranslation } from '../i18n'
import type { AppLanguage } from '../i18n'
import { api } from '../api'
import { getLanguageNames } from '../utils/languages'

const SUPPORTED_PAIRS = ['ko-en', 'ko-ru', 'en-ru']
const APP_LANGUAGES: { code: AppLanguage; nativeName: string }[] = [
  { code: 'en', nativeName: 'English' },
  { code: 'ru', nativeName: 'Русский' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { activeLanguagePair, setActiveLanguagePair, setLangSwitchMessage, appLanguage, setAppLanguage } = useApp()
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)

  const handleSelectPair = async (pair: string) => {
    if (pair === activeLanguagePair || saving) return
    const previous = activeLanguagePair
    setActiveLanguagePair(pair)
    setSaving(true)
    try {
      await api.updatePreferences({ active_language_pair: pair })
      WebApp.HapticFeedback.notificationOccurred('success')
      const { source, target } = getLanguageNames(pair, appLanguage)
      setLangSwitchMessage(t('settings.switchedToPair', { source, target }))
      navigate('/')
    } catch {
      setActiveLanguagePair(previous)
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectLang = (lang: AppLanguage) => {
    if (lang === appLanguage) return
    setAppLanguage(lang)
    WebApp.HapticFeedback.notificationOccurred('success')
    const nativeName = APP_LANGUAGES.find((l) => l.code === lang)?.nativeName || lang
    setLangSwitchMessage(t('settings.switchedToLang', { lang: nativeName }))
    navigate('/')
  }

  const radioIcon = (isActive: boolean) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      border: `2px solid ${isActive ? 'var(--tg-button-color)' : 'var(--tg-hint-color)'}`,
      fontSize: '24px',
    }}>
      {isActive && (
        <span style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: 'var(--tg-button-color)',
        }} />
      )}
    </span>
  )

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 16px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--tg-button-color)',
            fontSize: '15px',
            padding: '0',
            cursor: 'pointer',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← {t('practice.backToHome')}
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 700 }}>{t('settings.title')}</h1>
        <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '15px' }}>
          {t('settings.subtitle')}
        </p>
      </div>

      <Section header={t('settings.languagePair')}>
        {SUPPORTED_PAIRS.map((pair) => {
          const { source, target } = getLanguageNames(pair, appLanguage)
          const isActive = pair === activeLanguagePair
          return (
            <Cell
              key={pair}
              onClick={() => handleSelectPair(pair)}
              before={radioIcon(isActive)}
              subtitle={pair}
            >
              {source} → {target}
            </Cell>
          )
        })}
      </Section>

      <Section header={t('settings.appLanguage')}>
        {APP_LANGUAGES.map(({ code, nativeName }) => {
          const isActive = code === appLanguage
          return (
            <Cell
              key={code}
              onClick={() => handleSelectLang(code)}
              before={radioIcon(isActive)}
              subtitle={code.toUpperCase()}
            >
              {nativeName}
            </Cell>
          )
        })}
      </Section>
    </div>
  )
}
