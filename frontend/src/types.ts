export interface Flashcard {
  id: number
  user_id: number
  korean: string
  english: string
  example_kr: string | null
  example_en: string | null
  created_at: string
  next_review: string
  ease_factor: number
  interval_days: number
  repetitions: number
}

export interface TranslationResult {
  korean: string
  english: string
  example_kr: string
  example_en: string
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

export type Difficulty = 'easy' | 'medium' | 'hard'
