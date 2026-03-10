import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import { useApp } from '../contexts/AppContext'
import type { Flashcard, Deck, Difficulty } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import FlashCard from '../components/FlashCard'
import DifficultyButtons from '../components/DifficultyButtons'
import ExplainButton from '../components/ExplainButton'
import { useTranslation } from '../i18n'

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
  const initialized = useRef(false)

  // Deck state
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<number | undefined>(undefined)
  const [decksLoading, setDecksLoading] = useState(true)

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
    fetchCards(deckId)
  }

  // Persist session state on changes
  useEffect(() => {
    if (loading || sessionComplete || cards.length === 0) return
    saveSession({ cards, currentIndex, reviewed, totalDue, showSide, practiceMode, selectedDeckId })
  }, [cards, currentIndex, reviewed, totalDue, showSide, practiceMode, selectedDeckId, loading, sessionComplete])

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
    return (
      <div className="page">
        <div style={{ padding: '16px 16px 0' }}>
          {deckChipBar}
        </div>
        <EmptyState
          icon={reviewed > 0 ? '🎉' : '✅'}
          title={reviewed > 0 ? t('practice.sessionComplete') : t('practice.allCaughtUp')}
          description={
            reviewed > 0
              ? t('practice.sessionCompleteSub', { count: reviewed, s: reviewed !== 1 ? 's' : '' })
              : t('practice.noDueSub')
          }
          action={
            reviewed === 0
              ? { label: t('practice.addCards'), onClick: () => navigate('/add') }
              : { label: t('practice.backToHome'), onClick: () => navigate('/') }
          }
        />
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
          ]).map(({ mode, label }, i) => (
            <button
              key={mode}
              onClick={() => setPracticeMode(mode)}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '12px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: practiceMode === mode ? 'var(--tg-button-color)' : 'var(--tg-secondary-bg-color)',
                color: practiceMode === mode ? '#fff' : 'var(--tg-hint-color)',
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
            <div style={{ marginBottom: '12px' }}>
              <ExplainButton key={currentCard.id} cardId={currentCard.id} />
            </div>
            <DifficultyButtons onRate={handleRate} disabled={reviewing} />
          </>
        )}
      </div>
    </div>
  )
}
