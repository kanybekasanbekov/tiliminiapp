import { useState, useEffect, useRef } from 'react'
import { Button } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import type { Flashcard } from '../types'
import FlashCard from './FlashCard'
import { api } from '../api'
import { useTranslation } from '../i18n'

interface QuizModeViewProps {
  card: Flashcard
  showSide: 'source' | 'target'
  onResult: (wasCorrect: boolean, responseTimeMs?: number) => void
  nextCardId?: number
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function QuizModeView({ card, showSide, onResult, nextCardId }: QuizModeViewProps) {
  const { t } = useTranslation()
  const [options, setOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(Date.now())
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const prefetchedRef = useRef<Map<number, string[]>>(new Map())

  const answerSide = showSide === 'source' ? 'target' : 'source'
  const correctAnswer = showSide === 'source' ? card.target_text : card.source_text
  const isCorrectSelected = selected === correctAnswer
  const isIncorrectSelected = selected !== null && !isCorrectSelected

  useEffect(() => {
    let cancelled = false
    setSelected(null)
    setLoading(true)
    setStartTime(Date.now())

    const loadOptions = async () => {
      try {
        const prefetched = prefetchedRef.current.get(card.id)
        let distractors: string[]

        if (prefetched) {
          distractors = prefetched
          prefetchedRef.current.delete(card.id)
        } else {
          const resp = await api.getQuizOptions(card.id, 3, answerSide)
          distractors = resp.options
        }

        if (cancelled) return
        const allOptions = shuffleArray([correctAnswer, ...distractors])
        setOptions(allOptions)
      } catch {
        if (cancelled) return
        setOptions([correctAnswer])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOptions()

    if (nextCardId) {
      api.getQuizOptions(nextCardId, 3, answerSide)
        .then(resp => {
          prefetchedRef.current.set(nextCardId, resp.options)
        })
        .catch(() => {})
    }

    return () => {
      cancelled = true
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    }
  }, [card.id])

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    const responseTime = Date.now() - startTime
    const isCorrect = option === correctAnswer

    if (isCorrect) {
      WebApp.HapticFeedback.notificationOccurred('success')
      // Brief green highlight, then advance
      advanceTimerRef.current = setTimeout(() => {
        onResult(true, responseTime)
      }, 800)
    } else {
      WebApp.HapticFeedback.notificationOccurred('error')
    }
  }

  const handleContinue = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    onResult(false, Date.now() - startTime)
  }

  const getOptionStyle = (option: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: '100%',
      padding: '14px 16px',
      fontSize: '15px',
      fontWeight: 500,
      borderRadius: '14px',
      cursor: selected ? 'default' : 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      textAlign: 'left',
      lineHeight: 1.4,
    }

    if (!selected) {
      return {
        ...base,
        backgroundColor: 'var(--tg-secondary-bg-color)',
        border: '2px solid transparent',
        color: 'var(--tg-text-color)',
      }
    }

    const isCorrectOption = option === correctAnswer
    const isSelected = option === selected

    if (isCorrectOption) {
      return {
        ...base,
        backgroundColor: '#34c75915',
        border: '2px solid #34c759',
        color: '#34c759',
        fontWeight: 700,
      }
    }

    if (isSelected && !isCorrectOption) {
      return {
        ...base,
        backgroundColor: '#ff3b3015',
        border: '2px solid #ff3b30',
        color: '#ff3b30',
      }
    }

    return {
      ...base,
      backgroundColor: 'var(--tg-secondary-bg-color)',
      border: '2px solid transparent',
      color: 'var(--tg-text-color)',
      opacity: 0.4,
    }
  }

  if (!loading && options.length < 2) {
    return (
      <div>
        <FlashCard card={card} showSide={showSide} revealed={false} />
        <div style={{
          marginTop: '16px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: 'var(--tg-secondary-bg-color)',
          borderRadius: '14px',
          color: 'var(--tg-hint-color)',
          fontSize: '14px',
        }}>
          {t('practice.addMoreCards')}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Show full card on incorrect, question-only otherwise */}
      {isIncorrectSelected ? (
        <FlashCard card={card} showSide={showSide} revealed={true} />
      ) : (
        <FlashCard card={card} showSide={showSide} revealed={false} />
      )}

      {/* Options grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: options.length <= 3 ? '1fr' : '1fr 1fr',
        gap: '8px',
        marginTop: '16px',
      }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              borderRadius: '14px',
              backgroundColor: 'var(--tg-secondary-bg-color)',
              border: '2px solid transparent',
              height: '48px',
              opacity: 0.5,
            }} />
          ))
        ) : (
          options.map((option, i) => (
            <button
              key={`${card.id}-${i}`}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              style={getOptionStyle(option)}
            >
              {option}
            </button>
          ))
        )}
      </div>

      {/* Continue button on incorrect */}
      {isIncorrectSelected && (
        <div style={{ marginTop: '16px' }}>
          <Button size="l" stretched onClick={handleContinue}>
            {t('practice.continue')}
          </Button>
        </div>
      )}
    </div>
  )
}
