import { useState, useEffect } from 'react'
import { Section, Cell, Button } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import type { Flashcard } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { useNavigate } from 'react-router-dom'

export default function CardsListPage() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Flashcard[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const loadCards = async (p: number) => {
    setLoading(true)
    try {
      const data = await api.getCards(p, 10)
      setCards(data.cards)
      setTotalPages(data.total_pages)
      setTotal(data.total)
      setPage(p)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCards(1)
  }, [])

  const handleDelete = async (card: Flashcard) => {
    WebApp.showConfirm(
      `Delete "${card.korean}"?`,
      async (confirmed) => {
        if (!confirmed) return
        try {
          await api.deleteCard(card.id)
          WebApp.HapticFeedback.notificationOccurred('success')
          loadCards(page)
        } catch {
          WebApp.HapticFeedback.notificationOccurred('error')
        }
      }
    )
  }

  if (loading && cards.length === 0) return <LoadingSpinner text="Loading cards..." />

  if (!loading && cards.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon="🗂"
          title="No Cards Yet"
          description="Add your first Korean flashcard to get started!"
          action={{ label: 'Add Card', onClick: () => navigate('/add') }}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Cards</h1>
        <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '14px' }}>
          {total} card{total !== 1 ? 's' : ''} total
        </p>
      </div>

      <Section>
        {cards.map((card) => (
          <div key={card.id}>
            <Cell
              onClick={() => setExpandedId(expandedId === card.id ? null : card.id)}
              subtitle={card.english}
              after={
                <span style={{ fontSize: '11px', color: 'var(--tg-hint-color)' }}>
                  {new Date(card.next_review).toLocaleDateString()}
                </span>
              }
            >
              {card.korean}
            </Cell>
            {expandedId === card.id && (
              <div style={{
                padding: '12px 16px 16px',
                backgroundColor: 'var(--tg-secondary-bg-color)',
                fontSize: '14px',
              }}>
                {card.example_kr && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ color: 'var(--tg-hint-color)', fontSize: '12px', marginBottom: '2px' }}>Example</div>
                    <div>{card.example_kr}</div>
                    {card.example_en && (
                      <div style={{ color: 'var(--tg-hint-color)', fontStyle: 'italic', marginTop: '2px' }}>
                        {card.example_en}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--tg-hint-color)', marginBottom: '12px' }}>
                  <span>Ease: {card.ease_factor.toFixed(2)}</span>
                  <span>Interval: {card.interval_days}d</span>
                  <span>Reps: {card.repetitions}</span>
                </div>
                <Button
                  size="s"
                  mode="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(card)
                  }}
                  style={{ color: '#ff3b30' }}
                >
                  Delete Card
                </Button>
              </div>
            )}
          </div>
        ))}
      </Section>

      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
        }}>
          <Button
            size="s"
            mode="outline"
            disabled={page <= 1}
            onClick={() => loadCards(page - 1)}
          >
            Previous
          </Button>
          <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
            {page} / {totalPages}
          </span>
          <Button
            size="s"
            mode="outline"
            disabled={page >= totalPages}
            onClick={() => loadCards(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
