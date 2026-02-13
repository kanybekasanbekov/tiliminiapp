import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import { useApp } from '../contexts/AppContext'
import type { Flashcard, Difficulty } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import FlashCard from '../components/FlashCard'
import DifficultyButtons from '../components/DifficultyButtons'

const SESSION_KEY = 'practice_session'
const SESSION_MAX_AGE = 30 * 60 * 1000 // 30 minutes

interface SavedSession {
  cards: Flashcard[]
  currentIndex: number
  reviewed: number
  totalDue: number
  showSide: 'korean' | 'english'
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
  const { setDueCount } = useApp()
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showSide, setShowSide] = useState<'korean' | 'english'>('korean')
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [totalDue, setTotalDue] = useState(0)
  const [reviewed, setReviewed] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const initialized = useRef(false)

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
      setDueCount(saved.totalDue - saved.reviewed)
      setLoading(false)
      return
    }

    async function fetchCards() {
      try {
        const data = await api.getDueCards(20)
        setCards(data.cards)
        setTotalDue(data.total_due)
        setDueCount(data.total_due)
        if (data.cards.length === 0) {
          setSessionComplete(true)
        } else {
          setShowSide(Math.random() > 0.5 ? 'korean' : 'english')
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [setDueCount])

  // Persist session state on changes
  useEffect(() => {
    if (loading || sessionComplete || cards.length === 0) return
    saveSession({ cards, currentIndex, reviewed, totalDue, showSide })
  }, [cards, currentIndex, reviewed, totalDue, showSide, loading, sessionComplete])

  // Clear storage when session completes
  useEffect(() => {
    if (sessionComplete) clearSession()
  }, [sessionComplete])

  const currentCard = cards[currentIndex]

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
        setShowSide(Math.random() > 0.5 ? 'korean' : 'english')
      } else {
        setSessionComplete(true)
      }
    } catch {
      // ignore
    } finally {
      setReviewing(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading cards..." />

  if (sessionComplete || cards.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon={reviewed > 0 ? '🎉' : '✅'}
          title={reviewed > 0 ? 'Session Complete!' : 'All Caught Up!'}
          description={
            reviewed > 0
              ? `Great job! You reviewed ${reviewed} card${reviewed !== 1 ? 's' : ''}.`
              : 'No cards are due for review right now. Add some cards or come back later.'
          }
          action={
            reviewed === 0
              ? { label: 'Add Cards', onClick: () => navigate('/add') }
              : { label: 'Back to Home', onClick: () => navigate('/') }
          }
        />
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
            Reviewed: {reviewed}
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
            Show Answer
          </Button>
        ) : (
          <DifficultyButtons onRate={handleRate} disabled={reviewing} />
        )}
      </div>
    </div>
  )
}
