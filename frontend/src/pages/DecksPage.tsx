import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Section, Cell, Button, Input } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import type { Deck } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function DecksPage() {
  const navigate = useNavigate()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [preferredDeckId, setPreferredDeckId] = useState<number | null>(null)

  const loadDecks = async () => {
    try {
      const [data, prefs] = await Promise.all([api.getDecks(), api.getPreferences()])
      setDecks(data.decks)
      setPreferredDeckId(prefs.preferred_deck_id)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDecks()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await api.createDeck({ name: newName.trim() })
      WebApp.HapticFeedback.notificationOccurred('success')
      setNewName('')
      setCreating(false)
      loadDecks()
    } catch {
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setSaving(false)
    }
  }

  const handleSetPreferred = async (deck: Deck) => {
    try {
      await api.updatePreferences({ preferred_deck_id: deck.id })
      setPreferredDeckId(deck.id)
      WebApp.HapticFeedback.notificationOccurred('success')
    } catch {
      WebApp.HapticFeedback.notificationOccurred('error')
    }
  }

  const handleDelete = (deck: Deck) => {
    if (deck.is_default) return
    WebApp.showConfirm(
      `Delete "${deck.name}"? Cards will be moved to Default.`,
      async (confirmed) => {
        if (!confirmed) return
        try {
          await api.deleteDeck(deck.id)
          WebApp.HapticFeedback.notificationOccurred('success')
          loadDecks()
        } catch {
          WebApp.HapticFeedback.notificationOccurred('error')
        }
      }
    )
  }

  if (loading) return <LoadingSpinner text="Loading decks..." />

  if (!loading && decks.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon="🗂"
          title="No Decks"
          description="Add a card to get started — a default deck will be created automatically."
          action={{ label: 'Add Card', onClick: () => navigate('/add') }}
        />
      </div>
    )
  }

  const totalCards = decks.reduce((sum, d) => sum + d.card_count, 0)

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Decks</h1>
        <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '14px' }}>
          {decks.length} deck{decks.length !== 1 ? 's' : ''} · {totalCards} card{totalCards !== 1 ? 's' : ''}
        </p>
      </div>

      {/* All Cards shortcut */}
      <Section>
        <Cell
          onClick={() => navigate('/cards')}
          after={
            <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
              {totalCards}
            </span>
          }
          before={<span style={{ fontSize: '20px' }}>📋</span>}
        >
          All Cards
        </Cell>
      </Section>

      <Section header="Decks">
        {decks.map((deck) => (
          <Cell
            key={deck.id}
            onClick={() => navigate(`/cards?deck=${deck.id}`)}
            subtitle={deck.description || `${deck.card_count} card${deck.card_count !== 1 ? 's' : ''}`}
            after={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
                  {deck.card_count}
                </span>
                {preferredDeckId !== deck.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetPreferred(deck)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px',
                      opacity: 0.35,
                    }}
                    title="Set as preferred deck"
                  >
                    ⭐
                  </button>
                )}
                {!deck.is_default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(deck)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px',
                      opacity: 0.5,
                    }}
                  >
                    🗑
                  </button>
                )}
              </div>
            }
            before={
              <span style={{ fontSize: '20px' }}>
                {preferredDeckId === deck.id ? '⭐' : deck.is_default ? '📋' : '📁'}
              </span>
            }
          >
            {deck.name}
          </Cell>
        ))}
      </Section>

      {/* Create deck form */}
      {creating ? (
        <Section header="New Deck">
          <div style={{ padding: '8px 16px 16px' }}>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Deck name"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <Button
                size="s"
                mode="outline"
                stretched
                onClick={() => { setCreating(false); setNewName('') }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="s"
                stretched
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
              >
                {saving ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </Section>
      ) : (
        <div style={{ padding: '16px' }}>
          <Button
            size="l"
            mode="outline"
            stretched
            onClick={() => setCreating(true)}
          >
            + New Deck
          </Button>
        </div>
      )}
    </div>
  )
}
