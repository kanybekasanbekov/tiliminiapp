import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Section, Cell, Button, Input } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import { useApp } from '../contexts/AppContext'
import type { Deck } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { useTranslation } from '../i18n'

export default function DecksPage() {
  const navigate = useNavigate()
  const { activeLanguagePair, languagePairVersion } = useApp()
  const { t } = useTranslation()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [preferredDeckId, setPreferredDeckId] = useState<number | null>(null)

  // Edit deck state
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [editDeckName, setEditDeckName] = useState('')
  const [editDeckSaving, setEditDeckSaving] = useState(false)

  const loadDecks = async () => {
    try {
      const [data, prefs] = await Promise.all([api.getDecks(activeLanguagePair), api.getPreferences()])
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
  }, [languagePairVersion])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await api.createDeck({ name: newName.trim(), language_pair: activeLanguagePair })
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

  const handleEditDeck = async () => {
    if (!editingDeck || !editDeckName.trim()) return
    setEditDeckSaving(true)
    try {
      await api.updateDeck(editingDeck.id, { name: editDeckName.trim() })
      WebApp.HapticFeedback.notificationOccurred('success')
      setEditingDeck(null)
      setEditDeckName('')
      loadDecks()
    } catch {
      WebApp.HapticFeedback.notificationOccurred('error')
    } finally {
      setEditDeckSaving(false)
    }
  }

  const handleDelete = (deck: Deck) => {
    if (deck.is_default) return
    WebApp.showConfirm(
      t('decks.confirmDelete', { name: deck.name }),
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

  if (loading) return <LoadingSpinner text={t('decks.loading')} />

  if (!loading && decks.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon="🗂"
          title={t('decks.noDecks')}
          description={t('decks.noDecksDesc')}
          action={{ label: t('decks.addCard'), onClick: () => navigate('/add') }}
        />
      </div>
    )
  }

  const totalCards = decks.reduce((sum, d) => sum + d.card_count, 0)

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{t('decks.myDecks')}</h1>
        <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '14px' }}>
          {t('decks.count', { decks: decks.length, ds: decks.length !== 1 ? 's' : '', cards: totalCards, cs: totalCards !== 1 ? 's' : '' })}
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
          {t('decks.allCards')}
        </Cell>
      </Section>

      <Section header={t('decks.decks')}>
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
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditDeckName(deck.name)
                    setEditingDeck(deck)
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
                  ✏️
                </button>
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
                    title={t('decks.setPreferred')}
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
        <Section header={t('decks.newDeckHeader')}>
          <div style={{ padding: '8px 16px 16px' }}>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('decks.deckName')}
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
                {t('decks.cancel')}
              </Button>
              <Button
                size="s"
                stretched
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
              >
                {saving ? t('decks.creating') : t('decks.create')}
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
            {t('decks.newDeck')}
          </Button>
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>{t('decks.editDeck')}</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                {t('decks.deckName')}
              </label>
              <Input
                value={editDeckName}
                onChange={(e) => setEditDeckName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditDeck()}
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
                {t('decks.cancel')}
              </Button>
              <Button
                size="l"
                stretched
                onClick={handleEditDeck}
                disabled={editDeckSaving || !editDeckName.trim()}
              >
                {editDeckSaving ? t('decks.saving') : t('decks.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
