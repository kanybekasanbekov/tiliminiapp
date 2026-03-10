import { useState } from 'react'
import { Button } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import type { Deck } from '../types'
import { useTranslation } from '../i18n'

interface Props {
  cardId: number
  currentDeckId: number
  decks: Deck[]
  onMoved: (newDeckId: number) => void
  onClose: () => void
}

export default function MoveDeckModal({ cardId, currentDeckId, decks, onMoved, onClose }: Props) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)

  const handleMove = async (deckId: number) => {
    if (deckId === currentDeckId) return
    setSaving(true)
    try {
      await api.moveCard(deckId, cardId)
      WebApp.HapticFeedback.notificationOccurred('success')
      onMoved(deckId)
    } catch {
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
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--tg-bg-color)',
          borderRadius: '16px 16px 0 0',
          padding: '16px',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', textAlign: 'center' }}>
          {t('cards.moveToDeck')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {decks.map((deck) => (
            <Button
              key={deck.id}
              size="l"
              mode={deck.id === currentDeckId ? 'filled' : 'outline'}
              stretched
              disabled={deck.id === currentDeckId || saving}
              onClick={() => handleMove(deck.id)}
            >
              {deck.name}{deck.id === currentDeckId ? ` (${t('cards.current')})` : ''}
            </Button>
          ))}
          <Button
            size="l"
            mode="outline"
            stretched
            onClick={onClose}
            disabled={saving}
          >
            {t('cards.cancel')}
          </Button>
        </div>
      </div>
    </div>
  )
}
