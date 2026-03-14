import { useState } from 'react'
import { Button, Input } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import type { Flashcard } from '../types'
import { useTranslation } from '../i18n'
import { useApp } from '../contexts/AppContext'
import { getLanguageNames } from '../utils/languages'

interface EditCardModalProps {
  card: Flashcard
  onClose: () => void
  onSaved: (updated: Flashcard) => void
}

export default function EditCardModal({ card, onClose, onSaved }: EditCardModalProps) {
  const { t } = useTranslation()
  const { appLanguage } = useApp()
  const lang = getLanguageNames(card.language_pair, appLanguage)

  const [form, setForm] = useState({
    target_text: card.target_text,
    example_source: card.example_source || '',
    example_target: card.example_target || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await api.updateCard(card.id, form)
      WebApp.HapticFeedback.notificationOccurred('success')
      onSaved(updated)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--tg-bg-color)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{t('cards.editCard')}</h2>
        <p style={{ fontSize: '16px', color: 'var(--tg-hint-color)', marginBottom: '20px' }}>
          {card.source_text}
        </p>

        {error && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#ff3b3020',
            borderRadius: '8px',
            color: '#ff3b30',
            fontSize: '13px',
            marginBottom: '12px',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
            {lang.target}
          </label>
          <Input
            value={form.target_text}
            onChange={(e) => setForm({ ...form, target_text: e.target.value })}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
            {`${t('cards.example')} (${lang.source})`}
          </label>
          <Input
            value={form.example_source}
            onChange={(e) => setForm({ ...form, example_source: e.target.value })}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
            {`${t('cards.example')} (${lang.target})`}
          </label>
          <Input
            value={form.example_target}
            onChange={(e) => setForm({ ...form, example_target: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            size="l"
            mode="outline"
            stretched
            onClick={onClose}
            disabled={saving}
          >
            {t('cards.cancel')}
          </Button>
          <Button
            size="l"
            stretched
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('cards.saving') : t('cards.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
