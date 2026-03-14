# Tili: Multi-Language Vocabulary Learning Product Plan

**Date:** 2026-03-15
**Status:** Active
**Author:** Product Team

---

## RALPLAN-DR Summary

### Guiding Principles

1. **Niche-first, depth over breadth** -- Serve underserved language pairs (Korean-Russian, English-Russian) and planned pairs (Korean-Kyrgyz) exceptionally well rather than competing with Duolingo on popular pairs.
2. **Zero-friction distribution** -- Telegram Mini App means no app store, no install, no account creation. The app lives where the users already are.
3. **AI-native, cost-conscious** -- Use LLMs for translation, explanation, and OCR but keep per-user costs under $0.10/day through caching, rate limiting, and model selection.
4. **Learn by doing** -- Multiple study modes (flip, type, quiz) backed by SM-2 spaced repetition. Practice is the core loop, not passive reading.
5. **Ship fast, measure, iterate** -- Small team, SQLite, single VPS. Optimize for speed of iteration, not premature scale.

### Decision Drivers (Top 3 for Phase 2-3)

1. **Retention over acquisition** -- Features that bring users back daily (better SRS, notifications, streaks, gamification) matter more than features that attract new users.
2. **Monetization readiness** -- The app needs revenue to sustain LLM costs as user count grows. Telegram Stars payment integration is a prerequisite for growth.
3. **Content depth** -- Pre-built word lists, sentence practice, and grammar tips transform Tili from a flashcard tool into a learning platform.

### Viable Options for Phase 2 Focus

**Option A: Monetization-first**
- Pros: Revenue before costs grow; validates willingness to pay; forces prioritization of premium-worthy features
- Cons: Paywall may hurt early retention; small user base means low revenue regardless; Central Asian market has lower purchasing power

**Option B: Growth-first**
- Pros: Larger user base improves viral mechanics; more data for LLM quality; community effects
- Cons: LLM costs grow without revenue; harder to add paywall later; vanity metrics risk

**Option C: Feature-depth-first (Recommended)**
- Pros: Stronger retention drives organic growth; deeper features justify premium pricing when added; differentiates from simple flashcard apps
- Cons: Slower to revenue; risk of over-building before market validation

**Recommendation:** Option C for the next 4-6 weeks (deepen practice modes, add pre-built content, improve analytics), then layer in monetization (Option A) once daily active usage is consistent.

---

## 1. EXECUTIVE SUMMARY

### Product Vision

Tili is an AI-powered vocabulary learning app built natively for Telegram that serves **underserved language pairs** in Central Asia and the Korean language learning market. It combines the proven effectiveness of SM-2 spaced repetition with instant AI translation, multiple study modes, and audio pronunciation, delivered through Telegram's zero-friction Mini App platform.

**One-line pitch:** "The Anki that doesn't suck, for language pairs Duolingo ignores, inside the app you already use."

### Value Proposition

| For | Who | Tili is | Unlike |
|-----|-----|---------|--------|
| Korean learners in CIS/Central Asia | Want to learn Korean vocabulary driven by K-pop/Hallyu culture | An AI flashcard app inside Telegram with spaced repetition, quiz modes, and pronunciation | Duolingo (no Korean-Russian), Anki (terrible UX), Memrise (no Korean-Kyrgyz) |
| English learners in Kyrgyzstan/Central Asia | Need practical English vocabulary | A native Telegram learning tool in their language | Western apps that only offer English-Spanish/French/etc. |

### Target Market and Positioning

**Primary beachhead:** Korean learners in CIS countries (Russia, Kazakhstan, Uzbekistan, Kyrgyzstan) who use Telegram daily and are underserved by existing apps.

**Secondary expansion:** English learners in Central Asia, then broader Korean learners globally.

**Positioning:** Not a full course app (not competing with Duolingo on grammar/listening). Positioned as the **best vocabulary acquisition tool** for specific language pairs, with the lowest friction distribution (Telegram).

### Current Product State

Phase 1 is **100% complete**. The app is a fully functional multi-language vocabulary learning tool with:
- 3 study modes (flip cards, type answer, multiple-choice quiz)
- AI-powered translation, word explanation, and image OCR
- Audio pronunciation (TTS)
- Deck organization, card search, batch creation
- Streak tracking, review history, accuracy analytics
- Admin dashboard with cost monitoring
- Rate limiting and daily cost ceiling
- i18n (English + Russian app language)
- 8 database tables, 10 migrations, 30+ API endpoints

---

## 2. MARKET VIABILITY ASSESSMENT

### Verdict: VIABLE with strong niche positioning

The convergence of three macro trends creates a compelling opportunity:

1. **Korean language explosion** ($7.2B market, 25.1% CAGR) driven by K-pop/K-drama cultural penetration, especially deep in Central Asia
2. **Telegram dominance in target geography** (70%+ penetration in Uzbekistan, massive in Kazakhstan/Kyrgyzstan/Russia)
3. **Massively underserved language pairs** -- no major app offers Korean-Russian, Korean-Kyrgyz, or English-Kyrgyz with quality AI translation

### Market Sizing (Bottom-Up)

| Metric | Conservative | Moderate | Optimistic |
|--------|-------------|----------|------------|
| TAM (Korean learners in CIS on Telegram) | 2M | 5M | 10M |
| Reachable market (Mini App discoverable) | 200K | 500K | 1M |
| Year 1 users (organic + viral) | 5K | 15K | 50K |
| Conversion to paid (2-3%) | 100-150 | 300-450 | 1,000-1,500 |
| Year 1 ARR (at $3/mo avg) | $3.6K-5.4K | $10.8K-16.2K | $36K-54K |

> Conversion rates calibrated at 2-3% to match industry benchmarks for freemium apps in lower-purchasing-power markets. At 3% conversion with 15K users, Year 1 ARR is ~$16K -- viable as a side project with near-zero costs.

### Key Opportunities

1. **First-mover in niche:** No quality Korean-Russian or Korean-Kyrgyz SRS app exists on Telegram
2. **Zero CAC distribution:** Telegram Mini Apps are discoverable through forwarding, group sharing, and the Mini App catalog
3. **Favorable economics:** ~17x margin on LLM translation costs with Stars pricing; no 30% Apple/Google tax
4. **Cultural tailwind:** K-pop fan communities are massive in Central Asia, creating organic demand for Korean vocabulary
5. **Network effects:** Users sharing words/progress in Telegram groups creates viral loops

### Key Risks

1. **Small initial market:** Korean-Russian/Kyrgyz is niche; needs expansion to sustain growth
2. **Telegram platform risk:** Dependent on Telegram Stars ecosystem and Mini App policies
3. **LLM quality for low-resource languages:** Kyrgyz translations may be less accurate than Korean-English
4. **Monetization ceiling:** Central Asian purchasing power is lower than Western markets
5. **Competition response:** If successful, larger players could add these language pairs

### Competitive Positioning Map

```
                    HIGH QUALITY SRS
                         |
                    Anki |  TILI (target)
                         |
   HARD UX -------------|-------------- EASY UX
                         |
              Generic    |  Duolingo
              flashcard  |  Memrise
              apps       |
                    LOW QUALITY SRS
```

Tili aims for the top-right quadrant: high-quality SRS (SM-2) with easy UX (Telegram native), differentiated by language pair coverage and AI-powered features.

---

## 3. KEY FEATURES

### Phase 1: Core Product -- COMPLETE

All 20 planned tasks plus 17 additional features shipped.

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1.01 | PC scrolling fix | DONE | CSS fix for desktop overflow |
| 1.02 | Switch LLM to GPT-4.1-mini | DONE | Cost optimization; Anthropic Claude as fallback |
| 1.03 | DB migration (language-agnostic columns) | DONE | `korean`/`english` renamed to `source_text`/`target_text`, added `language_pair` |
| 1.04 | Users table | DONE | Preferences, streaks, active language pair, preferred deck |
| 1.05 | Decks table + CRUD | DONE | Language-pair-scoped decks with auto-created Default deck |
| 1.06 | Backend updated for new schema | DONE | All models, routers, LLM service updated |
| 1.07 | Frontend updated for new field names | DONE | Types, pages, components with dynamic labels |
| 1.08 | Parameterized LLM prompts | DONE | Template system for any language pair |
| 1.09 | Reverse translation direction | DONE | Bidirectional input (LLM auto-detects language) |
| 1.10 | Reverse practice toggle | DONE | Source-to-Target, Target-to-Source, Random |
| 1.11 | Deck UI (chip bar on Cards page) | DONE | Horizontal chip filter + full Decks page |
| 1.12 | Deck in Add Card flow | DONE | Deck selector when adding cards |
| 1.13 | Word explanation -- backend | DONE | LLM etymology/structure/usage; cached in DB |
| 1.14 | Word explanation -- frontend | DONE | ExplainButton component on Practice, Cards, Add pages |
| 1.15 | Streak tracking -- backend | DONE | Daily streak logic in users table |
| 1.16 | Streak tracking -- frontend | DONE | Display on Home + Stats pages |
| 1.17 | Settings page + language pair selector | DONE | Gear icon on Home; switch active pair; app language |
| 1.18 | Filter practice/cards by language pair | DONE | Practice + cards respect active pair |
| 1.19 | Translation cache | DONE | LRU in-memory cache (5000 translations, 2000 explanations) |
| 1.20 | Cleanup bot references | DONE | Mini-app-only codebase (bot.py retained for /start, /help, menu button) |

### Additional Features Shipped (Beyond Original Plan)

| # | Feature | Description |
|---|---------|-------------|
| A.01 | Image Translation / OCR | Upload image, LLM extracts and translates all words, batch save with duplicate detection |
| A.02 | Batch Card Creation | Create up to 100 cards in one request |
| A.03 | Type Answer Study Mode | Type the answer with normalization/fuzzy matching, correctness tracking |
| A.04 | Multiple-Choice Quiz Mode | 4-option quiz with distractor generation, prefetch, score tracking |
| A.05 | Part of Speech Tagging | LLM returns POS with translations, stored on cards |
| A.06 | API Usage Tracking | `api_usage` table logs every LLM/TTS call with token counts and estimated cost |
| A.07 | Admin Dashboard | Global stats (users, API calls, costs) + per-user breakdown |
| A.08 | Rate Limiting | Per-endpoint hourly limits (translate 60/hr, explain 30/hr, image 10/hr, TTS 200/hr) |
| A.09 | Daily Cost Ceiling | $0.10/user/day limit on AI API calls (admin exempt) |
| A.10 | Input Validation | Max lengths on translate (100 chars) and explain inputs |
| A.11 | Card Search | Full-text search across source_text and target_text |
| A.12 | Session Persistence | Auto-save/restore practice sessions and card drafts in sessionStorage (30-min TTL) |
| A.13 | Preferred Deck | Users can set a preferred deck in preferences |
| A.14 | Dedicated Decks Page | Full deck management page with create, edit, delete |
| A.15 | Card Editing | EditCardModal for modifying target_text and examples |
| A.16 | Move Cards Between Decks | MoveDeckModal component |
| A.17 | i18n / App Localization | English and Russian app language (100+ translation keys) |
| A.18 | Review History | Detailed `review_history` table tracking study_mode, was_correct, quality, response_time_ms |
| A.19 | Quiz Progress Tracking | Per-mode accuracy stats, 7/30-day rolling averages |
| A.20 | Audio Pronunciation (TTS) | OpenAI gpt-4o-mini-tts with language-specific instructions, SQLite BLOB caching |

### Phase 2: Growth, Monetization & Advanced Features

| # | Feature | Priority | Timeline | Status | Description |
|---|---------|----------|----------|--------|-------------|
| 2.01 | User tier system + free limits | P0 | Weeks 7-9 | TODO | 50 cards, 15 translations/day, 2 language pairs for free |
| 2.02 | Telegram Stars payment | P0 | Weeks 7-9 | TODO | Stars subscription via Telegram Payments API |
| 2.03 | Premium upgrade UI | P0 | Weeks 7-9 | TODO | Pricing page + banner when limits hit |
| 2.04 | Quiz mode | P1 | — | DONE | Multiple-choice with 3 distractors, prefetch |
| 2.05 | Quiz progress tracking | P1 | — | DONE | review_history table, per-mode accuracy, rolling averages |
| 2.06 | Pre-built word lists | P1 | Weeks 10-14 | TODO | Curated installable decks (K-pop, TOPIK, Travel) |
| 2.07 | Badges/achievements | P2 | Weeks 10-14 | TODO | Milestone badges (words, streaks, quiz scores) |
| 2.08 | Social sharing cards | P2 | Weeks 10-14 | TODO | Shareable streak/achievement images for Telegram |
| 2.09 | Daily review reminders | P2 | Weeks 10-14 | TODO | Telegram notification when cards are due |
| 2.10 | Kyrgyz language pairs | P2 | Weeks 10-14 | TODO | ko-ky, en-ky (validate LLM quality first) |
| 2.11 | Audio pronunciation (TTS) | P3 | — | DONE | OpenAI gpt-4o-mini-tts, SQLite BLOB caching |
| 2.12 | Referral program | P3 | Weeks 10-14 | TODO | Invite friends, earn free premium |
| 2.13 | Sentence practice mode | P1 | Weeks 10-14 | TODO | Translate full sentences, graded by LLM |
| 2.14 | Import/Export (CSV, Anki) | P2 | Weeks 10-14 | TODO | Import from CSV/Anki; export user's cards |
| 2.15 | Word of the day notifications | P2 | Weeks 10-14 | TODO | Daily push via Telegram with a new word from user's deck |
| 2.16 | User learning insights | P2 | Weeks 10-14 | TODO | When you learn best, hardest words, forgetting curves |
| 2.17 | Grammar tips on cards | P3 | Weeks 10-14 | TODO | Brief grammar notes attached to example sentences |
| 2.18 | Kyrgyz app language | P3 | Weeks 10-14 | TODO | Add Kyrgyz to the i18n system |
| 2.19 | FSRS algorithm upgrade | P2 | Weeks 10-14 | TODO | Replace SM-2 with FSRS for better retention. Localized change to `srs.py` and SRS-related calls in `models.py` |

### Phase 3: Scale & Differentiation

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| 3.01 | Group learning / shared decks | P2 | Teachers create lists; students subscribe; classroom mode |
| 3.02 | Leaderboards | P2 | Weekly/monthly ranking among friends or global |
| 3.03 | AI conversation practice | P2 | Chat with AI in target language with corrections |
| 3.04 | Listening comprehension mode | P2 | Hear the word, type or select the meaning |
| 3.05 | Vocabulary by topic (curated categories) | P2 | Food, Travel, K-pop, Business, TOPIK levels |
| 3.06 | Advanced analytics dashboard | P3 | Retention curves, optimal review times, difficulty heatmaps |
| 3.07 | Writing practice (trace characters) | P3 | Guided Hangul/Cyrillic character drawing |
| 3.08 | Contextual sentences at user's level | P3 | AI-generated sentences calibrated to learner's vocabulary |
| 3.09 | Progressive web app / offline mode | P3 | Cache cards locally for practice without internet |
| 3.10 | Gamification elements | P3 | XP points, levels, daily challenges, reward animations |
| 3.11 | Additional language pairs | Ongoing | Uzbek, Kazakh, Japanese based on demand |
| 3.12 | PostgreSQL migration (if needed) | P3 | Only if SQLite shows contention at scale |
| 3.13 | API for third-party content | P3 | Allow educators to create and distribute word lists |

---

## 4. MONETIZATION STRATEGY

> All monetization is deferred until Phase 2. Phase 1 is private/friends-only with no usage limits. Rate limiting and cost ceilings protect against abuse but do not restrict normal use.

### Tier Structure

**Free Tier (forever free, enforced in Phase 2):**
- 50 flashcards maximum
- 15 AI translations per day
- 2 active language pairs
- All 3 study modes (flip, type, quiz)
- Basic stats
- TTS pronunciation

**Premium Tier ($3.49/month ~ 250 Stars):**
- Unlimited flashcards
- Unlimited AI translations
- All language pairs
- Image OCR translation
- Pre-built word lists
- Detailed learning insights
- Priority support

**Premium Annual ($29.99/year ~ 2,100 Stars):**
- Everything in Premium
- ~28% discount vs monthly
- Early access to new features

**Lifetime ($69.99 ~ 5,000 Stars):**
- Everything in Premium, forever
- Introduced after product-market fit is validated (late Phase 2)

### Pricing Rationale

- **$3.49/month** is at the low end of global language app pricing ($4-14/month) but calibrated for Central Asian purchasing power
- In Stars: ~250 Stars/month. Users buy Stars at roughly $0.014/Star through Telegram
- Developer receives ~65% after Telegram + payment processor cuts: ~$2.27/month net per subscriber
- This is still ~17x the LLM cost per active user (~$0.13/month at 100 translations/month with gpt-4.1-mini)

### Revenue Projections

**Conservative scenario (2-3% conversion):**

| Metric | 1K Users | 5K Users | 10K Users | 50K Users | 100K Users |
|--------|----------|----------|-----------|-----------|------------|
| Free users (97-98%) | 975 | 4,875 | 9,750 | 48,750 | 97,500 |
| Premium monthly (1.5-2%) | 18 | 88 | 175 | 875 | 1,750 |
| Premium annual (0.5-1%) | 8 | 38 | 75 | 375 | 750 |
| Monthly revenue (net) | $57 | $284 | $567 | $2,835 | $5,670 |
| Annual revenue (net) | $684 | $3,408 | $6,804 | $34,020 | $68,040 |

*Net revenue = after Telegram's ~35% cut on Stars*

---

## 5. GROWTH STRATEGY

### Phase 1: Soft Launch -- COMPLETE

Phase 1 was private -- founder and close friends. Core product is built and functional.

### Phase 2: First 1,000 Users

**Launch channels (all organic, $0 budget):**

1. **K-pop fan communities on Telegram** (highest ROI)
   - Join 20-30 K-pop fan groups in Russian-speaking Telegram
   - Share the Mini App: "Made a free tool to learn Korean words from your favorite songs"
   - Create a "K-pop Vocabulary" pre-built word list as a hook
   - Target: 200-500 users

2. **Korean language learning Telegram groups**
   - Post in Korean study groups for Russian speakers
   - Offer the app as a complementary study tool
   - Target: 100-200 users

3. **Reddit/X communities**
   - r/Korean, r/languagelearning, r/kpop
   - Product Hunt launch
   - Target: 100-200 users

4. **Personal network & founder-led content**
   - Founder's personal Telegram, social media
   - "Building in public" posts
   - Target: 50-100 users

### Phase 3: 1,000 to 10,000 Users

1. **Viral mechanics (built into product)**
   - "Share your streak" cards that display beautifully in Telegram chats
   - "Challenge a friend" -- send a word quiz to any Telegram contact
   - Referral program: invite 3 friends, get 1 week premium free
   - Target: 2x organic growth multiplier

2. **Content marketing**
   - "Learn 5 Korean words from [latest K-drama]" -- weekly posts in Telegram channels
   - Create a Telegram channel @tili_korean with daily word of the day
   - SEO blog posts: "How to learn Korean for Russian speakers"
   - Target: 500-1,000 users/month organic

3. **Partnerships**
   - Korean cultural centers in CIS countries (free premium for their students)
   - Korean language teachers on Telegram (affiliate: 20% of referral revenue)
   - K-pop fan community admins (free premium for promotion)
   - Target: 1,000-2,000 users from partnerships

4. **Telegram Mini App Store / Discovery**
   - Optimize listing in Telegram's Mini App catalog
   - Target featured placement in Education category
   - Target: 500-1,000 users/month from discovery

### Phase 4: 10,000+ Users

1. **Paid acquisition (if unit economics justify)**
   - Telegram Ads targeted to CIS users in language learning groups
   - Budget: $500-1,000/month, target CPI < $0.50
   - Only activate when LTV > 3x CAC

2. **Influencer partnerships**
   - Korean language YouTube/Telegram bloggers in Russia/Central Asia
   - Performance-based deals (CPA or revenue share)

3. **Localization as growth**
   - Each new language pair unlocks a new user segment
   - Kyrgyz support opens Kyrgyzstan market (5M+ Telegram users)
   - Uzbek support opens Uzbekistan market (massive Telegram penetration)

### Community Building

- **Telegram Channel:** @tili_words -- daily vocabulary, tips, streak celebrations
- **Telegram Group:** @tili_community -- learner discussions, word requests, feedback
- **User-generated content:** Users submit words they want translated, voted on by community
- **Weekly challenges:** "Learn 20 words this week" with leaderboard

---

## 6. TECHNICAL ARCHITECTURE

### Architecture Overview

```
tiliminiapp/
├── bot.py                          # Telegram bot (/start, /help, Mini App menu button)
├── start.sh / kill.sh              # Service orchestration
├── backend/                        # Python FastAPI (port 8000)
│   ├── main.py                     # App setup, CORS, lifespan
│   ├── config.py                   # Environment configuration (~20 settings)
│   ├── auth.py                     # Telegram initData HMAC-SHA256 auth
│   ├── rate_limit.py               # Per-user sliding window rate limiter
│   ├── db/
│   │   ├── connection.py           # SQLite init, WAL mode, 10 migrations, 8 tables
│   │   └── models.py              # All database CRUD operations (~30 functions)
│   ├── services/
│   │   ├── llm.py                 # AI translation + explanation + image OCR (multi-provider, cached)
│   │   ├── srs.py                 # SM-2 spaced repetition algorithm
│   │   └── tts.py                 # Text-to-speech (OpenAI gpt-4o-mini-tts, SQLite BLOB cache)
│   └── routers/
│       ├── cards.py               # Card CRUD + translate + explain + image + batch + search (12 endpoints)
│       ├── practice.py            # Practice session + SRS review + quiz options (3 endpoints)
│       ├── stats.py               # Learning statistics + accuracy (2 endpoints)
│       ├── decks.py               # Deck CRUD + move card (6 endpoints)
│       ├── users.py               # User profile + preferences (2 endpoints)
│       ├── tts.py                 # Text-to-speech audio (1 endpoint)
│       └── admin.py               # Admin stats + user list (3 endpoints)
└── frontend/                       # React 18 + TypeScript + Vite (port 5173)
    └── src/
        ├── App.tsx                # Root with HashRouter (8 routes)
        ├── types.ts               # TypeScript interfaces
        ├── api.ts                 # API client with Telegram auth
        ├── i18n/
        │   ├── index.ts           # useTranslation hook
        │   └── translations.ts    # EN + RU translation keys (100+)
        ├── utils/
        │   └── languages.ts       # Language pair display names
        ├── contexts/
        │   └── AppContext.tsx      # Global state (user, theme, language pair, app language)
        ├── pages/
        │   ├── HomePage.tsx       # Dashboard: due count, streak, quick actions
        │   ├── AddCardPage.tsx    # Add card: translate, image OCR, batch, deck selector
        │   ├── PracticePage.tsx   # Practice: flip/type/quiz modes, direction selector
        │   ├── CardsListPage.tsx  # Card list: search, deck filter, edit, move, delete
        │   ├── DecksPage.tsx      # Full deck management
        │   ├── StatsPage.tsx      # Stats: distribution, streaks, accuracy by mode
        │   ├── SettingsPage.tsx   # Language pair selector, app language selector
        │   └── AdminPage.tsx      # Admin: global stats, per-user costs
        └── components/
            ├── NavigationBar.tsx   # Bottom tab navigation
            ├── FlashCard.tsx      # Card display with flip animation
            ├── DifficultyButtons.tsx  # Easy/Medium/Hard rating
            ├── QuizModeView.tsx   # Multiple-choice quiz UI
            ├── TypeModeView.tsx   # Type-answer study UI
            ├── ExplainButton.tsx  # On-demand word explanation
            ├── SpeakerButton.tsx  # TTS audio playback
            ├── EditCardModal.tsx  # Card editing modal
            ├── MoveDeckModal.tsx  # Move card between decks
            ├── LoadingSpinner.tsx # Loading indicator
            └── EmptyState.tsx     # Empty state illustrations
```

### Database Schema (Current -- 8 Tables)

```sql
-- Users (Telegram identity + preferences + streaks)
CREATE TABLE users (
    id INTEGER PRIMARY KEY,                -- Telegram user ID
    telegram_username TEXT,
    first_name TEXT,
    last_name TEXT,
    active_language_pair TEXT DEFAULT 'ko-en',
    preferred_deck_id INTEGER DEFAULT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flashcards (vocabulary cards with SRS scheduling)
CREATE TABLE flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    example_source TEXT,
    example_target TEXT,
    language_pair TEXT NOT NULL DEFAULT 'ko-en',
    part_of_speech TEXT,
    deck_id INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0
);

-- Decks (card organization, one default per user per language pair)
CREATE TABLE decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    language_pair TEXT NOT NULL DEFAULT 'ko-en',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Explanations (cached LLM word explanations)
CREATE TABLE explanations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES flashcards(id) ON DELETE CASCADE
);

-- API Usage (cost tracking per LLM/TTS call)
CREATE TABLE api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    call_type TEXT NOT NULL,           -- translate, explain, translate_image, tts
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    estimated_cost_usd REAL DEFAULT 0.0,
    language_pair TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TTS Cache (audio pronunciation BLOBs)
CREATE TABLE tts_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text_hash TEXT NOT NULL,           -- SHA-256 of text|language|model|voice
    text TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'ko',
    audio_data BLOB NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'audio/mpeg',
    size_bytes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review History (detailed practice session tracking)
CREATE TABLE review_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    study_mode TEXT NOT NULL DEFAULT 'flip',   -- flip, type, quiz
    was_correct INTEGER,                       -- NULL for flip mode
    quality INTEGER NOT NULL,                  -- SM-2 quality (0-5)
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schema Versions (migration tracking)
CREATE TABLE schema_versions (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);
```

**Indexes (13):**
- `idx_user_review` -- flashcards(user_id, next_review)
- `idx_user_source` -- flashcards(user_id, language_pair, source_text)
- `idx_user_lang_review` -- flashcards(user_id, language_pair, next_review)
- `idx_flashcard_deck` -- flashcards(deck_id)
- `idx_deck_user` -- decks(user_id, language_pair)
- `idx_explanation_card` -- explanations(card_id)
- `idx_api_usage_user` -- api_usage(user_id)
- `idx_api_usage_created` -- api_usage(created_at)
- `idx_api_usage_user_date` -- api_usage(user_id, created_at)
- `idx_tts_hash` (UNIQUE) -- tts_cache(text_hash)
- `idx_review_history_user` -- review_history(user_id, created_at)
- `idx_review_history_card` -- review_history(card_id)
- `idx_review_history_user_mode` -- review_history(user_id, study_mode, created_at)

### API Endpoints (30+)

**Cards** (`/api/cards`):
| Method | Path | Description |
|--------|------|-------------|
| POST | `/translate` | AI translation (rate limited, cost tracked) |
| POST | `/translate-image` | Image OCR + translation (rate limited) |
| POST | `/batch` | Batch create up to 100 cards |
| POST | `/` | Create single card |
| GET | `/` | List cards (paginated, filterable by deck/language) |
| GET | `/search` | Full-text search by source/target text |
| POST | `/explain` | Standalone word explanation (no saved card required) |
| GET | `/{id}` | Get single card |
| PUT | `/{id}` | Update card fields |
| DELETE | `/{id}` | Delete card |
| GET | `/{id}/explanation` | Get cached explanation |
| POST | `/{id}/explanation` | Generate + cache explanation |

**Practice** (`/api/practice`):
| Method | Path | Description |
|--------|------|-------------|
| GET | `/due` | Get due cards (filterable by language/deck) |
| POST | `/review` | Submit review (flip/type/quiz, updates SRS + streak + history) |
| GET | `/quiz-options` | Get distractor options for quiz mode |

**Decks** (`/api/decks`):
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List decks with card counts |
| POST | `/` | Create deck |
| GET | `/{id}` | Get single deck |
| PUT | `/{id}` | Update deck name/description |
| DELETE | `/{id}` | Delete deck (cards move to Default) |
| POST | `/{id}/move-card` | Move card to deck |

**Stats** (`/api/stats`):
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | User stats (total, due, distribution, streaks) |
| GET | `/accuracy` | Per-mode accuracy with 7/30-day rolling averages |

**Users** (`/api/user`):
| Method | Path | Description |
|--------|------|-------------|
| GET | `/preferences` | User preferences (language pair, preferred deck) |
| PUT | `/preferences` | Update language pair, preferred deck |

**TTS** (`/api/tts`):
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Generate/serve audio pronunciation (rate limited, cached) |

**Admin** (`/api/admin`):
| Method | Path | Description |
|--------|------|-------------|
| GET | `/check` | Check if current user is admin |
| GET | `/stats` | Global stats (users, API calls, costs) |
| GET | `/users` | Per-user statistics table |

**Health:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

### LLM Service Architecture

**Default provider:** OpenAI GPT-4.1-mini (cost-optimized, $0.40/1M input, $1.60/1M output)
**Fallback provider:** Anthropic Claude (configurable via `LLM_PROVIDER` env var)

The LLM service supports three operations:
1. **Translation:** `translate(word, source_lang, target_lang)` -- translates word/phrase with example sentences and part of speech
2. **Explanation:** `explain_word(word, translation, source_lang, target_lang)` -- etymology, structure, roots, usage, extra examples
3. **Image Translation:** `translate_image(image_base64, media_type, source_lang, target_lang)` -- OCR + batch translation

All operations wrapped in:
- **LRU cache** (5000 translations, 2000 explanations) -- eliminates repeated LLM calls
- **Retry with exponential backoff** (3 attempts) -- handles transient API errors
- **Cost estimation** per call using model pricing table

**Supported Language Pairs:** `ko-en`, `en-ko`, `ko-ru`, `en-ru`

### TTS Service

**Model:** OpenAI gpt-4o-mini-tts ($0.60/1M chars)
**Voice:** coral
**Caching:** Two layers:
1. Server-side SQLite BLOB cache (keyed by SHA-256 of text|language|model|voice)
2. Client-side in-memory Map<string, Blob> for instant repeat playback

**Language-specific pronunciation instructions:**
- Korean: Seoul standard accent
- English: American accent
- Russian: Standard accent

### Rate Limiting & Cost Controls

| Endpoint Group | Limit (per user/hour) |
|----------------|----------------------|
| Translate | 60 |
| Explain | 30 |
| Image translate | 10 |
| TTS | 200 |

**Daily cost ceiling:** $0.10/user/day (admin exempt)
**Admin exemption:** Admin user ID (from env var) bypasses all rate limits and cost ceilings

### Scaling Considerations

| Users | Database | Hosting | Notes |
|-------|----------|---------|-------|
| 0-10K | SQLite (current) | Single VPS ($10-20/mo) | Totally fine with WAL mode |
| 10K-50K | SQLite still viable | Larger VPS ($20-40/mo) | Monitor write contention |
| 50K-100K | Migrate to PostgreSQL | VPS + managed DB ($40-80/mo) | Only if write contention appears |
| 100K+ | PostgreSQL + read replicas | Cloud ($100-200/mo) | Unlikely in Year 1 |

### Known Technical Debt

| Item | Risk | Priority | Description |
|------|------|----------|-------------|
| Single aiosqlite connection | MEDIUM | Phase 2 | All requests share one DB connection (`app.state.db`). Bottleneck for concurrent users. Fix: connection pool or read/write split. |
| No foreign key enforcement | LOW | Phase 2 | `PRAGMA foreign_keys = ON` never called. FK constraints in schema are decorative. Fix: add pragma to `init_db()`. |
| In-process rate limiter | LOW | Phase 3 | Rate limit state stored in module-level dict; resets on server restart; doesn't scale to multiple processes. Fix: move to SQLite or Redis. |
| Timezone inconsistency | LOW | Phase 2 | Streak uses `datetime.now()` (local), cost ceiling uses `date('now')` (UTC). Fix: standardize on UTC throughout. |
| initData 1-hour expiry | MEDIUM | Phase 2 | API calls fail after 1 hour. Long study sessions are interrupted. Fix: frontend re-fetches initData periodically or graceful re-auth. |
| No automated tests | HIGH | Phase 2 | Zero test files. Payment and SRS logic need unit/integration tests. |
| No database backups | HIGH | Pre-launch | SQLite file is the sole data store. Fix: daily cron copying DB to cloud storage. |
| No error monitoring | MEDIUM | Pre-launch | Logs go to `.logs/` files only. Fix: add Sentry (free tier) or equivalent. |
| Localhost CORS in production | LOW | Pre-launch | `main.py` allows `localhost:5173` alongside configured `FRONTEND_URL`. Remove for production. |

### Testing Strategy

**Phase 1 (current):** Manual testing. Acceptable for friends-only use.

**Phase 2 (required before public launch):**
- API endpoint tests: pytest + httpx AsyncClient for all card/practice/deck/stats endpoints
- SRS algorithm tests: Unit tests for `calculate_next_review` with known SM-2 inputs/outputs
- Payment flow tests: Telegram Stars test provider token for end-to-end subscription testing
- Rate limiter tests: Verify per-user limits, daily ceiling, admin exemption

**Phase 3:**
- Frontend component tests (React Testing Library)
- End-to-end tests (Playwright or Cypress) for critical user flows
- Load testing to validate scaling thresholds

---

## 7. COST & EXPENSE PROJECTIONS

### Model Pricing (Current)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Used For |
|-------|----------------------|------------------------|----------|
| gpt-4.1-mini | $0.40 | $1.60 | Translation, explanation, image OCR |
| gpt-4o-mini-tts | $0.60/1M chars | — | Audio pronunciation |

### Per-Operation Cost Estimates

| Operation | Avg Input Tokens | Avg Output Tokens | Est. Cost |
|-----------|-----------------|-------------------|-----------|
| Word translation | ~200 | ~150 | $0.00032 |
| Word explanation | ~300 | ~400 | $0.00076 |
| Image OCR + translation | ~1,500 | ~1,000 | $0.0022 |
| TTS pronunciation | ~50 chars | ~3s audio | $0.0002 |

### Monthly Cost Model

| Cost Item | 100 Users | 1K Users | 10K Users | 100K Users |
|-----------|-----------|----------|-----------|------------|
| **Hosting (VPS)** | $10 | $10 | $20 | $80 |
| **LLM API (gpt-4.1-mini)** | $1 | $8 | $50 | $300 |
| **TTS API (gpt-4o-mini-tts)** | $0.50 | $4 | $25 | $150 |
| **Domain + SSL** | $1 | $1 | $1 | $1 |
| **Monitoring** | $0 | $0 | $0 | $20 |
| **Database (if PostgreSQL)** | $0 | $0 | $0 | $40 |
| **Total monthly** | **$12.50** | **$23** | **$96** | **$591** |

**LLM cost assumptions:**
- Average active user: 3 translations/day + 1 explanation/week + 5 TTS plays/day
- With caching (30-50% hit rate for translations, higher for TTS): effective calls reduced significantly
- Cost per active user/month: ~$0.02 (translation) + ~$0.01 (TTS) = ~$0.03
- Assuming 30% of total users are active in a given month
- Daily cost ceiling ($0.10/user) provides hard upper bound

---

## 8. IMPLEMENTATION PLAN

### Phase 1: Core Product -- COMPLETE (Weeks 1-6)

All 20 planned tasks completed. 17 additional features shipped beyond original scope. See Section 3 for full feature inventory.

**Key achievements beyond original plan:**
- 3 study modes instead of 1 (flip + type + quiz)
- Image OCR translation
- Admin dashboard with cost tracking
- Rate limiting and daily cost ceiling
- i18n (English + Russian)
- Audio pronunciation (TTS)

### Phase 2: Growth, Monetization & Content (Weeks 7-16)

**Goal:** Add payments, pre-built content, notifications, and growth mechanics. Deepen the learning experience with sentence practice and import/export.

**Critical dependency:** Tasks 2.01-2.03 (tier system + Stars payment + upgrade UI) MUST be complete before executing the public/community launch described in Growth Strategy Phase 2 (Section 5). This ensures a revenue mechanism exists before costs grow with user acquisition.

#### Task 2.01: User tier system + free tier limits

**Priority:** P0 | **Effort:** Medium
**Files:** `backend/db/models.py`, `backend/db/connection.py`, `backend/routers/cards.py`, `backend/rate_limit.py`

Add `tier`, `tier_expires_at` columns to users table. Enforce limits:
- Free: 50 cards, 15 translations/day, 2 language pairs
- Premium: unlimited

**Middleware:** `check_tier_limits()` FastAPI dependency. HTTP 402 with upgrade prompt.

**Acceptance criteria:**
- Free users cannot exceed 50 cards or 15 translations/day
- Premium users have no limits
- Tier checked on every relevant request

---

#### Task 2.02: Telegram Stars payment integration

**Priority:** P0 | **Effort:** Large
**Files:** `backend/routers/subscribe.py` (new), `backend/db/connection.py`, `backend/db/models.py`, `backend/main.py`, `bot.py`

Create `subscriptions` table. Implement Stars invoice flow:
1. Mini App calls `POST /api/subscribe` with plan type
2. Backend creates invoice via Bot API (`create_invoice_link`)
3. Frontend opens invoice via `WebApp.openInvoice(url)`
4. Bot handles `pre_checkout_query` and `successful_payment`
5. Handler updates user tier + creates subscription record

**Acceptance criteria:**
- Monthly, annual, and lifetime plans available
- Payment processes end-to-end
- Tier activates immediately after payment
- Subscription expiry handled via lazy check: each authenticated API call checks `tier_expires_at` and downgrades if expired
- Stars payment testable in Telegram's test environment (test provider token)
- Webhook handles `pre_checkout_query` -> ok=True and `successful_payment` -> tier upgrade

---

#### Task 2.03: Premium upgrade UI

**Priority:** P0 | **Effort:** Medium
**Files:** `frontend/src/pages/SettingsPage.tsx`, `frontend/src/components/PremiumBanner.tsx` (new)

Upgrade prompt in Settings + banner when free limits hit. Show pricing, benefits, Stars payment trigger.

**Acceptance criteria:**
- Clear pricing display with feature comparison
- Contextual prompts when limits hit
- One-tap payment flow

---

#### Task 2.06: Pre-built word lists (curated decks)

**Priority:** P1 | **Effort:** Medium
**Files:** `backend/routers/decks.py`, `backend/db/models.py`, data files

Curated installable decks: "K-pop Vocabulary", "Travel Phrases", "TOPIK Level 1", "Daily Conversation".

- `GET /api/decks/templates` -- available templates with preview
- `POST /api/decks/install/{template_id}` -- copy into user's account

**Acceptance criteria:**
- At least 5 curated decks available
- One-tap install creates deck with pre-translated cards
- Cards are editable after install
- Content stored as JSON seed files in `backend/data/` directory
- Template schema: `deck_templates` table with `data_json` column
- Initial content: 5 decks in ko-en pair (K-pop Basics, TOPIK Level 1, Travel Korean, Daily Conversation, Korean Food)
- Content created manually by founder or sourced from public TOPIK lists

---

#### Task 2.13: Sentence practice mode

**Priority:** P1 | **Effort:** Large
**Files:** `frontend/src/components/SentenceModeView.tsx` (new), `backend/routers/practice.py`, `backend/services/llm.py`

Translate full sentences. LLM grades the user's translation attempt and provides feedback.

**Acceptance criteria:**
- User sees a sentence in source language, types translation
- LLM evaluates and provides score + corrections
- Integrated with review history

---

#### Task 2.07: Badges and achievements

**Priority:** P2 | **Effort:** Medium
**Files:** `backend/db/models.py`, `backend/routers/stats.py`, `frontend/src/pages/StatsPage.tsx`

Milestones: 10/50/100/500 words learned, 7/30/100 day streaks, first quiz 100%, first image OCR.

**Acceptance criteria:**
- Badges stored in DB, calculated on demand
- Visual display on Stats page
- Notification when badge earned

---

#### Task 2.08: Social sharing cards

**Priority:** P2 | **Effort:** Medium

Shareable image: streak count, word count, achievements. Canvas-rendered, share to Telegram chats.

---

#### Task 2.09: Daily review reminders

**Priority:** P2 | **Effort:** Medium
**Files:** `bot.py`, `backend/db/models.py`

Telegram message when cards are due. Lightweight scheduled task checks for users with due cards.

**Acceptance criteria:**
- Bot sends max 1 message/day per user when they have >=5 cards due
- Scheduling: Lightweight cron job or APScheduler task checking at 9:00 AM UTC
- User opt-in/out via Settings page (default: off)
- Message includes due card count and Mini App deep link

---

#### Task 2.10: Kyrgyz language pairs

**Priority:** P2 | **Effort:** Small

Add `ko-ky`, `en-ky` to `SUPPORTED_PAIRS`. Validate LLM quality with native speakers first.

---

#### Task 2.14: Import/Export (CSV, Anki)

**Priority:** P2 | **Effort:** Medium
**Files:** `backend/routers/cards.py`, `frontend/src/pages/SettingsPage.tsx`

- Export: Download user's cards as CSV or JSON
- Import: Upload CSV with source_text/target_text columns

**Acceptance criteria:**
- Export formats: CSV (source_text, target_text, examples) and JSON
- Import: CSV upload with column mapping, duplicate detection
- Anki .apkg export is Phase 3 (complex format)

---

#### Task 2.15: Word of the day notifications

**Priority:** P2 | **Effort:** Small
**Files:** `bot.py`

Daily push via Telegram bot: random word from user's cards that needs review. Opt-in via Settings.

---

#### Task 2.16: User learning insights

**Priority:** P2 | **Effort:** Medium
**Files:** `backend/routers/stats.py`, `frontend/src/pages/StatsPage.tsx`

Analytics from review_history: best time of day to study, hardest words, forgetting curves, cards per session trend.

---

#### Task 2.12: Referral program

**Priority:** P3 | **Effort:** Medium

Referral links, tracking table, 1 week free premium per 3 referrals.

---

#### Task 2.17: Grammar tips on cards

**Priority:** P3 | **Effort:** Small
**Files:** `backend/services/llm.py`

Include a brief grammar note in the explanation prompt output (e.g., "This is a conjugated form of..." or "In Korean, adjectives work as...").

---

#### Task 2.18: Kyrgyz app language

**Priority:** P3 | **Effort:** Small
**Files:** `frontend/src/i18n/translations.ts`

Add Kyrgyz translations for all 100+ UI keys. Requires a native Kyrgyz speaker for quality.

---

### Phase 3: Scale & Differentiation (Weeks 17-32)

| Task | Timeline | Description |
|------|----------|-------------|
| 3.01 Group learning / shared decks | Week 17-20 | Teachers create lists; students subscribe |
| 3.02 Leaderboards | Week 20-22 | Weekly/monthly ranking among contacts |
| 3.03 AI conversation practice | Week 22-25 | Chat with AI in target language |
| 3.04 Listening comprehension | Week 25-27 | Hear word, select/type meaning (uses existing TTS) |
| 3.05 Vocabulary by topic | Week 27-29 | Curated categories beyond pre-built lists |
| 3.06 Advanced analytics | Week 29-32 | Retention curves, optimal times, difficulty maps |
| 3.07-3.13 | Ongoing | Writing practice, offline mode, gamification, more languages |

### Key Milestones

| Milestone | Target | Success Metric |
|-----------|--------|----------------|
| Phase 1 feature-complete | DONE | All 20 tasks + 17 bonus features |
| Soft launch (friends & beta) | Week 7 | 10-20 active testers, feedback collected |
| Public launch | Week 9 | Mini App publicly accessible |
| First paying customer | Week 10 | Stars payment processed |
| 500 users | Week 14 | Organic growth from launch channels |
| 1,000 users | Week 18 | Viral + community growth |
| 50 paying users | Week 18 | $100+/month net revenue |
| $1,000/month MRR | Month 6-8 | Sustainable product |

---

## 9. RISK ANALYSIS

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM quality for Kyrgyz translations | HIGH | MEDIUM | Validate with native speakers before launch; fall back to English as intermediary |
| Telegram API changes / Stars policy changes | LOW | HIGH | Abstract payment layer; keep alternative monetization path |
| SQLite write contention at scale | LOW | MEDIUM | WAL mode handles most cases; migrate to PostgreSQL only if needed |
| GPT-4.1-mini translation quality | LOW | MEDIUM | Fallback to Claude; prompt engineering; test across language pairs |
| TTS pronunciation quality | LOW | LOW | Language-specific instructions mitigate; can switch voices/models |
| Image OCR accuracy | MEDIUM | LOW | Validation UI lets users correct before saving |

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Korean learning trend fades in CIS | LOW | HIGH | Multi-language design allows pivot to English learning |
| Duolingo adds Korean-Russian | MEDIUM | MEDIUM | Tili's SRS depth + Telegram distribution are defensible |
| Telegram Mini App discoverability is poor | MEDIUM | MEDIUM | Rely on community/viral growth, not platform discovery |
| Low willingness to pay in target market | MEDIUM | HIGH | Price at $3.49/mo; add lifetime tier; consider ads |
| Slow organic growth | HIGH | MEDIUM | Content marketing playbook; budget for Telegram Ads |

### Financial Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM API costs spike | LOW | LOW | Rate limiting + daily ceiling ($0.10/user); caching reduces calls 30-50% |
| Revenue insufficient for founder | HIGH (Year 1) | HIGH | Side project until $2K+/month; costs < $25/month at small scale |
| Telegram takes larger cut of Stars | LOW | MEDIUM | Unit economics still work even at 50% cut |

### Mitigation Summary

1. **Validate Kyrgyz LLM quality early** -- test 100 common words with native speakers
2. **Keep costs near zero** -- SQLite, single VPS, GPT-4.1-mini, aggressive caching
3. **Rate limiting + cost ceilings already in place** -- protects against runaway costs
4. **Build viral loops into the product** -- streaks, sharing, referrals
5. **Multi-language design from day 1** -- reduces pivot risk

---

## 10. SUCCESS METRICS & KPIs

### North Star Metric

**Weekly Active Learners (WAL):** Users who completed at least 1 review session in the past 7 days.

### Phase 1 KPIs -- TRACKING

| Metric | Target | Status |
|--------|--------|--------|
| Active beta testers | 10-20 | Track via admin dashboard |
| Cards created per user | > 10 | Track via admin dashboard |
| D7 retention | > 30% | Requires date-based query on review_history |
| Crash/error rate | < 1% | Error logs |
| Study mode distribution | Track | review_history.study_mode breakdown |
| Explanation feature usage | Track | explanations table count |
| TTS usage | Track | api_usage where call_type='tts' |

### Phase 2 KPIs

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Total registered users | 1,000+ | Users table count |
| WAL | 200+ | Weekly active count from review_history |
| D30 retention | > 15% | 30-day return rate |
| Conversion to premium | > 3% | Paying / total users |
| MRR (Monthly Recurring Revenue) | > $100 | Sum of active subscriptions (net) |
| Viral coefficient | > 0.3 | New users from referrals / existing users |
| Average streak length | > 5 days | Median from users.current_streak |
| Quiz completion rate | > 60% | Sessions completed / started |
| Cost per active user | < $0.05/mo | api_usage aggregation |

### Phase 3 KPIs

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Total registered users | 10,000+ | Users table count |
| WAL | 2,000+ | Weekly active count |
| D30 retention | > 20% | Improving retention |
| Conversion to premium | > 5% | Higher conversion with more features |
| MRR | > $1,000 | Sustainable revenue |
| Language pairs active | 5+ | Users active across multiple pairs |

### Tracking Implementation

Current capabilities:
1. **admin dashboard** already shows global stats, per-user costs, API usage
2. **review_history table** tracks every practice session with timestamps
3. **api_usage table** tracks every LLM/TTS call with costs
4. **users table** tracks streaks and last practice date

To add:
- Daily metrics aggregation (cron or on-demand admin endpoint)
- Retention cohort analysis (query review_history by user registration date)
- Funnel metrics (card created -> practiced -> retained)

No need for Mixpanel/Amplitude until 5K+ users.

---

## APPENDIX A: Telegram Stars Payment Flow (Phase 2)

```
User Journey:
1. User taps "Upgrade" in Settings page
2. Mini App calls: POST /api/subscribe {plan: "monthly"}
3. Backend creates invoice via Bot API:
   bot.create_invoice_link(
     title="Tili Premium (Monthly)",
     description="Unlimited cards, translations, and language pairs",
     payload=f"premium_monthly_{user_id}_{timestamp}",
     currency="XTR",  # Telegram Stars
     prices=[LabeledPrice(label="Premium Monthly", amount=250)]
   )
4. Backend returns invoice URL to frontend
5. Frontend opens invoice via WebApp.openInvoice(url)
6. User pays in Telegram's native UI
7. Telegram sends pre_checkout_query to bot -> bot answers with ok=True
8. Telegram sends successful_payment to bot
9. Handler updates user tier + creates subscription record
10. Next Mini App API call sees premium tier
```

## APPENDIX B: Phase 2 Database Additions

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    telegram_payment_charge_id TEXT,
    plan TEXT NOT NULL,                     -- 'monthly', 'annual', 'lifetime'
    stars_amount INTEGER,
    status TEXT DEFAULT 'active',           -- 'active', 'cancelled', 'expired'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    cancelled_at TIMESTAMP
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, status);

-- Users table additions
-- ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'free';
-- ALTER TABLE users ADD COLUMN tier_expires_at TIMESTAMP;
-- ALTER TABLE users ADD COLUMN daily_translations_used INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN daily_reset_at TIMESTAMP;

-- Badges table
CREATE TABLE badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    badge_type TEXT NOT NULL,               -- 'words_10', 'streak_7', 'quiz_perfect', etc.
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_type)
);

-- Referrals table
CREATE TABLE referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER NOT NULL,
    referred_id INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rewarded INTEGER DEFAULT 0
);

-- Pre-built word list templates
CREATE TABLE deck_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    language_pair TEXT NOT NULL,
    card_count INTEGER DEFAULT 0,
    category TEXT,                           -- 'kpop', 'topik', 'travel', 'daily'
    is_premium INTEGER DEFAULT 0,
    data_json TEXT NOT NULL                  -- JSON array of {source_text, target_text, ...}
);
```

## APPENDIX C: ADR -- Phase 2 Focus Decision

**Decision:** Pursue Feature-depth-first (Option C) for the next 4-6 weeks before layering in monetization.

**Drivers:**
1. Retention is the biggest risk for a new vocabulary app -- users must see value before being asked to pay
2. Pre-built word lists and sentence practice create "aha moments" that drive organic sharing
3. The existing rate limiting and cost ceiling infrastructure already protects against cost blowup

**Alternatives considered:**
- *Monetization-first (Option A):* Rejected because the user base is too small to generate meaningful revenue, and a paywall would hurt the critical early retention phase
- *Growth-first (Option B):* Rejected because growing users without deeper features leads to high churn and wasted LLM spend

**Why chosen:** Option C builds the features that make users want to stay (retention) and want to share (organic growth), which naturally creates the user base needed for monetization. The cost controls already in place (rate limits, daily ceiling) make it safe to grow without revenue for 4-6 more weeks. Monetization readiness is critical but strategically sequenced: infrastructure is built in Weeks 7-9, activated at launch in Week 9, while feature depth work continues in parallel from Week 10.

**Consequences:**
- Revenue generation delayed by ~4-6 weeks
- LLM costs will grow (but are capped by existing controls)
- Must monitor daily spend via admin dashboard
- Must set a hard deadline for monetization implementation

**Cost risk bound:** At the $0.10/user/day ceiling, worst-case monthly cost = active_users x $3/month. Examples: 50 active users = $150/month, 150 active users = $450/month. The founder's personal subsidy tolerance should be set explicitly (e.g., $50/month). If monthly LLM costs exceed this threshold before payment is live, immediately accelerate Tasks 2.01-2.03.

**Follow-ups:**
- Set calendar reminder: Week 12 -- begin monetization implementation regardless of feature progress
- Track daily API costs weekly via admin dashboard
- If daily costs exceed $5/day before monetization, accelerate payment integration

---

*End of Plan*
