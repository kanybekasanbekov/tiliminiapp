export interface Flashcard {
  id: number
  user_id: number
  source_text: string
  target_text: string
  example_source: string | null
  example_target: string | null
  language_pair: string
  created_at: string
  next_review: string
  ease_factor: number
  interval_days: number
  repetitions: number
  deck_id: number
}

export interface Deck {
  id: number
  user_id: number
  name: string
  description: string
  language_pair: string
  is_default: number
  card_count: number
  created_at: string
  updated_at: string
}

export interface TranslationResult {
  source_text: string
  target_text: string
  example_source: string
  example_target: string
}

export interface PaginatedCards {
  cards: Flashcard[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface DueCardsResponse {
  cards: Flashcard[]
  total_due: number
}

export interface ReviewResponse {
  next_review: string
  interval_days: number
  remaining_due: number
}

export interface UserStats {
  total: number
  due: number
  distribution: {
    new: number
    learning: number
    young: number
    mature: number
  }
}

export interface UserPreferences {
  id: number
  preferred_deck_id: number | null
  active_language_pair: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'
