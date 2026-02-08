import WebApp from '@twa-dev/sdk'
import type {
  TranslationResult,
  Flashcard,
  PaginatedCards,
  DueCardsResponse,
  ReviewResponse,
  UserStats,
  Difficulty,
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
  translateWord: (word: string) =>
    request<TranslationResult>('/api/cards/translate', {
      method: 'POST',
      body: JSON.stringify({ word }),
    }),

  createCard: (card: Omit<TranslationResult, never>) =>
    request<Flashcard>('/api/cards', {
      method: 'POST',
      body: JSON.stringify(card),
    }),

  getCards: (page = 1, perPage = 10) =>
    request<PaginatedCards>(`/api/cards?page=${page}&per_page=${perPage}`),

  getCard: (id: number) =>
    request<Flashcard>(`/api/cards/${id}`),

  updateCard: (id: number, data: { english?: string; example_kr?: string; example_en?: string }) =>
    request<Flashcard>(`/api/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCard: (id: number) =>
    request<{ deleted: boolean }>(`/api/cards/${id}`, { method: 'DELETE' }),

  // Practice API
  getDueCards: (limit = 20) =>
    request<DueCardsResponse>(`/api/practice/due?limit=${limit}`),

  submitReview: (cardId: number, difficulty: Difficulty) =>
    request<ReviewResponse>('/api/practice/review', {
      method: 'POST',
      body: JSON.stringify({ card_id: cardId, difficulty }),
    }),

  // Stats API
  getStats: () => request<UserStats>('/api/stats'),
}
