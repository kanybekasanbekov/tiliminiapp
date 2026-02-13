import { useState, useEffect } from 'react'
import { Section, Cell, Button, Input } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import type { Flashcard } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import FlashCard from '../components/FlashCard'
import { useNavigate } from 'react-router-dom'

export default function CardsListPage() {
  const navigate = useNavigate()
  const [cards, setCards] = useState<Flashcard[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Edit modal state
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [editForm, setEditForm] = useState({ english: '', example_kr: '', example_en: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // View overlay state
  const [viewingCard, setViewingCard] = useState<Flashcard | null>(null)
  const [viewRevealed, setViewRevealed] = useState(false)

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

  const openEdit = (card: Flashcard) => {
    setEditForm({
      english: card.english,
      example_kr: card.example_kr || '',
      example_en: card.example_en || '',
    })
    setEditError('')
    setEditingCard(card)
  }

  const handleEditSave = async () => {
    if (!editingCard) return
    setEditSaving(true)
    setEditError('')
    try {
      await api.updateCard(editingCard.id, editForm)
      WebApp.HapticFeedback.notificationOccurred('success')
      setEditingCard(null)
      loadCards(page)
    } catch (e: any) {
      setEditError(e.message || 'Failed to save')
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setEditSaving(false)
    }
  }

  const openView = (card: Flashcard) => {
    setViewRevealed(false)
    setViewingCard(card)
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="s"
                    mode="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      openView(card)
                    }}
                  >
                    View
                  </Button>
                  <Button
                    size="s"
                    mode="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(card)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="s"
                    mode="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(card)
                    }}
                    style={{ color: '#ff3b30' }}
                  >
                    Delete
                  </Button>
                </div>
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Edit Card</h2>
            <p style={{ fontSize: '16px', color: 'var(--tg-hint-color)', marginBottom: '20px' }}>
              {editingCard.korean}
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
                English
              </label>
              <Input
                value={editForm.english}
                onChange={(e) => setEditForm({ ...editForm, english: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                Example (Korean)
              </label>
              <Input
                value={editForm.example_kr}
                onChange={(e) => setEditForm({ ...editForm, example_kr: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                Example (English)
              </label>
              <Input
                value={editForm.example_en}
                onChange={(e) => setEditForm({ ...editForm, example_en: e.target.value })}
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
                Cancel
              </Button>
              <Button
                size="l"
                stretched
                onClick={handleEditSave}
                disabled={editSaving}
              >
                {editSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Card Overlay */}
      {viewingCard && (
        <div
          onClick={() => setViewingCard(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--tg-bg-color)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%' }}>
                <FlashCard card={viewingCard} showSide="korean" revealed={viewRevealed} />
              </div>
            </div>
            <div style={{ paddingTop: '16px' }}>
              {!viewRevealed ? (
                <Button
                  size="l"
                  stretched
                  onClick={() => setViewRevealed(true)}
                >
                  Show Answer
                </Button>
              ) : (
                <Button
                  size="l"
                  stretched
                  mode="outline"
                  onClick={() => setViewingCard(null)}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
