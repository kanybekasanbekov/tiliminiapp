import { useState, useEffect, useRef } from 'react'
import { Section, Input, Button, Cell } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import type { TranslationResult } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

const SESSION_KEY = 'addcard_draft'
const SESSION_MAX_AGE = 30 * 60 * 1000 // 30 minutes

interface SavedDraft {
  word: string
  editData: TranslationResult
  editing: boolean
  timestamp: number
}

function saveDraft(draft: Omit<SavedDraft, 'timestamp'>) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...draft, timestamp: Date.now() }))
}

function loadDraft(): SavedDraft | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const draft: SavedDraft = JSON.parse(raw)
    if (Date.now() - draft.timestamp > SESSION_MAX_AGE) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return draft
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

function clearDraft() {
  sessionStorage.removeItem(SESSION_KEY)
}

export default function AddCardPage() {
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<TranslationResult | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const initialized = useRef(false)

  // Restore draft on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const saved = loadDraft()
    if (saved) {
      setWord(saved.word)
      setTranslation(saved.editData)
      setEditData(saved.editData)
      setEditing(saved.editing)
    }
  }, [])

  // Persist draft when translation state changes
  useEffect(() => {
    if (!editData) return
    saveDraft({ word, editData, editing })
  }, [word, editData, editing])

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

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(''), 3000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const handleSave = async () => {
    if (!editData) return
    setSaving(true)
    setError('')
    try {
      const savedWord = editData.korean
      await api.createCard(editData)
      WebApp.HapticFeedback.notificationOccurred('success')
      setWord('')
      setTranslation(null)
      setEditData(null)
      setEditing(false)
      clearDraft()
      setSuccessMessage(`"${savedWord}" saved!`)
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

      {successMessage && (
        <div style={{
          margin: '0 16px 12px',
          padding: '12px 16px',
          backgroundColor: '#34c75920',
          borderRadius: '12px',
          color: '#34c759',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          {successMessage}
        </div>
      )}

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
