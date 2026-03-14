import { useState, useRef, useEffect } from 'react'
import { Button } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import type { Flashcard } from '../types'
import FlashCard from './FlashCard'
import { useTranslation } from '../i18n'

interface TypeModeViewProps {
  card: Flashcard
  showSide: 'source' | 'target'
  onResult: (wasCorrect: boolean, responseTimeMs?: number) => void
}

function normalizeForComparison(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
    .replace(/[.,!?;:'"()\[\]{}]/g, '')
}

function checkAnswer(userInput: string, correctAnswer: string): boolean {
  const a = normalizeForComparison(userInput)
  const b = normalizeForComparison(correctAnswer)
  if (a === b) return true
  if (a.replace(/\s/g, '') === b.replace(/\s/g, '')) return true
  return false
}

export default function TypeModeView({ card, showSide, onResult }: TypeModeViewProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [lastResult, setLastResult] = useState<'incorrect' | null>(null)
  const [answered, setAnswered] = useState(false) // true when correct or gave up
  const [showCorrect, setShowCorrect] = useState(false) // brief green flash on correct
  const [gaveUp, setGaveUp] = useState(false)
  const [startTime] = useState(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const correctAnswer = showSide === 'source' ? card.target_text : card.source_text

  useEffect(() => {
    setInput('')
    setLastResult(null)
    setAnswered(false)
    setShowCorrect(false)
    setGaveUp(false)
    inputRef.current?.focus()
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    }
  }, [card.id])

  const handleFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }

  const handleCheck = () => {
    if (!input.trim() || answered) return
    if (checkAnswer(input, correctAnswer)) {
      WebApp.HapticFeedback.notificationOccurred('success')
      setAnswered(true)
      setShowCorrect(true)
      const responseTime = Date.now() - startTime
      // Brief green flash, then advance
      advanceTimerRef.current = setTimeout(() => {
        onResult(true, responseTime)
      }, 800)
    } else {
      WebApp.HapticFeedback.notificationOccurred('error')
      setLastResult('incorrect')
      // Clear input for retry
      setInput('')
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (gaveUp) {
        onResult(false, Date.now() - startTime)
      } else if (!answered) {
        handleCheck()
      }
    }
  }

  const handleShowAnswer = () => {
    setGaveUp(true)
    setAnswered(true)
    WebApp.HapticFeedback.notificationOccurred('error')
  }

  const handleContinue = () => {
    onResult(false, Date.now() - startTime)
  }

  const borderColor = showCorrect
    ? '#34c759'
    : lastResult === 'incorrect'
      ? '#ff3b30'
      : 'var(--tg-secondary-bg-color)'

  return (
    <div>
      {/* Show question card or revealed card when gave up */}
      {gaveUp ? (
        <FlashCard card={card} showSide={showSide} revealed={true} />
      ) : (
        <FlashCard card={card} showSide={showSide} revealed={false} />
      )}

      {/* Input area — hidden when gave up */}
      {!gaveUp && (
        <div style={{ marginTop: '16px' }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'stretch',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (lastResult) setLastResult(null)
              }}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder={t('practice.typeYourAnswer')}
              disabled={answered}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                flex: 1,
                padding: '14px 16px',
                fontSize: '16px',
                borderRadius: '14px',
                border: `2px solid ${borderColor}`,
                backgroundColor: 'var(--tg-secondary-bg-color)',
                color: 'var(--tg-text-color)',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
            />
            <Button
              size="l"
              onClick={handleCheck}
              disabled={!input.trim() || answered}
              style={{ flexShrink: 0 }}
            >
              {t('practice.check')}
            </Button>
          </div>

          {/* Correct flash */}
          {showCorrect && (
            <div style={{
              marginTop: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#34c75915',
              border: '1px solid #34c75940',
              fontSize: '16px',
              fontWeight: 700,
              color: '#34c759',
              textAlign: 'center',
            }}>
              {t('practice.correct')}
            </div>
          )}

          {/* Incorrect feedback — try again hint */}
          {lastResult === 'incorrect' && !showCorrect && (
            <div style={{
              marginTop: '8px',
              fontSize: '14px',
              color: '#ff3b30',
              fontWeight: 600,
            }}>
              {t('practice.incorrect')} — {t('practice.tryAgain')}
            </div>
          )}

          {/* Show Answer button */}
          <div style={{ marginTop: '12px' }}>
            <Button size="l" mode="outline" stretched onClick={handleShowAnswer}>
              {t('practice.showAnswer')}
            </Button>
          </div>
        </div>
      )}

      {/* Continue button when gave up */}
      {gaveUp && (
        <div style={{ marginTop: '16px' }}>
          <Button size="l" stretched onClick={handleContinue}>
            {t('practice.continue')}
          </Button>
        </div>
      )}
    </div>
  )
}
