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
  deck_name?: string
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

export interface ImageTranslationItem extends TranslationResult {
  is_duplicate: boolean
}

export interface ImageTranslationResponse {
  translations: ImageTranslationItem[]
  count: number
}

export interface BatchCreateResult {
  created: number
  duplicates: number
  cards: Flashcard[]
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
  current_streak: number
  longest_streak: number
  last_practice_date: string | null
}

export interface UserPreferences {
  id: number
  preferred_deck_id: number | null
  active_language_pair: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface AdminGlobalStats {
  total_users: number
  active_users_7d: number
  new_users_7d: number
  total_translations: number
  total_explanations: number
  total_image_translations: number
  total_cost_usd: number
}

export interface AdminUserStats {
  user_id: number
  first_name: string | null
  username: string | null
  created_at: string
  last_active: string | null
  total_cards: number
  total_translations: number
  total_explanations: number
  total_image_translations: number
  total_cost_usd: number
}
