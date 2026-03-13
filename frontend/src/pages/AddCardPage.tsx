import { useState, useEffect, useRef } from 'react'
import { Section, Input, Button, Cell } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import { useApp } from '../contexts/AppContext'
import type { TranslationResult, Deck, ImageTranslationItem } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import ExplainButton from '../components/ExplainButton'
import { getLanguageNames } from '../utils/languages'
import { useTranslation } from '../i18n'

const SESSION_KEY = 'addcard_draft'
const SESSION_MAX_AGE = 30 * 60 * 1000 // 30 minutes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

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

type Mode = 'text' | 'image'

export default function AddCardPage() {
  const { activeLanguagePair, appLanguage } = useApp()
  const { t } = useTranslation()

  // Shared state
  const [mode, setMode] = useState<Mode>('text')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<number | undefined>(undefined)
  const initialized = useRef(false)

  // Text mode state
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<TranslationResult | null>(null)

  // Image mode state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [batchTranslations, setBatchTranslations] = useState<ImageTranslationItem[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [batchSaving, setBatchSaving] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load decks and user preferred deck, scoped to active language pair
  useEffect(() => {
    Promise.all([api.getDecks(activeLanguagePair), api.getPreferences()]).then(([decksData, prefs]) => {
      setDecks(decksData.decks)
      const preferred = prefs.preferred_deck_id
        ? decksData.decks.find((d) => d.id === prefs.preferred_deck_id)
        : null
      const fallback = decksData.decks.find((d) => d.is_default)
      setSelectedDeckId((preferred || fallback)?.id)
    }).catch(() => {})
  }, [activeLanguagePair])

  // Restore draft on mount (text mode only)
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

  // Persist draft when translation state changes (text mode)
  useEffect(() => {
    if (!editData) return
    saveDraft({ word, editData, editing })
  }, [word, editData, editing])

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(''), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  // === Text mode handlers ===
  const handleTranslate = async () => {
    if (!word.trim()) return
    setLoading(true)
    setError('')
    setTranslation(null)
    try {
      const result = await api.translateWord(word.trim(), activeLanguagePair)
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
      const savedWord = editData.source_text
      await api.createCard({ ...editData, language_pair: activeLanguagePair, deck_id: selectedDeckId })
      if (selectedDeckId != null) {
        api.updatePreferences({ preferred_deck_id: selectedDeckId }).catch(() => {})
      }
      WebApp.HapticFeedback.notificationOccurred('success')
      setWord('')
      setTranslation(null)
      setEditData(null)
      setEditing(false)
      clearDraft()
      setSuccessMessage(t('add.saved', { word: savedWord }))
    } catch (e: any) {
      setError(e.message || 'Failed to save')
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setSaving(false)
    }
  }

  // === Image mode handlers ===
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_IMAGE_SIZE) {
      setError(t('add.imageTooLarge'))
      return
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setBatchTranslations([])
    setSelectedIndices(new Set())
    setError('')
    setSuccessMessage('')
  }

  const handleExtractAndTranslate = async () => {
    if (!imageFile) return
    setImageLoading(true)
    setError('')
    setBatchTranslations([])
    try {
      const result = await api.translateImage(imageFile, activeLanguagePair)
      if (result.translations.length === 0) {
        setError(t('add.noWordsFound'))
        return
      }
      setBatchTranslations(result.translations)
      // Auto-select non-duplicates
      const selected = new Set<number>()
      result.translations.forEach((item, i) => {
        if (!item.is_duplicate) selected.add(i)
      })
      setSelectedIndices(selected)
      WebApp.HapticFeedback.impactOccurred('light')
    } catch (e: any) {
      setError(e.message || 'Image translation failed')
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setImageLoading(false)
    }
  }

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedIndices(new Set(batchTranslations.map((_, i) => i)))
  }

  const handleDeselectAll = () => {
    setSelectedIndices(new Set())
  }

  const handleBatchSave = async () => {
    if (selectedIndices.size === 0) return
    setBatchSaving(true)
    setError('')
    try {
      const cards = Array.from(selectedIndices).map((i) => {
        const item = batchTranslations[i]
        return {
          source_text: item.source_text,
          target_text: item.target_text,
          example_source: item.example_source,
          example_target: item.example_target,
          language_pair: activeLanguagePair,
        }
      })
      const result = await api.createCardsBatch(cards, selectedDeckId)
      if (selectedDeckId != null) {
        api.updatePreferences({ preferred_deck_id: selectedDeckId }).catch(() => {})
      }
      WebApp.HapticFeedback.notificationOccurred('success')
      setSuccessMessage(t('add.batchSuccess', { created: String(result.created), duplicates: String(result.duplicates) }))
      // Reset image state
      setImageFile(null)
      setImagePreview(null)
      setBatchTranslations([])
      setSelectedIndices(new Set())
      setExpandedIndex(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e: any) {
      setError(e.message || 'Failed to save cards')
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setBatchSaving(false)
    }
  }

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    setBatchTranslations([])
    setSelectedIndices(new Set())
    setExpandedIndex(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const lang = getLanguageNames(activeLanguagePair, appLanguage)
  const selectedCount = selectedIndices.size

  // === Shared deck selector ===
  const renderDeckSelector = () => {
    if (decks.length <= 1) return null
    return (
      <Section header={t('add.saveToDeck')}>
        <div style={{ padding: '8px 16px 12px' }}>
          <select
            value={selectedDeckId ?? ''}
            onChange={(e) => setSelectedDeckId(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--tg-secondary-bg-color)',
              backgroundColor: 'var(--tg-bg-color)',
              color: 'var(--tg-text-color)',
              fontSize: '15px',
              appearance: 'auto',
            }}
          >
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}{d.is_default ? ` ${t('add.default')}` : ''}
              </option>
            ))}
          </select>
        </div>
      </Section>
    )
  }

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{t('add.title')}</h1>
        <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '14px' }}>
          {mode === 'text'
            ? t('add.enterWord', { source: lang.source, target: lang.target, sourcePrep: lang.sourcePrep, targetPrep: lang.targetPrep })
            : t('add.uploadImageDesc')}
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => { setMode('text'); setError('') }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: mode === 'text' ? 'var(--tg-button-color)' : 'var(--tg-secondary-bg-color)',
            color: mode === 'text' ? 'var(--tg-button-text-color)' : 'var(--tg-hint-color)',
            transition: 'all 0.2s',
          }}
        >
          {t('add.textMode')}
        </button>
        <button
          onClick={() => { setMode('image'); setError('') }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: mode === 'image' ? 'var(--tg-button-color)' : 'var(--tg-secondary-bg-color)',
            color: mode === 'image' ? 'var(--tg-button-text-color)' : 'var(--tg-hint-color)',
            transition: 'all 0.2s',
          }}
        >
          {t('add.imageMode')}
        </button>
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

      {error && (
        <div style={{
          margin: '0 16px 12px',
          padding: '12px 16px',
          backgroundColor: '#ff3b3020',
          borderRadius: '12px',
          color: '#ff3b30',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* ===== TEXT MODE ===== */}
      {mode === 'text' && (
        <>
          <Section>
            <div style={{ padding: '0 16px 12px' }}>
              <Input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder={t('add.placeholder', { source: lang.source, target: lang.target, sourcePrep: lang.sourcePrep, targetPrep: lang.targetPrep })}
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
                {loading ? t('add.translating') : t('add.translate')}
              </Button>
            </div>
          </Section>

          {loading && <LoadingSpinner text={t('add.gettingTranslation')} />}

          {translation && editData && (
            <>
              <Section header={t('add.translationResult')}>
                <Cell multiline subtitle={lang.source}>
                  <span style={{ fontSize: '18px' }}>{editData.source_text}</span>
                </Cell>
                {editing ? (
                  <div style={{ padding: '8px 16px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>{lang.target}</label>
                    <Input
                      value={editData.target_text}
                      onChange={(e) => setEditData({ ...editData, target_text: e.target.value })}
                    />
                    <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', margin: '12px 0 4px' }}>{`${t('flashcard.example')} (${lang.source})`}</label>
                    <Input
                      value={editData.example_source}
                      onChange={(e) => setEditData({ ...editData, example_source: e.target.value })}
                    />
                    <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', margin: '12px 0 4px' }}>{`${t('flashcard.example')} (${lang.target})`}</label>
                    <Input
                      value={editData.example_target}
                      onChange={(e) => setEditData({ ...editData, example_target: e.target.value })}
                    />
                    <div style={{ marginTop: '12px' }}>
                      <Button size="s" onClick={() => setEditing(false)}>{t('add.doneEditing')}</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Cell multiline subtitle={lang.target}>{editData.target_text}</Cell>
                    <Cell multiline subtitle={`${t('flashcard.example')} (${lang.source})`}>{editData.example_source}</Cell>
                    <Cell multiline subtitle={`${t('flashcard.example')} (${lang.target})`}>{editData.example_target}</Cell>
                  </>
                )}
              </Section>

              {renderDeckSelector()}

              <div style={{ padding: '12px 16px' }}>
                <ExplainButton translationData={{ source_text: editData.source_text, target_text: editData.target_text, language_pair: activeLanguagePair }} />
              </div>

              <div style={{ padding: '4px 16px 16px', display: 'flex', gap: '12px' }}>
                {!editing && (
                  <Button
                    size="l"
                    mode="outline"
                    stretched
                    onClick={() => setEditing(true)}
                  >
                    {t('add.edit')}
                  </Button>
                )}
                <Button
                  size="l"
                  stretched
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? t('add.saving') : t('add.saveCard')}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* ===== IMAGE MODE ===== */}
      {mode === 'image' && (
        <>
          <Section>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  margin: '0 16px 16px',
                  padding: '32px 16px',
                  borderRadius: '12px',
                  border: '2px dashed var(--tg-hint-color)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  opacity: 0.7,
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <div style={{ fontSize: '15px', color: 'var(--tg-text-color)', fontWeight: 500 }}>
                  {t('add.uploadImage')}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--tg-hint-color)', marginTop: '4px' }}>
                  {t('add.uploadImageDesc')}
                </div>
              </div>
            ) : (
              <div style={{ padding: '0 16px 12px' }}>
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="l"
                    mode="outline"
                    stretched
                    onClick={clearImage}
                  >
                    {t('add.changeImage')}
                  </Button>
                  {batchTranslations.length === 0 && (
                    <Button
                      size="l"
                      stretched
                      onClick={handleExtractAndTranslate}
                      disabled={imageLoading}
                    >
                      {imageLoading ? t('add.extracting') : t('add.extractAndTranslate')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Section>

          {imageLoading && <LoadingSpinner text={t('add.extracting')} />}

          {/* Batch translation results */}
          {batchTranslations.length > 0 && (
            <>
              <Section header={`${t('add.translationResult')} (${batchTranslations.length})`}>
                {/* Select all / deselect all controls */}
                <div style={{
                  padding: '8px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--tg-hint-color)' }}>
                    {t('add.selected', { count: String(selectedCount), total: String(batchTranslations.length) })}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleSelectAll}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--tg-link-color)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                      }}
                    >
                      {t('add.selectAll')}
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--tg-link-color)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                      }}
                    >
                      {t('add.deselectAll')}
                    </button>
                  </div>
                </div>

                {/* Word list */}
                {batchTranslations.map((item, index) => (
                  <div key={index}>
                    <div
                      onClick={() => toggleSelect(index)}
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        cursor: 'pointer',
                        backgroundColor: selectedIndices.has(index) ? 'transparent' : 'var(--tg-secondary-bg-color)',
                        opacity: selectedIndices.has(index) ? 1 : 0.5,
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: `2px solid ${selectedIndices.has(index) ? 'var(--tg-button-color)' : 'var(--tg-hint-color)'}`,
                        backgroundColor: selectedIndices.has(index) ? 'var(--tg-button-color)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                        transition: 'all 0.15s',
                      }}>
                        {selectedIndices.has(index) && (
                          <span style={{ color: 'var(--tg-button-text-color)', fontSize: '14px', fontWeight: 700 }}>✓</span>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600 }}>{item.source_text}</span>
                          <span style={{ fontSize: '13px', color: 'var(--tg-hint-color)' }}>→</span>
                          <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>{item.target_text}</span>
                        </div>
                        {item.is_duplicate && (
                          <span style={{
                            display: 'inline-block',
                            marginTop: '4px',
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#ff950020',
                            color: '#ff9500',
                            fontWeight: 500,
                          }}>
                            {t('add.duplicate')}
                          </span>
                        )}
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedIndex(expandedIndex === index ? null : index)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--tg-hint-color)',
                          fontSize: '18px',
                          cursor: 'pointer',
                          padding: '0 4px',
                          flexShrink: 0,
                        }}
                      >
                        {expandedIndex === index ? '▾' : '▸'}
                      </button>
                    </div>

                    {/* Expanded examples */}
                    {expandedIndex === index && (
                      <div style={{
                        padding: '0 16px 10px 50px',
                        fontSize: '13px',
                        color: 'var(--tg-hint-color)',
                      }}>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>{t('flashcard.example')}:</strong> {item.example_source}
                        </div>
                        <div>{item.example_target}</div>
                      </div>
                    )}
                  </div>
                ))}
              </Section>

              {renderDeckSelector()}

              <div style={{ padding: '12px 16px 16px' }}>
                <Button
                  size="l"
                  stretched
                  onClick={handleBatchSave}
                  disabled={batchSaving || selectedCount === 0}
                >
                  {batchSaving
                    ? t('add.savingCards')
                    : t('add.saveCards', { count: String(selectedCount) })}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
