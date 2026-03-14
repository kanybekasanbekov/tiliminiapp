import { useState, useEffect, useRef } from 'react'
import { Section, Cell, Button, Input } from '@telegram-apps/telegram-ui'
import WebApp from '@twa-dev/sdk'
import { api } from '../api'
import type { Flashcard, Deck } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import FlashCard from '../components/FlashCard'
import ExplainButton from '../components/ExplainButton'
import MoveDeckModal from '../components/MoveDeckModal'
import EditCardModal from '../components/EditCardModal'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { getLanguageNames } from '../utils/languages'
import { useTranslation } from '../i18n'

export default function CardsListPage() {
  const navigate = useNavigate()
  const { activeLanguagePair, languagePairVersion, appLanguage } = useApp()
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialDeckParam = useRef(searchParams.get('deck'))

  const [cards, setCards] = useState<Flashcard[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Flashcard[]>([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchTotalPages, setSearchTotalPages] = useState(1)
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSearchActive = searchQuery.trim().length > 0

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

  // Move card modal state
  const [movingCard, setMovingCard] = useState<Flashcard | null>(null)

  // View overlay state
  const [viewingCard, setViewingCard] = useState<Flashcard | null>(null)
  const [viewRevealed, setViewRevealed] = useState(false)

  // Clear URL param on mount if present
  useEffect(() => {
    if (initialDeckParam.current) {
      setSearchParams({}, { replace: true })
    }
  }, [])

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

  const loadCards = async (p: number, deckId?: number) => {
    setLoading(true)
    try {
      const data = await api.getCards(p, 100, deckId, activeLanguagePair)
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

  const loadSearchResults = async (query: string, p: number) => {
    if (!query.trim()) return
    setSearchLoading(true)
    try {
      const data = await api.searchCards(query.trim(), p, 100, activeLanguagePair)
      setSearchResults(data.cards)
      setSearchTotalPages(data.total_pages)
      setSearchTotal(data.total)
      setSearchPage(p)
    } catch {
      // ignore
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!value.trim()) {
      setSearchResults([])
      setSearchTotal(0)
      return
    }
    searchTimerRef.current = setTimeout(() => {
      loadSearchResults(value, 1)
    }, 300)
  }

  const prevLangVersion = useRef(languagePairVersion)
  useEffect(() => {
    loadDecks()
    // Only reset deck selection when language pair actually changes, not on initial mount
    if (prevLangVersion.current !== languagePairVersion) {
      setSelectedDeckId(undefined)
      setSearchQuery('')
      setSearchResults([])
      prevLangVersion.current = languagePairVersion
    }
  }, [languagePairVersion])

  useEffect(() => {
    loadCards(1, selectedDeckId)
  }, [selectedDeckId, languagePairVersion])

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
      const newDeck = await api.createDeck({ name: createName.trim(), language_pair: activeLanguagePair })
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
      t('cards.confirmDeleteDeck', { name: deck.name }),
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
      t('cards.confirmDeleteCard', { name: card.source_text }),
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
    setEditingCard(card)
  }

  const openView = (card: Flashcard) => {
    setViewRevealed(false)
    setViewingCard(card)
  }

  if (loading && cards.length === 0 && decksLoading) return <LoadingSpinner text={t('cards.loading')} />

  return (
    <div className="page">
      <div style={{ padding: '24px 16px 8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
          {selectedDeck ? selectedDeck.name : t('cards.myCards')}
        </h1>
        <p style={{ color: 'var(--tg-hint-color)', marginTop: '4px', fontSize: '14px' }}>
          {t('cards.cardCount', { count: total, s: total !== 1 ? 's' : '' })}{selectedDeckId != null ? t('cards.inThisDeck') : t('cards.total')}
        </p>
      </div>

      {/* Search input */}
      <div style={{ padding: '0 16px 8px', position: 'relative' }}>
        <Input
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('cards.search')}
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            style={{
              position: 'absolute',
              right: '28px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: 'var(--tg-hint-color)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isSearchActive && (
        <div style={{ padding: '0 16px 8px' }}>
          <p style={{ color: 'var(--tg-hint-color)', fontSize: '13px' }}>
            {searchLoading ? t('cards.loading') : t('cards.searchResults', { count: searchTotal, s: searchTotal !== 1 ? 's' : '' })}
          </p>
        </div>
      )}

      {/* Deck chip bar — hidden during search */}
      {!isSearchActive && <div style={{
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
          {t('cards.all', { count: totalCardCount })}
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
          {t('cards.new')}
        </button>
      </div>}

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
                  {t('cards.editName')}
                </Button>
                {!deck.is_default && (
                  <Button
                    size="l"
                    mode="outline"
                    stretched
                    onClick={() => handleDeleteDeck(deck)}
                    style={{ color: '#ff3b30' }}
                  >
                    {t('cards.deleteDeck')}
                  </Button>
                )}
                <Button
                  size="l"
                  mode="outline"
                  stretched
                  onClick={() => setActionDeckId(null)}
                >
                  {t('cards.cancel')}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Card list — search results or normal */}
      {(() => {
        const displayCards = isSearchActive ? searchResults : cards
        const displayLoading = isSearchActive ? searchLoading : loading
        const displayPage = isSearchActive ? searchPage : page
        const displayTotalPages = isSearchActive ? searchTotalPages : totalPages

        return (
          <>
            {!displayLoading && displayCards.length === 0 ? (
              <div style={{ padding: '32px 16px' }}>
                <EmptyState
                  icon={isSearchActive ? "🔍" : "🗂"}
                  title={isSearchActive ? t('cards.noSearchResults') : (selectedDeckId != null ? t('cards.noCardsInDeck') : t('cards.noCardsYet'))}
                  description={isSearchActive ? t('cards.noSearchResultsSub') : (selectedDeckId != null ? t('cards.noCardsInDeckSub') : t('cards.noCardsYetSub'))}
                  action={isSearchActive ? undefined : { label: t('cards.addCard'), onClick: () => navigate('/add') }}
                />
              </div>
            ) : (
              <Section>
                {displayCards.map((card) => (
                  <div key={card.id}>
                    <Cell
                      onClick={() => setExpandedId(expandedId === card.id ? null : card.id)}
                      subtitle={card.target_text}
                      after={
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--tg-hint-color)' }}>
                            {new Date(card.next_review).toLocaleDateString()}
                          </span>
                          {isSearchActive && card.deck_name && (
                            <span style={{
                              fontSize: '10px',
                              color: 'var(--tg-button-text-color)',
                              backgroundColor: 'var(--tg-button-color)',
                              borderRadius: '8px',
                              padding: '1px 6px',
                              whiteSpace: 'nowrap',
                            }}>
                              {card.deck_name}
                            </span>
                          )}
                        </div>
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
                            <div style={{ color: 'var(--tg-hint-color)', fontSize: '12px', marginBottom: '2px' }}>{t('cards.example')}</div>
                            <div>{card.example_source}</div>
                            {card.example_target && (
                              <div style={{ color: 'var(--tg-hint-color)', fontStyle: 'italic', marginTop: '2px' }}>
                                {card.example_target}
                              </div>
                            )}
                          </div>
                        )}
                        {isSearchActive && card.deck_name && (
                          <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--tg-hint-color)' }}>
                            {t('cards.deck')}: <strong style={{ color: 'var(--tg-text-color)' }}>{card.deck_name}</strong>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--tg-hint-color)', marginBottom: '12px' }}>
                          <span>{t('cards.ease')} {card.ease_factor.toFixed(2)}</span>
                          <span>{t('cards.interval')} {card.interval_days}d</span>
                          <span>{t('cards.reps')} {card.repetitions}</span>
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
                            {t('cards.view')}
                          </Button>
                          <Button
                            size="s"
                            mode="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(card)
                            }}
                          >
                            {t('cards.edit')}
                          </Button>
                          <Button
                            size="s"
                            mode="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setMovingCard(card)
                            }}
                          >
                            {t('cards.move')}
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
                            {t('cards.delete')}
                          </Button>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <ExplainButton key={card.id} cardId={card.id} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {displayTotalPages > 1 && (
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
                  disabled={displayPage <= 1}
                  onClick={() => isSearchActive ? loadSearchResults(searchQuery, searchPage - 1) : loadCards(page - 1, selectedDeckId)}
                >
                  {t('cards.previous')}
                </Button>
                <span style={{ fontSize: '14px', color: 'var(--tg-hint-color)' }}>
                  {displayPage} / {displayTotalPages}
                </span>
                <Button
                  size="s"
                  mode="outline"
                  disabled={displayPage >= displayTotalPages}
                  onClick={() => isSearchActive ? loadSearchResults(searchQuery, searchPage + 1) : loadCards(page + 1, selectedDeckId)}
                >
                  {t('cards.next')}
                </Button>
              </div>
            )}
          </>
        )
      })()}

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
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>{t('cards.newDeck')}</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                {t('cards.deckName')}
              </label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t('cards.deckPlaceholder')}
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
                {t('cards.cancel')}
              </Button>
              <Button
                size="l"
                stretched
                onClick={handleCreateDeck}
                disabled={createSaving || !createName.trim()}
              >
                {createSaving ? t('cards.creating') : t('cards.create')}
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>{t('cards.editDeck')}</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--tg-hint-color)', display: 'block', marginBottom: '4px' }}>
                {t('cards.deckName')}
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
                {t('cards.cancel')}
              </Button>
              <Button
                size="l"
                stretched
                onClick={handleEditDeck}
                disabled={editDeckSaving || !editDeckName.trim()}
              >
                {editDeckSaving ? t('cards.saving') : t('cards.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <EditCardModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSaved={() => {
            setEditingCard(null)
            loadCards(page, selectedDeckId)
          }}
        />
      )}

      {/* Move Card Modal */}
      {movingCard && (
        <MoveDeckModal
          cardId={movingCard.id}
          currentDeckId={movingCard.deck_id}
          decks={decks}
          onClose={() => setMovingCard(null)}
          onMoved={() => {
            setMovingCard(null)
            loadCards(page, selectedDeckId)
            loadDecks()
            if (isSearchActive) loadSearchResults(searchQuery, searchPage)
          }}
        />
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              <div style={{ width: '100%' }}>
                <FlashCard card={viewingCard} showSide="source" revealed={viewRevealed} />
              </div>
            </div>

            {/* Action buttons right below card */}
            {viewRevealed && (
              <div style={{ paddingTop: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <ExplainButton key={viewingCard.id} cardId={viewingCard.id} />
                <button
                  onClick={() => { openEdit(viewingCard); setViewingCard(null) }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1.5px solid var(--tg-button-color)',
                    background: 'transparent',
                    color: 'var(--tg-button-color)',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('cards.edit')}
                </button>
                <button
                  onClick={() => setMovingCard(viewingCard)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1.5px solid var(--tg-button-color)',
                    background: 'transparent',
                    color: 'var(--tg-button-color)',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('cards.move')}
                </button>
              </div>
            )}

            {/* Close/Show Answer pushed to bottom */}
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              {!viewRevealed ? (
                <Button
                  size="l"
                  stretched
                  onClick={() => setViewRevealed(true)}
                >
                  {t('cards.showAnswer')}
                </Button>
              ) : (
                <Button
                  size="l"
                  stretched
                  mode="outline"
                  onClick={() => setViewingCard(null)}
                >
                  {t('cards.close')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
