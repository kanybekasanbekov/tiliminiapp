import { useState } from 'react'
import { Section, Cell } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { useApp } from '../contexts/AppContext'
import { api } from '../api'
import { getLanguageNames } from '../utils/languages'

const SUPPORTED_PAIRS = ['ko-en', 'en-ko', 'ko-ru', 'en-ru']

export default function SettingsPage() {
  const { activeLanguagePair, setActiveLanguagePair } = useApp()
  const [saving, setSaving] = useState(false)

  const handleSelect = async (pair: string) => {
    if (pair === activeLanguagePair || saving) return
    const previous = activeLanguagePair
    setActiveLanguagePair(pair)
    setSaving(true)
    try {
      await api.updatePreferences({ active_language_pair: pair })
      WebApp.HapticFeedback.notificationOccurred('success')
    } catch {
      setActiveLanguagePair(previous)
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Settings</h1>
        <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '15px' }}>
          Customize your learning experience
        </p>
      </div>

      <Section header="Language Pair">
        {SUPPORTED_PAIRS.map((pair) => {
          const { source, target } = getLanguageNames(pair)
          const isActive = pair === activeLanguagePair
          return (
            <Cell
              key={pair}
              onClick={() => handleSelect(pair)}
              before={
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
              }
              subtitle={pair}
            >
              {source} → {target}
            </Cell>
          )
        })}
      </Section>
    </div>
  )
}
