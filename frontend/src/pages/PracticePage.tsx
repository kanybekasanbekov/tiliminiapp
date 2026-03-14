import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import { useApp } from '../contexts/AppContext'
import type { Flashcard, Deck, Difficulty, StudyMode } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import FlashCard from '../components/FlashCard'
import DifficultyButtons from '../components/DifficultyButtons'
import ExplainButton from '../components/ExplainButton'
import MoveDeckModal from '../components/MoveDeckModal'
import { useTranslation } from '../i18n'
import TypeModeView from '../components/TypeModeView'
import QuizModeView from '../components/QuizModeView'

const SESSION_KEY = 'practice_session'
const SESSION_MAX_AGE = 30 * 60 * 1000 // 30 minutes

type PracticeMode = 'source-to-target' | 'target-to-source' | 'random'

function getSideForMode(mode: PracticeMode): 'source' | 'target' {
  if (mode === 'source-to-target') return 'source'
  if (mode === 'target-to-source') return 'target'
  return Math.random() > 0.5 ? 'source' : 'target'
}

interface SavedSession {
  cards: Flashcard[]
  currentIndex: number
  reviewed: number
  totalDue: number
  showSide: 'source' | 'target'
  practiceMode: PracticeMode
  studyMode?: StudyMode
  selectedDeckId?: number
  timestamp: number
}

function saveSession(session: Omit<SavedSession, 'timestamp'>) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, timestamp: Date.now() }))
}

function loadSession(): SavedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session: SavedSession = JSON.parse(raw)
    if (Date.now() - session.timestamp > SESSION_MAX_AGE) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export default function PracticePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setDueCount, activeLanguagePair, languagePairVersion } = useApp()
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showSide, setShowSide] = useState<'source' | 'target'>('source')
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [totalDue, setTotalDue] = useState(0)
  const [reviewed, setReviewed] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('source-to-target')
  const [studyMode, setStudyMode] = useState<StudyMode>('flip')
  const [correctCount, setCorrectCount] = useState(0)
  const initialized = useRef(false)

  // Deck state
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<number | undefined>(undefined)
  const [decksLoading, setDecksLoading] = useState(true)

  // Move card modal state
  const [movingCard, setMovingCard] = useState<Flashcard | null>(null)

  // Edit card modal state
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [editForm, setEditForm] = useState({ target_text: '', example_source: '', example_target: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const openEdit = (card: Flashcard) => {
    setEditForm({
      target_text: card.target_text,
      example_source: card.example_source || '',
      example_target: card.example_target || '',
    })
    setEditError('')
    setEditingCard(card)
  }

  const handleEditSave = async () => {
    if (!editingCard) return
    setEditSaving(true)
    setEditError('')
    try {
      const updated = await api.updateCard(editingCard.id, editForm)
      WebApp.HapticFeedback.notificationOccurred('success')
      // Update the card in the current session
      setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      setEditingCard(null)
    } catch (e: any) {
      setEditError(e.message || 'Failed to save')
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setEditSaving(false)
    }
  }

  const loadDecks = async () => {
    setDecksLoading(true)
    try {
      const data = await api.getDecks(activeLanguagePair)
      setDecks(data.decks)
    } catch {
      // ignore
    } finally {
      setDecksLoading(false)
    }
  }

  const fetchCards = async (deckId?: number) => {
    setLoading(true)
    try {
      const data = await api.getDueCards(20, activeLanguagePair, deckId)
      setCards(data.cards)
      setTotalDue(data.total_due)
      setDueCount(data.total_due)
      if (data.cards.length === 0) {
        setSessionComplete(true)
      } else {
        setShowSide(getSideForMode(practiceMode))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // Load decks on mount
  useEffect(() => {
    loadDecks()
  }, [languagePairVersion])

  // Init: try restoring from sessionStorage, otherwise fetch from API
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const saved = loadSession()
    if (saved && saved.cards.length > 0) {
      setCards(saved.cards)
      setCurrentIndex(saved.currentIndex)
      setReviewed(saved.reviewed)
      setTotalDue(saved.totalDue)
      setShowSide(saved.showSide)
      setPracticeMode(saved.practiceMode ?? 'source-to-target')
      setStudyMode(saved.studyMode ?? 'flip')
      setSelectedDeckId(saved.selectedDeckId)
      setDueCount(saved.totalDue - saved.reviewed)
      setLoading(false)
      return
    }

    fetchCards()
  }, [setDueCount])

  // Re-fetch when language pair changes mid-session
  useEffect(() => {
    if (languagePairVersion === 0) return // skip initial
    clearSession()
    setCards([])
    setCurrentIndex(0)
    setReviewed(0)
    setTotalDue(0)
    setShowAnswer(false)
    setSessionComplete(false)
    setSelectedDeckId(undefined)
    setCorrectCount(0)
    fetchCards()
  }, [languagePairVersion])

  // Handle deck selection change
  const handleDeckSelect = (deckId: number | undefined) => {
    if (deckId === selectedDeckId) return
    setSelectedDeckId(deckId)
    clearSession()
    setCards([])
    setCurrentIndex(0)
    setReviewed(0)
    setTotalDue(0)
    setShowAnswer(false)
    setSessionComplete(false)
    setCorrectCount(0)
    fetchCards(deckId)
  }

  // Persist session state on changes
  useEffect(() => {
    if (loading || sessionComplete || cards.length === 0) return
    saveSession({ cards, currentIndex, reviewed, totalDue, showSide, practiceMode, studyMode, selectedDeckId })
  }, [cards, currentIndex, reviewed, totalDue, showSide, practiceMode, studyMode, selectedDeckId, loading, sessionComplete])

  // Clear storage when session completes
  useEffect(() => {
    if (sessionComplete) clearSession()
  }, [sessionComplete])

  // Update showSide when practiceMode changes mid-session (only if answer not revealed)
  useEffect(() => {
    if (!showAnswer && cards.length > 0 && !sessionComplete) {
      setShowSide(getSideForMode(practiceMode))
    }
  }, [practiceMode])

  const currentCard = cards[currentIndex]
  const totalCardCount = decks.reduce((sum, d) => sum + d.card_count, 0)

  const handleReveal = () => {
    setShowAnswer(true)
    WebApp.HapticFeedback.impactOccurred('light')
  }

  const handleRate = async (difficulty: Difficulty) => {
    if (!currentCard || reviewing) return
    setReviewing(true)
    WebApp.HapticFeedback.impactOccurred('medium')

    try {
      const result = await api.submitReview(currentCard.id, difficulty)
      setDueCount(result.remaining_due)
      setReviewed((r) => r + 1)

      // Move to next card
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((i) => i + 1)
        setShowAnswer(false)
        setShowSide(getSideForMode(practiceMode))
      } else {
        setSessionComplete(true)
      }
    } catch {
      // ignore
    } finally {
      setReviewing(false)
    }
  }

  const handleStudyModeResult = async (wasCorrect: boolean, responseTimeMs?: number) => {
    if (!currentCard || reviewing) return
    setReviewing(true)
    WebApp.HapticFeedback.notificationOccurred(wasCorrect ? 'success' : 'error')

    if (wasCorrect) setCorrectCount((c) => c + 1)

    try {
      const result = await api.submitReview(currentCard.id, wasCorrect ? 'medium' : 'hard', {
        study_mode: studyMode,
        was_correct: wasCorrect,
        response_time_ms: responseTimeMs,
      })
      setDueCount(result.remaining_due)
      setReviewed((r) => r + 1)

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((i) => i + 1)
        setShowAnswer(false)
        setShowSide(getSideForMode(practiceMode))
      } else {
        setSessionComplete(true)
      }
    } catch {
      // ignore
    } finally {
      setReviewing(false)
    }
  }

  if (loading && decksLoading) return <LoadingSpinner text={t('practice.loading')} />

  // Deck chip bar (shown always, including on empty/complete states)
  const deckChipBar = (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '4px 16px 12px',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      <style>{`.practice-chip::-webkit-scrollbar { display: none; }`}</style>
      <button
        className="practice-chip"
        onClick={() => handleDeckSelect(undefined)}
        style={{
          flexShrink: 0,
          border: 'none',
          borderRadius: '16px',
          padding: '6px 14px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          background: selectedDeckId == null ? 'var(--tg-button-color)' : 'var(--tg-secondary-bg-color)',
          color: selectedDeckId == null ? 'var(--tg-button-text-color)' : 'var(--tg-text-color)',
        }}
      >
        {t('practice.allDecks', { count: totalCardCount })}
      </button>
      {decks.map((deck) => (
        <button
          key={deck.id}
          className="practice-chip"
          onClick={() => handleDeckSelect(deck.id)}
          style={{
            flexShrink: 0,
            border: 'none',
            borderRadius: '16px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: selectedDeckId === deck.id ? 'var(--tg-button-color)' : 'var(--tg-secondary-bg-color)',
            color: selectedDeckId === deck.id ? 'var(--tg-button-text-color)' : 'var(--tg-text-color)',
          }}
        >
          {deck.name} ({deck.card_count})
        </button>
      ))}
    </div>
  )

  if (sessionComplete || cards.length === 0) {
    const hasAccuracy = correctCount > 0 || (reviewed > 0 && studyMode !== 'flip')
    const accuracyPct = reviewed > 0 ? Math.round((correctCount / reviewed) * 100) : 0

    return (
      <div className="page">
        <div style={{ padding: '16px 16px 0' }}>
          {deckChipBar}
        </div>
        {reviewed > 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
              {t('practice.sessionComplete')}
            </h2>
            <p style={{ color: 'var(--tg-hint-color)', marginBottom: '24px' }}>
              {t('practice.sessionCompleteSub', { count: reviewed, s: reviewed !== 1 ? 's' : '' })}
            </p>

            {hasAccuracy && (
              <div style={{
                backgroundColor: 'var(--tg-secondary-bg-color)',
                borderRadius: '20px',
                padding: '24px',
                marginBottom: '24px',
              }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  color: accuracyPct >= 80 ? '#34c759' : accuracyPct >= 50 ? '#ff9500' : '#ff3b30',
                  marginBottom: '8px',
                }}>
                  {accuracyPct}%
                </div>
                <div style={{ fontSize: '15px', color: 'var(--tg-hint-color)' }}>
                  {t('practice.accuracy', { correct: correctCount, total: reviewed, pct: accuracyPct })}
                </div>
                {/* Progress bar */}
                <div style={{
                  height: '8px',
                  backgroundColor: 'var(--tg-bg-color)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginTop: '16px',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${accuracyPct}%`,
                    backgroundColor: accuracyPct >= 80 ? '#34c759' : accuracyPct >= 50 ? '#ff9500' : '#ff3b30',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}

            {!hasAccuracy && (
              <div style={{
                backgroundColor: 'var(--tg-secondary-bg-color)',
                borderRadius: '20px',
                padding: '24px',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>
                  {reviewed}
                </div>
                <div style={{ fontSize: '15px', color: 'var(--tg-hint-color)' }}>
                  {t('practice.reviewedCount', { count: reviewed })}
                </div>
              </div>
            )}

            <Button size="l" stretched onClick={() => navigate('/')}>
              {t('practice.backToHome')}
            </Button>
          </div>
        ) : (
          <EmptyState
            icon="✅"
            title={t('practice.allCaughtUp')}
            description={t('practice.noDueSub')}
            action={{ label: t('practice.addCards'), onClick: () => navigate('/add') }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ padding: '16px 16px 8px' }}>
        {/* Deck selector */}
        {deckChipBar}
        {/* Practice mode selector */}
        <div style={{ display: 'flex', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden' }}>
          {([
            { mode: 'source-to-target' as PracticeMode, label: t('practice.sourceToTarget') },
            { mode: 'target-to-source' as PracticeMode, label: t('practice.targetToSource') },
            { mode: 'random' as PracticeMode, label: t('practice.random') },
          ]).map(({ mode, label }, i) => {
            const isTypeLocked = studyMode === 'type'
            const isActive = isTypeLocked ? mode === 'target-to-source' : practiceMode === mode
            const isDisabled = isTypeLocked && mode !== 'target-to-source'
            return (
              <button
                key={mode}
                onClick={() => !isDisabled && setPracticeMode(mode)}
                disabled={isDisabled}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: '12px',
                  border: 'none',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  backgroundColor: isActive ? 'var(--tg-button-color)' : 'var(--tg-secondary-bg-color)',
                  color: isActive ? '#fff' : 'var(--tg-hint-color)',
                  opacity: isDisabled ? 0.5 : 1,
                  borderRadius: i === 0 ? '8px 0 0 8px' : i === 2 ? '0 8px 8px 0' : '0',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        {/* Study mode selector */}
        <div style={{ display: 'flex', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden' }}>
          {([
            { mode: 'flip' as StudyMode, label: t('practice.modeFlip') },
            { mode: 'type' as StudyMode, label: t('practice.modeType') },
            { mode: 'quiz' as StudyMode, label: t('practice.modeQuiz') },
          ]).map(({ mode, label }, i) => (
            <button
              key={mode}
              onClick={() => {
                setStudyMode(mode)
                setShowAnswer(false)
              }}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '12px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: studyMode === mode ? 'var(--tg-button-color)' : 'var(--tg-secondary-bg-color)',
                color: studyMode === mode ? '#fff' : 'var(--tg-hint-color)',
                borderRadius: i === 0 ? '8px 0 0 8px' : i === 2 ? '0 8px 8px 0' : '0',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
            {t('practice.cardOf', { current: currentIndex + 1, total: cards.length })}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
            {t('practice.reviewed', { count: reviewed })}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{
          height: '4px',
          backgroundColor: 'var(--tg-secondary-bg-color)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${((currentIndex) / cards.length) * 100}%`,
            backgroundColor: 'var(--tg-button-color)',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {studyMode === 'flip' && (
        <>
          <div style={{ padding: '16px' }}>
            <FlashCard
              card={currentCard}
              showSide={showSide}
              revealed={showAnswer}
            />
          </div>

          <div style={{ padding: '0 16px' }}>
            {!showAnswer ? (
              <Button size="l" stretched onClick={handleReveal}>
                {t('practice.showAnswer')}
              </Button>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <ExplainButton key={currentCard.id} cardId={currentCard.id} />
                  <button
                    onClick={() => openEdit(currentCard)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1.5px solid var(--tg-button-color)',
                      background: 'transparent',
                      color: 'var(--tg-button-color)',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('cards.edit')}
                  </button>
                  <button
                    onClick={() => setMovingCard(currentCard)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1.5px solid var(--tg-button-color)',
                      background: 'transparent',
                      color: 'var(--tg-button-color)',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('cards.move')}
                  </button>
                </div>
                <DifficultyButtons onRate={handleRate} disabled={reviewing} />
              </>
            )}
          </div>
        </>
      )}

      {studyMode === 'type' && (
        <div style={{ padding: '16px' }}>
          <TypeModeView
            card={currentCard}
            showSide="target"
            onResult={handleStudyModeResult}
          />
        </div>
      )}

      {studyMode === 'quiz' && (
        <div style={{ padding: '16px' }}>
          <QuizModeView
            card={currentCard}
            showSide={showSide}
            onResult={handleStudyModeResult}
            nextCardId={currentIndex + 1 < cards.length ? cards[currentIndex + 1].id : undefined}
          />
        </div>
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <div
          onClick={() => setEditingCard(null)}
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
              {editingCard.source_text}
            </p>

            {editError && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#ff3b3020',
                borderRadius: '8px',
                color: '#ff3b30',
                fontSize: '13px',
                marginBottom: '12px',
              }}>
                {editError}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                {t('cards.edit')}
              </label>
              <Input
                value={editForm.target_text}
                onChange={(e) => setEditForm({ ...editForm, target_text: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                {t('cards.example')}
              </label>
              <Input
                value={editForm.example_source}
                onChange={(e) => setEditForm({ ...editForm, example_source: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                {t('cards.example')}
              </label>
              <Input
                value={editForm.example_target}
                onChange={(e) => setEditForm({ ...editForm, example_target: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                size="l"
                mode="outline"
                stretched
                onClick={() => setEditingCard(null)}
                disabled={editSaving}
              >
                {t('cards.cancel')}
              </Button>
              <Button
                size="l"
                stretched
                onClick={handleEditSave}
                disabled={editSaving}
              >
                {editSaving ? t('cards.saving') : t('cards.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Move Card Modal */}
      {movingCard && (
        <MoveDeckModal
          cardId={movingCard.id}
          currentDeckId={movingCard.deck_id}
          decks={decks}
          onClose={() => setMovingCard(null)}
          onMoved={() => {
            setMovingCard(null)
            loadDecks()
          }}
        />
      )}
    </div>
  )
}
