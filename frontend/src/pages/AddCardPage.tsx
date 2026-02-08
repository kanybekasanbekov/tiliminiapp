import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Section, Input, Button, Cell } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import type { TranslationResult } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AddCardPage() {
  const navigate = useNavigate()
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<TranslationResult | null>(null)

  const handleTranslate = async () => {
    if (!word.trim()) return
    setLoading(true)
    setError('')
    setTranslation(null)
    try {
      const result = await api.translateWord(word.trim())
      setTranslation(result)
      setEditData(result)
      WebApp.HapticFeedback.impactOccurred('light')
    } catch (e: any) {
      setError(e.message || 'Translation failed')
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editData) return
    setSaving(true)
    setError('')
    try {
      await api.createCard(editData)
      WebApp.HapticFeedback.notificationOccurred('success')
      navigate('/')
    } catch (e: any) {
      setError(e.message || 'Failed to save')
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Add Card</h1>
        <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '14px' }}>
          Enter a Korean word to translate
        </p>
      </div>

      <Section>
        <div style={{ padding: '0 16px 12px' }}>
          <Input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter Korean word (e.g. 안녕하세요)"
            onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
            disabled={loading}
          />
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <Button
            size="l"
            stretched
            onClick={handleTranslate}
            disabled={!word.trim() || loading}
          >
            {loading ? 'Translating...' : 'Translate'}
          </Button>
        </div>
      </Section>

      {loading && <LoadingSpinner text="Getting AI translation..." />}

      {error && (
        <div style={{
          margin: '0 16px',
          padding: '12px 16px',
          backgroundColor: '#ff3b3020',
          borderRadius: '12px',
          color: '#ff3b30',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {translation && editData && (
        <>
          <Section header="Translation Result">
            <Cell subtitle="Korean">
              <span style={{ fontSize: '18px' }}>{editData.korean}</span>
            </Cell>
            {editing ? (
              <div style={{ padding: '8px 16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>English</label>
                <Input
                  value={editData.english}
                  onChange={(e) => setEditData({ ...editData, english: e.target.value })}
                />
                <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', margin: '12px 0 4px' }}>Example (Korean)</label>
                <Input
                  value={editData.example_kr}
                  onChange={(e) => setEditData({ ...editData, example_kr: e.target.value })}
                />
                <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', margin: '12px 0 4px' }}>Example (English)</label>
                <Input
                  value={editData.example_en}
                  onChange={(e) => setEditData({ ...editData, example_en: e.target.value })}
                />
                <div style={{ marginTop: '12px' }}>
                  <Button size="s" onClick={() => setEditing(false)}>Done Editing</Button>
                </div>
              </div>
            ) : (
              <>
                <Cell subtitle="English">{editData.english}</Cell>
                <Cell subtitle="Example (Korean)">{editData.example_kr}</Cell>
                <Cell subtitle="Example (English)">{editData.example_en}</Cell>
              </>
            )}
          </Section>

          <div style={{ padding: '16px', display: 'flex', gap: '12px' }}>
            {!editing && (
              <Button
                size="l"
                mode="outline"
                stretched
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
            <Button
              size="l"
              stretched
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Card'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
