import WebApp from '@twa-dev/sdk'
import type {
  TranslationResult,
  Flashcard,
  PaginatedCards,
  DueCardsResponse,
  ReviewResponse,
  UserStats,
  UserPreferences,
  Difficulty,
  Deck,
  AdminGlobalStats,
  AdminUserStats,
} from './types'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  // Attach Telegram initData for authentication
  const initData = WebApp.initData
  if (initData) {
    headers['Authorization'] = `tma ${initData}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }

  return res.json()
}

// Cards API
export const api = {
  translateWord: (word: string, languagePair: string = 'ko-en') =>
    request<TranslationResult>('/api/cards/translate', {
      method: 'POST',
      body: JSON.stringify({ word, language_pair: languagePair }),
    }),

  createCard: (card: Omit<TranslationResult, never> & { deck_id?: number; language_pair?: string }) =>
    request<Flashcard>('/api/cards', {
      method: 'POST',
      body: JSON.stringify(card),
    }),

  getCards: (page = 1, perPage = 10, deckId?: number, languagePair?: string) => {
    let url = `/api/cards?page=${page}&per_page=${perPage}`
    if (deckId != null) url += `&deck_id=${deckId}`
    if (languagePair) url += `&language_pair=${languagePair}`
    return request<PaginatedCards>(url)
  },

  searchCards: (query: string, page = 1, perPage = 10, languagePair?: string) => {
    let url = `/api/cards/search?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
    if (languagePair) url += `&language_pair=${languagePair}`
    return request<PaginatedCards>(url)
  },

  getCard: (id: number) =>
    request<Flashcard>(`/api/cards/${id}`),

  updateCard: (id: number, data: { target_text?: string; example_source?: string; example_target?: string }) =>
    request<Flashcard>(`/api/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCard: (id: number) =>
    request<{ deleted: boolean }>(`/api/cards/${id}`, { method: 'DELETE' }),

  getExplanation: (cardId: number) =>
    request<{ explanation: string; card_id: number }>(`/api/cards/${cardId}/explanation`),

  generateExplanation: (cardId: number) =>
    request<{ explanation: string; card_id: number }>(`/api/cards/${cardId}/explanation`, {
      method: 'POST',
    }),

  explainWord: (source_text: string, target_text: string, language_pair: string) =>
    request<{ explanation: string }>('/api/cards/explain', {
      method: 'POST',
      body: JSON.stringify({ source_text, target_text, language_pair }),
    }),

  // Decks API
  getDecks: (languagePair?: string) => {
    let url = '/api/decks'
    if (languagePair) url += `?language_pair=${languagePair}`
    return request<{ decks: Deck[] }>(url)
  },

  createDeck: (data: { name: string; description?: string; language_pair?: string }) =>
    request<Deck>('/api/decks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDeck: (id: number) =>
    request<Deck>(`/api/decks/${id}`),

  updateDeck: (id: number, data: { name?: string; description?: string }) =>
    request<Deck>(`/api/decks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDeck: (id: number) =>
    request<{ deleted: boolean }>(`/api/decks/${id}`, { method: 'DELETE' }),

  moveCard: (deckId: number, cardId: number) =>
    request<{ moved: boolean }>(`/api/decks/${deckId}/move-card`, {
      method: 'POST',
      body: JSON.stringify({ card_id: cardId }),
    }),

  // Practice API
  getDueCards: (limit = 20, languagePair?: string, deckId?: number) => {
    let url = `/api/practice/due?limit=${limit}`
    if (languagePair) url += `&language_pair=${languagePair}`
    if (deckId != null) url += `&deck_id=${deckId}`
    return request<DueCardsResponse>(url)
  },

  submitReview: (cardId: number, difficulty: Difficulty) =>
    request<ReviewResponse>('/api/practice/review', {
      method: 'POST',
      body: JSON.stringify({ card_id: cardId, difficulty }),
    }),

  // Stats API
  getStats: (languagePair?: string) => {
    let url = '/api/stats'
    if (languagePair) url += `?language_pair=${languagePair}`
    return request<UserStats>(url)
  },

  // User Preferences API
  getPreferences: () => request<UserPreferences>('/api/user/preferences'),

  updatePreferences: (data: { preferred_deck_id?: number | null; active_language_pair?: string }) =>
    request<UserPreferences>('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Admin API
  checkAdmin: () =>
    request<{ is_admin: boolean }>('/api/admin/check'),

  getAdminStats: () =>
    request<AdminGlobalStats>('/api/admin/stats'),

  getAdminUsers: () =>
    request<{ users: AdminUserStats[] }>('/api/admin/users'),
}
