import { useState, useEffect, useRef } from 'react'
import { Section, Cell, Button, Input } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import type { Flashcard, Deck } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import FlashCard from '../components/FlashCard'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getLanguageNames } from '../utils/languages'

export default function CardsListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialDeckParam = useRef(searchParams.get('deck'))

  const [cards, setCards] = useState<Flashcard[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Deck state
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<number | undefined>(
    initialDeckParam.current ? Number(initialDeckParam.current) : undefined
  )
  const [decksLoading, setDecksLoading] = useState(true)

  // Deck action menu
  const [actionDeckId, setActionDeckId] = useState<number | null>(null)

  // Create deck modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSaving, setCreateSaving] = useState(false)

  // Edit deck modal
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [editDeckName, setEditDeckName] = useState('')
  const [editDeckSaving, setEditDeckSaving] = useState(false)

  // Edit card modal state
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [editForm, setEditForm] = useState({ target_text: '', example_source: '', example_target: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // View overlay state
  const [viewingCard, setViewingCard] = useState<Flashcard | null>(null)
  const [viewRevealed, setViewRevealed] = useState(false)

  const editLang = editingCard ? getLanguageNames(editingCard.language_pair) : { source: '', target: '' }

  // Clear URL param on mount if present
  useEffect(() => {
    if (initialDeckParam.current) {
      setSearchParams({}, { replace: true })
    }
  }, [])

  const loadDecks = async () => {
    setDecksLoading(true)
    try {
      const data = await api.getDecks()
      setDecks(data.decks)
    } catch {
      // ignore
    } finally {
      setDecksLoading(false)
    }
  }

  const loadCards = async (p: number, deckId?: number) => {
    setLoading(true)
    try {
      const data = await api.getCards(p, 10, deckId)
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
    loadDecks()
  }, [])

  useEffect(() => {
    loadCards(1, selectedDeckId)
  }, [selectedDeckId])

  const handleChipTap = (deckId: number | undefined) => {
    if (deckId === selectedDeckId && deckId != null) {
      // Tapping already-selected deck → show action menu
      setActionDeckId(deckId)
    } else {
      setSelectedDeckId(deckId)
      setActionDeckId(null)
    }
  }

  const selectedDeck = decks.find((d) => d.id === selectedDeckId)
  const totalCardCount = decks.reduce((sum, d) => sum + d.card_count, 0)

  // --- Deck CRUD ---

  const handleCreateDeck = async () => {
    if (!createName.trim()) return
    setCreateSaving(true)
    try {
      const newDeck = await api.createDeck({ name: createName.trim() })
      WebApp.HapticFeedback.notificationOccurred('success')
      setShowCreateModal(false)
      setCreateName('')
      await loadDecks()
      setSelectedDeckId(newDeck.id)
    } catch {
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setCreateSaving(false)
    }
  }

  const handleEditDeck = async () => {
    if (!editingDeck || !editDeckName.trim()) return
    setEditDeckSaving(true)
    try {
      await api.updateDeck(editingDeck.id, { name: editDeckName.trim() })
      WebApp.HapticFeedback.notificationOccurred('success')
      setEditingDeck(null)
      setEditDeckName('')
      await loadDecks()
    } catch {
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setEditDeckSaving(false)
    }
  }

  const handleDeleteDeck = (deck: Deck) => {
    if (deck.is_default) return
    setActionDeckId(null)
    WebApp.showConfirm(
      `Delete "${deck.name}"? Cards will be moved to the default deck.`,
      async (confirmed) => {
        if (!confirmed) return
        try {
          await api.deleteDeck(deck.id)
          WebApp.HapticFeedback.notificationOccurred('success')
          setSelectedDeckId(undefined)
          await loadDecks()
          loadCards(1, undefined)
        } catch {
          WebApp.HapticFeedback.notificationOccurred('error')
        }
      }
    )
  }

  // --- Card CRUD ---

  const handleDelete = async (card: Flashcard) => {
    WebApp.showConfirm(
      `Delete "${card.source_text}"?`,
      async (confirmed) => {
        if (!confirmed) return
        try {
          await api.deleteCard(card.id)
          WebApp.HapticFeedback.notificationOccurred('success')
          loadCards(page, selectedDeckId)
          loadDecks()
        } catch {
          WebApp.HapticFeedback.notificationOccurred('error')
        }
      }
    )
  }

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
      await api.updateCard(editingCard.id, editForm)
      WebApp.HapticFeedback.notificationOccurred('success')
      setEditingCard(null)
      loadCards(page, selectedDeckId)
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

  if (loading && cards.length === 0 && decksLoading) return <LoadingSpinner text="Loading cards..." />

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
          {selectedDeck ? selectedDeck.name : 'My Cards'}
        </h1>
        <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '14px' }}>
          {total} card{total !== 1 ? 's' : ''}{selectedDeckId != null ? ' in this deck' : ' total'}
        </p>
      </div>

      {/* Deck chip bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '4px 16px 12px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        <style>{`.chip-bar::-webkit-scrollbar { display: none; }`}</style>
        {/* All chip */}
        <button
          className="chip-bar"
          onClick={() => handleChipTap(undefined)}
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
          All ({totalCardCount})
        </button>

        {decks.map((deck) => (
          <button
            key={deck.id}
            className="chip-bar"
            onClick={() => handleChipTap(deck.id)}
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

        {/* + New chip */}
        <button
          className="chip-bar"
          onClick={() => { setShowCreateModal(true); setCreateName('') }}
          style={{
            flexShrink: 0,
            border: '1.5px dashed var(--tg-hint-color)',
            borderRadius: '16px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--tg-hint-color)',
          }}
        >
          + New
        </button>
      </div>

      {/* Deck action menu */}
      {actionDeckId != null && (() => {
        const deck = decks.find((d) => d.id === actionDeckId)
        if (!deck) return null
        return (
          <div
            onClick={() => setActionDeckId(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
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
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', textAlign: 'center' }}>
                {deck.name}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button
                  size="l"
                  mode="outline"
                  stretched
                  onClick={() => {
                    setActionDeckId(null)
                    setEditDeckName(deck.name)
                    setEditingDeck(deck)
                  }}
                >
                  Edit Name
                </Button>
                {!deck.is_default && (
                  <Button
                    size="l"
                    mode="outline"
                    stretched
                    onClick={() => handleDeleteDeck(deck)}
                    style={{ color: '#ff3b30' }}
                  >
                    Delete Deck
                  </Button>
                )}
                <Button
                  size="l"
                  mode="outline"
                  stretched
                  onClick={() => setActionDeckId(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Card list or empty state */}
      {!loading && cards.length === 0 ? (
        <div style={{ padding: '32px 16px' }}>
          <EmptyState
            icon="🗂"
            title={selectedDeckId != null ? 'No Cards in This Deck' : 'No Cards Yet'}
            description={selectedDeckId != null ? 'Add cards and assign them to this deck.' : 'Add your first flashcard to get started!'}
            action={{ label: 'Add Card', onClick: () => navigate('/add') }}
          />
        </div>
      ) : (
        <Section>
          {cards.map((card) => (
            <div key={card.id}>
              <Cell
                onClick={() => setExpandedId(expandedId === card.id ? null : card.id)}
                subtitle={card.target_text}
                after={
                  <span style={{ fontSize: '11px', color: 'var(--tg-hint-color)' }}>
                    {new Date(card.next_review).toLocaleDateString()}
                  </span>
                }
              >
                {card.source_text}
              </Cell>
              {expandedId === card.id && (
                <div style={{
                  padding: '12px 16px 16px',
                  backgroundColor: 'var(--tg-secondary-bg-color)',
                  fontSize: '14px',
                }}>
                  {card.example_source && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ color: 'var(--tg-hint-color)', fontSize: '12px', marginBottom: '2px' }}>Example</div>
                      <div>{card.example_source}</div>
                      {card.example_target && (
                        <div style={{ color: 'var(--tg-hint-color)', fontStyle: 'italic', marginTop: '2px' }}>
                          {card.example_target}
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
      )}

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
            onClick={() => loadCards(page - 1, selectedDeckId)}
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
            onClick={() => loadCards(page + 1, selectedDeckId)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Deck Modal */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>New Deck</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                Deck Name
              </label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. TOPIK Vocab"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                size="l"
                mode="outline"
                stretched
                onClick={() => setShowCreateModal(false)}
                disabled={createSaving}
              >
                Cancel
              </Button>
              <Button
                size="l"
                stretched
                onClick={handleCreateDeck}
                disabled={createSaving || !createName.trim()}
              >
                {createSaving ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deck Modal */}
      {editingDeck && (
        <div
          onClick={() => setEditingDeck(null)}
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Edit Deck</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                Deck Name
              </label>
              <Input
                value={editDeckName}
                onChange={(e) => setEditDeckName(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                size="l"
                mode="outline"
                stretched
                onClick={() => setEditingDeck(null)}
                disabled={editDeckSaving}
              >
                Cancel
              </Button>
              <Button
                size="l"
                stretched
                onClick={handleEditDeck}
                disabled={editDeckSaving || !editDeckName.trim()}
              >
                {editDeckSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
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
                {editLang.target}
              </label>
              <Input
                value={editForm.target_text}
                onChange={(e) => setEditForm({ ...editForm, target_text: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                {`Example (${editLang.source})`}
              </label>
              <Input
                value={editForm.example_source}
                onChange={(e) => setEditForm({ ...editForm, example_source: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                {`Example (${editLang.target})`}
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
                <FlashCard card={viewingCard} showSide="source" revealed={viewRevealed} />
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
