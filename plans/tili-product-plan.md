# Tili: Multi-Language Vocabulary Learning Product Plan

**Date:** 2026-02-20 (Original) | 2026-03-07 (Revised)
**Status:** REVISED — Updated per founder feedback
**Author:** Planner (Prometheus), reviewed by Architect & Critic. Revised by founder.

---

## Revision Summary (2026-03-07)

Key changes from original plan:
1. **Bot removed** — Mini App is the only interface (no tili-core extraction needed)
2. **Default LLM** → GPT-4.1-mini (Claude Haiku 4.5 as secondary)
3. **Decks** moved to Phase 1 (originally "Card tags/categories" in Phase 2)
4. **Reverse practice mode** moved to Phase 1
5. **Reverse translation** — bidirectional input (e.g., English → Korean)
6. **Word explanation feature** added to Phase 1 — etymology, structure, roots (on-demand, cached)
7. **PC scrolling fix** added to Phase 1
8. **Multi-language support** at end of Phase 1 with Settings page for language pair switching
9. **Advanced practice (Quiz)** added to Phase 2
10. **Payments** moved entirely to Phase 2 (app is private/friends-only in Phase 1)
11. **Streak tracking** moved to Phase 1

---

## 1. EXECUTIVE SUMMARY

### Product Vision

Tili is an AI-powered vocabulary learning app built natively for Telegram that serves **underserved language pairs** in Central Asia and the Korean language learning market. It combines the proven effectiveness of SM-2 spaced repetition with instant AI translation, delivered through Telegram's zero-friction Mini App platform.

**One-line pitch:** "The Anki that doesn't suck, for language pairs Duolingo ignores, inside the app you already use."

### Value Proposition

| For | Who | Tili is | Unlike |
|-----|-----|---------|--------|
| Korean learners in CIS/Central Asia | Want to learn Korean vocabulary driven by K-pop/Hallyu culture | An AI flashcard app inside Telegram with spaced repetition | Duolingo (no Korean-Russian), Anki (terrible UX), Memrise (no Korean-Kyrgyz) |
| English learners in Kyrgyzstan/Central Asia | Need practical English vocabulary | A native Telegram learning tool in their language | Western apps that only offer English-Spanish/French/etc. |

### Target Market and Positioning

**Primary beachhead:** Korean learners in CIS countries (Russia, Kazakhstan, Uzbekistan, Kyrgyzstan) who use Telegram daily and are underserved by existing apps.

**Secondary expansion:** English learners in Central Asia, then broader Korean learners globally.

**Positioning:** Not a full course app (not competing with Duolingo on grammar/listening). Positioned as the **best vocabulary acquisition tool** for specific language pairs, with the lowest friction distribution (Telegram).

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

> **Note (Critic review):** Conversion rates adjusted to 2-3% from original 5-8% to match industry benchmarks for freemium apps in lower-purchasing-power markets. Central Asian markets have demonstrated lower willingness to pay than Western markets. At 3% conversion with 15K users, Year 1 ARR is ~$16K -- still viable as a side project with near-zero costs.

### Key Opportunities

1. **First-mover in niche:** No quality Korean-Russian or Korean-Kyrgyz SRS app exists on Telegram
2. **Zero CAC distribution:** Telegram Mini Apps are discoverable through forwarding, group sharing, and the Mini App catalog -- no App Store ASO battle
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

Tili aims for the top-right quadrant: high-quality SRS (SM-2) with easy UX (Telegram native), differentiated by language pair coverage.

---

## 3. KEY FEATURES (Prioritized)

### What Already Exists (Current State)

**Tiliminiapp (Mini App) — the sole interface:**
- Full flashcard CRUD via React + FastAPI
- Practice mode with flip cards and difficulty rating (Easy/Medium/Hard)
- Random-side practice (shows Korean or English randomly)
- Telegram initData HMAC-SHA256 authentication
- Session persistence, haptic feedback, dark/light theme
- Card editing, viewing, deleting
- Paginated card list
- Statistics with interval distribution chart
- Dual LLM provider support (Anthropic Claude / OpenAI)
- SQLite with WAL mode

**What's Missing for Phase 1 Launch:**
- Multi-language support (currently Korean -> English only)
- Decks (cards are in a flat list)
- Explicit reverse practice toggle (currently random-only)
- Reverse translation direction (can only input Korean)
- Word explanation feature (etymology, roots, structure)
- PC scrolling broken on desktop
- Streak tracking
- User preferences table
- Settings page with language pair selector

### Phase 1: Core Product Features (Weeks 1-6)

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| Fix PC scrolling | P0 | LOW | CSS fix for desktop overflow |
| Switch LLM to GPT-4.1-mini | P0 | LOW | Cost optimization; Claude Haiku 4.5 as fallback |
| DB migration: language-agnostic columns | P0 | MEDIUM | Rename `korean`/`english` → `source_text`/`target_text` |
| Users table | P0 | MEDIUM | Preferences, streaks, active language pair |
| Decks table + CRUD | P0 | MEDIUM | Organize cards into language-pair-scoped decks |
| Update backend for new schema | P0 | HIGH | All models, routers, LLM service |
| Update frontend for new schema | P0 | HIGH | Types, pages, components — dynamic labels |
| Parameterize LLM prompts | P0 | MEDIUM | Template system for any language pair |
| Reverse translation direction | P1 | MEDIUM | Input in either language; LLM auto-detects |
| Reverse practice toggle | P1 | LOW | Source→Target, Target→Source, or Random |
| Deck UI in Cards page | P1 | MEDIUM | Horizontal chip filter + CRUD modals |
| Deck integration in Add Card | P1 | LOW | Select deck when adding a card |
| Word explanation — backend | P1 | MEDIUM | LLM etymology/structure; cached in DB |
| Word explanation — frontend | P1 | MEDIUM | "Explain" button on Add, Practice, Cards pages |
| Streak tracking — backend | P1 | LOW | Daily streak logic in users table |
| Streak tracking — frontend | P1 | LOW | Display on Home + Stats pages |
| Settings page + language pair selector | P1 | MEDIUM | Gear icon on Home; switch active pair |
| Filter practice/cards by language pair | P1 | MEDIUM | Practice + cards respect active pair |
| Translation cache | P2 | LOW | Cache LLM results per language pair |
| Remove bot references | P2 | LOW | Clean up mini-app-only codebase |

**Target language pairs for Phase 1:**
1. Korean → English (exists, to be generalized)
2. English → Korean
3. Korean → Russian
4. English → Russian

### Phase 2: Growth, Monetization & Advanced Features (Weeks 7-16)

| Feature | Priority | Description |
|---------|----------|-------------|
| User tier system + free limits | P0 | 50 cards, 15 translations/day, 2 language pairs for free |
| Telegram Stars payment | P0 | Stars subscription via Telegram Payments API |
| Premium upgrade UI | P0 | Pricing page + banner when limits hit |
| Advanced practice — Quiz mode | P1 | Multiple-choice with 4 options, score tracking |
| Quiz progress tracking | P1 | Accuracy %, most-missed words, trends |
| Pre-built word lists | P1 | Curated installable decks (K-pop, TOPIK, Travel) |
| Badges/achievements | P2 | Milestone badges (10, 50, 100, 500 words; streaks) |
| Social sharing cards | P2 | Shareable streak/achievement images for Telegram |
| Daily review reminders | P2 | Telegram notification when cards are due |
| Korean-Kyrgyz + English-Kyrgyz | P2 | New language pairs (validate LLM quality first) |
| Audio pronunciation (TTS) | P3 | Speaker icon on cards; Web Speech API or Google TTS |
| Referral program | P3 | Invite 3 friends → 1 week free premium |

### Phase 3: Scale & Differentiation (Weeks 17-32)

| Feature | Priority | Description |
|---------|----------|-------------|
| Group learning | P2 | Shared word lists for classes/study groups |
| Leaderboards | P2 | Weekly/monthly leaderboards among friends |
| Contextual sentences | P3 | AI-generated sentences at user's level |
| Grammar hints | P3 | Brief grammar notes attached to examples |
| Offline mode | P3 | Cache cards locally for practice without internet |
| Spaced repetition optimization | P3 | FSRS or adaptive algorithm based on performance |
| API for third-party content | P3 | Allow educators to create and distribute word lists |
| Additional language pairs | Ongoing | Uzbek, Kazakh based on demand |

---

## 4. MONETIZATION STRATEGY

> **Note:** All monetization is deferred to Phase 2. Phase 1 is private/friends-only with no usage limits.

### Tier Structure

**Free Tier (forever free, enforced in Phase 2):**
- 50 flashcards maximum
- 15 AI translations per day
- 2 active language pairs
- Basic SRS practice
- Basic stats

**Premium Tier ($3.49/month = ~250 Stars):**
- Unlimited flashcards
- Unlimited AI translations
- All language pairs
- Advanced quiz mode
- Pre-built word lists
- Priority support

**Premium Annual ($29.99/year = ~2,100 Stars):**
- Everything in Premium
- ~28% discount vs monthly
- Early access to new features

**Lifetime ($69.99 = ~5,000 Stars):**
- Everything in Premium, forever
- Introduced after product-market fit is validated (late Phase 2)

### Pricing Rationale

- **$3.49/month** is at the low end of global language app pricing ($4-14/month) but calibrated for Central Asian purchasing power
- In Stars: ~250 Stars/month. Users buy Stars at roughly $0.014/Star through Telegram
- Developer receives ~65% after Telegram + payment processor cuts: ~$2.27/month net per subscriber
- This is still ~17x the LLM cost per active user (~$0.13/month at 100 translations/month)

### Revenue Projections

**Conservative scenario (2-3% conversion -- recommended for planning):**

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

### Phase 1: Soft Launch (Weeks 1-6)

Phase 1 is private — founder and close friends only. Focus on building the core product.

### Phase 2: First 1,000 Users (Weeks 7-12)

**Launch channels (all organic, $0 budget):**

1. **K-pop fan communities on Telegram** (highest ROI)
   - Join 20-30 K-pop fan groups in Russian-speaking Telegram (BTS, Blackpink, Stray Kids fan groups)
   - Share the Mini App with a message like: "Made a free tool to learn Korean words from your favorite songs"
   - Create a "K-pop Vocabulary" pre-built word list as a hook
   - Target: 200-500 users from this channel alone

2. **Korean language learning Telegram groups**
   - Post in Korean study groups for Russian speakers
   - Offer the app as a complementary tool to their existing study
   - Target: 100-200 users

3. **Reddit/X communities**
   - r/Korean, r/languagelearning, r/kpop
   - Product Hunt launch
   - Target: 100-200 users

4. **Personal network & founder-led content**
   - Founder's personal Telegram, social media
   - "Building in public" posts about the product
   - Target: 50-100 users

### Phase 3: 1,000 to 10,000 Users (Weeks 12-24)

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
   - Korean language teachers on Telegram (affiliate program: 20% of referral revenue)
   - K-pop fan community admins (free premium for promotion)
   - Target: 1,000-2,000 users from partnerships

4. **Telegram Mini App Store / Discovery**
   - Optimize listing in Telegram's Mini App catalog
   - Target featured placement in Education category
   - Target: 500-1,000 users/month from discovery

### Phase 4: 10,000+ Users (Month 6-12)

1. **Paid acquisition (if unit economics justify)**
   - Telegram Ads (targeted to CIS users in language learning groups)
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

**Single codebase: tiliminiapp** (Telegram bot removed — Mini App is the sole interface)

```
tiliminiapp/
├── backend/                    # Python FastAPI
│   ├── main.py                # App setup, CORS, lifespan
│   ├── config.py              # Environment configuration
│   ├── auth.py                # Telegram initData HMAC-SHA256 auth
│   ├── db/
│   │   ├── connection.py      # SQLite init, migrations, schema
│   │   └── models.py          # All database CRUD operations
│   ├── services/
│   │   ├── llm.py             # AI translation + explanation (multi-provider)
│   │   └── srs.py             # SM-2 spaced repetition algorithm
│   └── routers/
│       ├── cards.py           # Card CRUD + translation
│       ├── practice.py        # Practice session + SRS review
│       ├── stats.py           # Learning statistics
│       ├── decks.py           # Deck CRUD
│       └── users.py           # User profile + preferences
└── frontend/                   # React 18 + TypeScript + Vite
    └── src/
        ├── App.tsx            # Root with hash routing
        ├── types.ts           # TypeScript interfaces
        ├── api.ts             # API client with Telegram auth
        ├── utils/
        │   └── languages.ts   # Language pair display names
        ├── contexts/
        │   └── AppContext.tsx  # Global state (user, theme, language pair)
        ├── pages/
        │   ├── HomePage.tsx
        │   ├── AddCardPage.tsx
        │   ├── PracticePage.tsx
        │   ├── CardsListPage.tsx   # Includes deck filter chips
        │   ├── StatsPage.tsx
        │   └── SettingsPage.tsx
        └── components/
            ├── NavigationBar.tsx
            ├── FlashCard.tsx
            ├── DifficultyButtons.tsx
            └── ...
```

### Strengths (Current)
- Clean async Python codebase
- Factory pattern for LLM providers (easy to add new models)
- Proper Telegram initData auth (HMAC-SHA256)
- SQLite with WAL mode (good for single-server)
- Well-separated concerns: routers → services → db

### Weaknesses/Gaps (to be fixed in Phase 1)
- Hardcoded Korean-English language pair throughout (SYSTEM_PROMPT, column names `korean`/`english`)
- No user management table (user_id exists in flashcards but no users table)
- No decks or card organization
- No word explanation feature
- PC scrolling broken on desktop
- Column names (`korean`, `english`) are language-specific, not generic

### Database Schema (Phase 1 Target)

```sql
-- Users table (new)
CREATE TABLE users (
    id INTEGER PRIMARY KEY,                -- Telegram user ID
    telegram_username TEXT,
    first_name TEXT,
    last_name TEXT,
    active_language_pair TEXT DEFAULT 'ko-en',
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date TEXT,               -- YYYY-MM-DD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Decks table (new)
CREATE TABLE decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    language_pair TEXT NOT NULL DEFAULT 'ko-en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name, language_pair)
);
CREATE INDEX idx_decks_user ON decks(user_id);

-- Flashcards table (modified — columns renamed, deck_id added)
CREATE TABLE flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    deck_id INTEGER REFERENCES decks(id),
    language_pair TEXT NOT NULL DEFAULT 'ko-en',
    source_text TEXT NOT NULL,             -- was 'korean'
    target_text TEXT NOT NULL,             -- was 'english'
    example_source TEXT,                   -- was 'example_kr'
    example_target TEXT,                   -- was 'example_en'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0
);
CREATE INDEX idx_flashcards_user_lang ON flashcards(user_id, language_pair, next_review);
CREATE UNIQUE INDEX idx_user_source ON flashcards(user_id, language_pair, source_text);

-- Explanations table (new — cached word explanations)
CREATE TABLE explanations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flashcard_id INTEGER NOT NULL UNIQUE REFERENCES flashcards(id) ON DELETE CASCADE,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Translation cache (new)
CREATE TABLE translation_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_pair TEXT NOT NULL,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    example_source TEXT,
    example_target TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(language_pair, source_text)
);

-- Schema versioning (new)
CREATE TABLE schema_versions (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Additional Schema for Phase 2

```sql
-- Subscriptions table (Phase 2)
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

-- Users table additions for Phase 2
-- ALTER TABLE users ADD tier TEXT DEFAULT 'free';
-- ALTER TABLE users ADD tier_expires_at TIMESTAMP;
-- ALTER TABLE users ADD daily_translations_used INTEGER DEFAULT 0;
-- ALTER TABLE users ADD daily_reset_at TIMESTAMP;

-- Quiz results (Phase 2)
CREATE TABLE quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    flashcard_id INTEGER NOT NULL REFERENCES flashcards(id),
    correct BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### LLM Service Architecture

**Default provider:** OpenAI GPT-4.1-mini (cost-optimized)
**Secondary provider:** Anthropic Claude Haiku 4.5 (fallback)

The LLM service supports two operations:
1. **Translation:** `translate(word, source_lang, target_lang)` — translates a word/phrase between any supported pair
2. **Explanation:** `explain_word(word, translation, source_lang, target_lang)` — provides etymology, structure, roots, usage notes

Both use parameterized prompt templates that work for any language pair.

**Translation prompt supports bidirectional input:** The user may input text in either language. The LLM detects the input language and returns `source_text` in the source language and `target_text` in the target language.

**Language Pair Configuration:**

```python
SUPPORTED_PAIRS = {
    "ko-en": {"source": "Korean", "target": "English"},
    "en-ko": {"source": "English", "target": "Korean"},
    "ko-ru": {"source": "Korean", "target": "Russian"},
    "en-ru": {"source": "English", "target": "Russian"},
    # Phase 2:
    "ko-ky": {"source": "Korean", "target": "Kyrgyz"},
    "en-ky": {"source": "English", "target": "Kyrgyz"},
}
```

### Migration Strategy

SQLite column renames require a CREATE-COPY-DROP-RENAME approach:

1. Create `schema_versions` table (idempotent tracking)
2. Create `users` table
3. Backfill: `INSERT OR IGNORE INTO users (id) SELECT DISTINCT user_id FROM flashcards`
4. Create `decks` table
5. Create Default decks for each user
6. Create `flashcards_new` with renamed columns + `deck_id` + `language_pair`
7. Copy data with column mapping (all existing cards get `language_pair='ko-en'`)
8. Drop old table, rename new table
9. Recreate indexes
10. Create `explanations` and `translation_cache` tables

**All steps must run in a single transaction. Backup the database before running.**

### Scaling Considerations

| Users | Database | Hosting | Notes |
|-------|----------|---------|-------|
| 0-10K | SQLite (current) | Single VPS ($10-20/mo) | Totally fine with WAL mode |
| 10K-50K | SQLite still viable | Larger VPS ($20-40/mo) | Monitor write contention |
| 50K-100K | Migrate to PostgreSQL | VPS + managed DB ($40-80/mo) | Only if write contention appears |
| 100K+ | PostgreSQL + read replicas | Cloud ($100-200/mo) | Unlikely in Year 1 |

### LLM Cost Optimization

1. **Model selection:** GPT-4.1-mini as default (~$0.10/1M input tokens). Sufficient for vocabulary translation.
2. **Translation caching:** Cache common word translations in DB. If user B translates the same word as user A in the same language pair, serve from cache.
3. **Explanation caching:** Each word explained once, cached forever per card.
4. **Batch translations:** For pre-built word lists (Phase 2), translate once and store.

---

## 7. COST & EXPENSE PROJECTIONS

### Monthly Cost Model

| Cost Item | 100 Users | 1K Users | 10K Users | 100K Users |
|-----------|-----------|----------|-----------|------------|
| **Hosting (VPS)** | $10 | $10 | $20 | $80 |
| **LLM API (translations + explanations)** | $1 | $10 | $60 | $350 |
| **Domain + SSL** | $1 | $1 | $1 | $1 |
| **Monitoring (free tier)** | $0 | $0 | $0 | $20 |
| **Database (if PostgreSQL)** | $0 | $0 | $0 | $40 |
| **Total monthly** | **$12** | **$21** | **$81** | **$491** |

**LLM cost assumptions:**
- Average active user: 3 translations/day + 1 explanation/week
- With caching (30% hit rate): ~42 LLM translation calls + 4 explanation calls per user/month
- GPT-4.1-mini cost: ~$0.00015 per translation, ~$0.001 per explanation
- Cost per active user/month: ~$0.01
- Assuming 30% of total users are active in a given month

---

## 8. IMPLEMENTATION PLAN

### Phase 1: Core Product (Weeks 1-6)

**Goal:** A fully functional multi-language vocabulary learning app for the founder and close friends. No payments, no usage limits.

#### Task Dependency Graph

```
1.01 (PC scroll)  ─────────────────────────────────────────────────────►
1.02 (LLM switch) ──► 1.08 (LLM prompts) ──► 1.09 (reverse translate)
1.03 (DB rename)  ──► 1.04 (users table) ──► 1.05 (decks table) ──► 1.06 (backend update) ──► 1.07 (frontend update)
                       1.04 ──► 1.15 (streak backend) ──► 1.16 (streak frontend)
                       1.04 + 1.08 ──► 1.17 (settings) ──► 1.18 (pair filter)
                       1.05 + 1.07 ──► 1.11 (deck UI) ──► 1.12 (deck in add card)
                       1.06 + 1.08 ──► 1.13 (explain backend) ──► 1.14 (explain frontend)
                       1.07 ──► 1.10 (reverse practice)
                       1.06 ──► 1.19 (translation cache)
1.20 (cleanup)    ─────────────────────────────────────────────────────►
```

#### TASK 1.01: Fix PC scrolling issue

**Priority:** P0 | **Effort:** Small | **Depends on:** —
**Files:** `frontend/src/styles/global.css`

The Mini App cannot scroll on PC/desktop. Root cause: `.page` uses `flex: 1` inside a flex column `#root` with `min-height: 100vh`, but no `overflow-y: auto`. On mobile, Telegram WebView handles scrolling natively, but desktop browsers need explicit overflow.

**Changes:**
- `#root`: change `min-height: 100vh` → `height: 100vh` so flex children can scroll within bounds
- `.page`: add `overflow-y: auto` so content scrolls within the page container
- Test all pages on desktop (especially CardsListPage with many cards, AddCardPage with translation results)

**Acceptance criteria:**
- All pages scroll on desktop/PC browser
- Mobile scrolling unchanged
- Bottom navigation bar stays fixed at bottom

---

#### TASK 1.02: Switch default LLM to GPT-4.1-mini

**Priority:** P0 | **Effort:** Small | **Depends on:** —
**Files:** `backend/config.py`, `backend/services/llm.py`, `.env.example`

Change default LLM provider to OpenAI with `gpt-4.1-mini`. Claude Haiku 4.5 stays as secondary.

**Changes:**
- `config.py:19`: `LLM_PROVIDER` default → `"openai"`
- `config.py:26`: `LLM_MODEL` default → `"gpt-4.1-mini"`
- `llm.py:123`: `OpenAIProvider.__init__` fallback model → `"gpt-4.1-mini"`
- Update `.env.example` to reflect new defaults

**Acceptance criteria:**
- Default provider is OpenAI with `gpt-4.1-mini`
- `LLM_PROVIDER=anthropic` still works with Claude Haiku 4.5
- Translation verified with test words

---

#### TASK 1.03: DB migration — rename columns to language-agnostic

**Priority:** P0 | **Effort:** Medium | **Depends on:** —
**Files:** `backend/db/connection.py`, `backend/db/models.py`

Rename hardcoded Korean/English columns to generic names via SQLite CREATE-COPY-DROP-RENAME approach. Foundation for all multi-language work.

**Column renames in `flashcards`:**
- `korean` → `source_text`
- `english` → `target_text`
- `example_kr` → `example_source`
- `example_en` → `example_target`
- Add: `language_pair TEXT NOT NULL DEFAULT 'ko-en'`

**Migration steps (single transaction):**
1. Create `schema_versions` table to track migrations
2. Check if migration already applied (idempotent)
3. Create `flashcards_new` with new columns
4. Copy data with column mapping; all existing cards get `language_pair = 'ko-en'`
5. `DROP TABLE flashcards` → `ALTER TABLE flashcards_new RENAME TO flashcards`
6. Recreate indexes: `idx_user_review(user_id, next_review)`, `idx_user_source(user_id, language_pair, source_text)`

**Acceptance criteria:**
- Migration runs idempotently (safe to run multiple times)
- Existing data preserved with `language_pair = 'ko-en'`
- Indexes recreated
- `_SCHEMA` in `connection.py` updated for fresh installs

---

#### TASK 1.04: DB — add users table

**Priority:** P0 | **Effort:** Medium | **Depends on:** 1.03
**Files:** `backend/db/connection.py`, `backend/db/models.py`

Create `users` table for preferences, streaks, and language pair selection. Backfill from existing flashcard data.

**Schema:** See Section 6 (Technical Architecture).

**Model functions to add:**
- `get_or_create_user(conn, user_id, first_name, username, last_name)` — upsert
- `get_user(conn, user_id)` → dict | None
- `update_user_preferences(conn, user_id, **kwargs)`

**Backfill:** `INSERT OR IGNORE INTO users (id) SELECT DISTINCT user_id FROM flashcards`

**Integration:** Update all routers to call `get_or_create_user` on every authenticated request.

**Acceptance criteria:**
- Users table created on startup
- Existing users backfilled
- New users auto-created on first API call
- Preferences persist across sessions

---

#### TASK 1.05: DB — add decks table

**Priority:** P0 | **Effort:** Medium | **Depends on:** 1.03, 1.04
**Files:** `backend/db/connection.py`, `backend/db/models.py`

Create `decks` table. Each deck is tied to one language pair. Every user gets a "Default" deck auto-created. Add `deck_id` to flashcards.

**Schema:** See Section 6 (Technical Architecture).

**Migration:**
1. Create decks table
2. For each distinct `user_id` in flashcards, create a "Default" deck with `language_pair='ko-en'`
3. Set all existing flashcards' `deck_id` to their user's Default deck

**Model functions:**
- `create_deck(conn, user_id, name, description, language_pair)` → deck_id
- `get_user_decks(conn, user_id, language_pair=None)` → list of decks with card counts
- `get_deck(conn, deck_id, user_id)` → dict | None
- `update_deck(conn, deck_id, user_id, name, description)` → dict | None
- `delete_deck(conn, deck_id, user_id)` — moves cards to Default; prevent deleting Default
- `move_card_to_deck(conn, card_id, deck_id, user_id)`
- `get_or_create_default_deck(conn, user_id, language_pair)`

**Acceptance criteria:**
- Decks table created, Default deck auto-created per user
- Existing cards linked to Default deck
- CRUD operations work
- Cannot delete Default deck

---

#### TASK 1.06: Update backend models/routers for new schema

**Priority:** P0 | **Effort:** Large | **Depends on:** 1.03, 1.04, 1.05
**Files:** `backend/db/models.py`, `backend/routers/cards.py`, `backend/routers/practice.py`, `backend/routers/stats.py`, `backend/services/llm.py`

Update all Python code from old column names to new ones. Update Pydantic models and request/response schemas.

**`models.py` changes:**
- `add_flashcard()`: params `korean` → `source_text`, `english` → `target_text`, etc. Add `language_pair`, `deck_id`.
- `check_duplicate()`: check by `(user_id, language_pair, source_text)`
- `get_due_flashcards()`: add optional `language_pair` and `deck_id` filters
- `get_all_flashcards()`: add optional `language_pair` and `deck_id` filters
- `update_flashcard()`: update field names
- All SQL queries: reference new column names

**`llm.py` changes:**
- `TranslationResult` fields: `korean` → `source_text`, `english` → `target_text`, etc.

**Router changes:**
- `CardCreateRequest`: fields renamed. Add optional `deck_id`, `language_pair`.
- `CardUpdateRequest`: fields renamed.
- `translate_word()`: accept `language_pair` param.

**Acceptance criteria:**
- All API endpoints work with new field names
- Zero references to `korean`/`english`/`example_kr`/`example_en` column names in Python code

---

#### TASK 1.07: Update frontend types/pages for new field names

**Priority:** P0 | **Effort:** Large | **Depends on:** 1.06
**Files:** `frontend/src/types.ts`, `frontend/src/api.ts`, all pages, all components

Update all TypeScript interfaces and component references. Make labels dynamic.

**`types.ts`:**
- `Flashcard`: `korean` → `source_text`, etc. Add `language_pair`, `deck_id`.
- `TranslationResult`: same renames.
- Add `Deck` interface.

**`FlashCard.tsx`:**
- `showSide` type: `'korean' | 'english'` → `'source' | 'target'`
- Labels derived from `card.language_pair` using `getLanguageNames()` helper.

**`PracticePage.tsx`:**
- `showSide` state and `SavedSession`: `'korean' | 'english'` → `'source' | 'target'`

**All pages:** Dynamic labels, updated field references.

**New utility:** `frontend/src/utils/languages.ts` — language pair code → display names.

**Acceptance criteria:**
- All frontend code uses new field names
- Labels are dynamic (not hardcoded "Korean"/"English")
- Zero TypeScript errors

---

#### TASK 1.08: Parameterize LLM prompts for multi-language

**Priority:** P0 | **Effort:** Medium | **Depends on:** 1.02
**Files:** `backend/services/llm.py`

Replace hardcoded Korean-English system prompt with a template system.

**Changes:**
- Add `SUPPORTED_PAIRS` config dict
- Add `build_translation_prompt(source_lang, target_lang)` function
- New `LLMProvider` method: `translate(word, source_lang, target_lang)` replaces `translate_korean(word)`
- Handle language-specific instructions (Korean: 존댓말, Russian: formal)

**Acceptance criteria:**
- Translation works for all 4 supported pairs
- JSON output consistent across pairs

---

#### TASK 1.09: Reverse translation direction (bidirectional input)

**Priority:** P1 | **Effort:** Medium | **Depends on:** 1.08
**Files:** `backend/routers/cards.py`, `backend/services/llm.py`, `frontend/src/pages/AddCardPage.tsx`

Allow input in either language. LLM auto-detects and always returns `source_text` in source language.

**Backend:** LLM prompt: "The user may input text in either language. Detect and provide translation. Always return `source_text` in {source_lang}."

**Frontend:** Dynamic placeholder: "Enter a word in Korean or English" (per active pair).

**Acceptance criteria:**
- Input "hello" with `ko-en` → source_text="안녕하세요", target_text="hello"
- Input "안녕하세요" with `ko-en` → same result

---

#### TASK 1.10: Reverse practice mode — explicit toggle

**Priority:** P1 | **Effort:** Small | **Depends on:** 1.07
**Files:** `frontend/src/pages/PracticePage.tsx`

Add practice direction selector: Source→Target (default), Target→Source, Random.

**Changes:**
- Mode selector UI at top of practice session
- Store choice in session storage
- Set `showSide` per card based on mode
- Dynamic prompt: "What does this mean in {other_language}?"

**Acceptance criteria:**
- User can choose practice direction
- Choice persists during session

---

#### TASK 1.11: Deck UI — filter/section inside Cards page

**Priority:** P1 | **Effort:** Medium | **Depends on:** 1.05, 1.07
**Files:** `frontend/src/pages/CardsListPage.tsx`, `frontend/src/api.ts`, `backend/routers/decks.py` (new), `backend/main.py`

Add deck management inside Cards page with horizontal chip filter.

**Backend — new `routers/decks.py`:**
- `GET /api/decks` — list decks with card counts
- `POST /api/decks` — create deck
- `PUT /api/decks/{deck_id}` — update
- `DELETE /api/decks/{deck_id}` — delete (move cards to Default)

**Frontend — `CardsListPage.tsx`:**
- Horizontal scrollable chip bar: "All", "Default", user decks, "+ New Deck"
- Filter cards by deck selection
- Create/edit/delete modals

**Acceptance criteria:**
- Deck chips at top of Cards page
- Filter cards by deck
- CRUD via UI
- Default deck cannot be deleted

---

#### TASK 1.12: Deck integration in Add Card flow

**Priority:** P1 | **Effort:** Small | **Depends on:** 1.11
**Files:** `frontend/src/pages/AddCardPage.tsx`, `backend/routers/cards.py`

Deck selector dropdown in Add Card page. Default to Default deck.

**Acceptance criteria:**
- Cards assignable to specific deck during creation
- Default deck used when none selected

---

#### TASK 1.13: Word explanation feature — backend

**Priority:** P1 | **Effort:** Medium | **Depends on:** 1.06, 1.08
**Files:** `backend/services/llm.py`, `backend/routers/cards.py`, `backend/db/models.py`, `backend/db/connection.py`

LLM-powered word explanation: etymology, structure, roots, usage, extra examples. On-demand, cached.

**New table:** `explanations` (see Section 6 schema)

**New LLM method:** `explain_word(word, translation, source_lang, target_lang)` → markdown text

**Explanation prompt includes:**
1. Word structure/etymology/roots
2. How the word is formed (prefixes, suffixes, particles)
3. Common usage patterns
4. 2-3 additional example sentences with translations
5. Related words

Response in the target language. Markdown formatted.

**New endpoints:**
- `GET /api/cards/{card_id}/explanation` — cached or 404
- `POST /api/cards/{card_id}/explanation` — generate, cache, return

**Acceptance criteria:**
- First request generates via LLM, caches
- Subsequent requests return cached (no LLM call)
- Explanation includes structure, roots, examples

---

#### TASK 1.14: Word explanation feature — frontend

**Priority:** P1 | **Effort:** Medium | **Depends on:** 1.13
**Files:** `frontend/src/pages/AddCardPage.tsx`, `frontend/src/pages/PracticePage.tsx`, `frontend/src/pages/CardsListPage.tsx`, `frontend/src/api.ts`

"Explain" button on card views (after save only). Shows loading, then formatted explanation.

**Where it appears:**
- **AddCardPage:** after card is saved (uses saved card's ID)
- **PracticePage:** on revealed (answer) side
- **CardsListPage:** in expanded details and View Card overlay

**Acceptance criteria:**
- "Explain" button on Add (after save), Practice (after reveal), Cards pages
- First press: loading → explanation
- Subsequent presses: instant (cached)

---

#### TASK 1.15: Streak tracking — backend

**Priority:** P1 | **Effort:** Small | **Depends on:** 1.04
**Files:** `backend/db/models.py`, `backend/routers/practice.py`, `backend/routers/stats.py`

Track daily practice streaks in users table.

**Logic (after each successful review):**
- If `last_practice_date` is today → no change
- If yesterday → increment `current_streak`
- If older or NULL → reset to 1
- Update `longest_streak = max(longest_streak, current_streak)`
- Set `last_practice_date = today`

**Stats endpoint:** include `current_streak`, `longest_streak`.

**Acceptance criteria:**
- Streak increments on daily practice
- Resets after missing a day
- Longest streak tracked separately

---

#### TASK 1.16: Streak tracking — frontend

**Priority:** P1 | **Effort:** Small | **Depends on:** 1.15
**Files:** `frontend/src/pages/HomePage.tsx`, `frontend/src/pages/StatsPage.tsx`, `frontend/src/types.ts`

Display streaks on Home and Stats pages.

**HomePage:** Streak counter "🔥 5 day streak" below welcome message.
**StatsPage:** Current and longest streak section.

**Acceptance criteria:**
- Streak displayed on Home and Stats
- Zero streak handled gracefully

---

#### TASK 1.17: Settings page + language pair selector

**Priority:** P1 | **Effort:** Medium | **Depends on:** 1.04, 1.08
**Files:** `frontend/src/pages/SettingsPage.tsx` (new), `frontend/src/pages/HomePage.tsx`, `frontend/src/contexts/AppContext.tsx`, `frontend/src/App.tsx`, `backend/routers/users.py` (new), `backend/main.py`

Settings page via gear icon on Home page. Switch active language pair.

**Backend — new `routers/users.py`:**
- `GET /api/user/profile` — user with active_language_pair
- `PUT /api/user/language-pair` — update active pair

**Frontend:**
- SettingsPage with language pair radio list
- HomePage: gear icon → `/settings`, language pair badge
- AppContext: `activeLanguagePair` + `setActiveLanguagePair`, fetched on init

**Supported pairs:** `ko-en`, `en-ko`, `ko-ru`, `en-ru`

**Acceptance criteria:**
- Settings accessible from Home
- Language pair switching persists (DB)
- All pages access active pair via context

---

#### TASK 1.18: Filter practice and cards by language pair

**Priority:** P1 | **Effort:** Medium | **Depends on:** 1.17
**Files:** `backend/db/models.py`, `backend/routers/cards.py`, `backend/routers/practice.py`, `frontend/src/pages/PracticePage.tsx`, `frontend/src/pages/CardsListPage.tsx`

Practice and cards list respect active language pair.

**Backend:** Add `language_pair` filter to `get_due_flashcards()`, `get_all_flashcards()`, `get_user_stats()`.

**Frontend:** PracticePage passes active pair. CardsListPage defaults to active pair with "All" option.

**Acceptance criteria:**
- Practice only shows active pair cards
- Cards list filterable by pair
- Duplicate check scoped to `(user_id, language_pair, source_text)`

---

#### TASK 1.19: Translation cache table

**Priority:** P2 | **Effort:** Small | **Depends on:** 1.06
**Files:** `backend/db/connection.py`, `backend/db/models.py`, `backend/routers/cards.py`

Cache LLM translation results per language pair.

**Logic:** Check cache before LLM call. On hit, return cached. On miss, call LLM, store, return.

**Acceptance criteria:**
- Repeated translations served from cache
- Cache per language pair

---

#### TASK 1.20: Remove bot references, clean up

**Priority:** P2 | **Effort:** Small | **Depends on:** —
**Files:** Various

Remove references to Telegram bot codebase. Keep `TELEGRAM_BOT_TOKEN` (needed for initData auth). Update docs.

**Acceptance criteria:**
- No bot-specific references remain
- Auth still works
- Clean mini-app-only codebase

---

### Phase 2: Growth, Monetization & Advanced Features (Weeks 7-16)

**Goal:** Add payments, advanced practice, social features, and growth mechanics.

#### TASK 2.01: User tier system + free tier limits

**Priority:** P0 | **Effort:** Medium
**Files:** `backend/db/models.py`, `backend/db/connection.py`, `backend/routers/cards.py`, `backend/routers/practice.py`

Add `tier` to users table. Enforce: 50 cards max, 15 translations/day, 2 language pairs for free tier.

**Users table additions:** `tier`, `tier_expires_at`, `daily_translations_used`, `daily_reset_at`

**Middleware:** `check_tier_limits()` FastAPI dependency. HTTP 402 with upgrade prompt.

---

#### TASK 2.02: Telegram Stars payment integration

**Priority:** P0 | **Effort:** Large
**Files:** `backend/routers/subscribe.py` (new), `backend/db/models.py`, `backend/main.py`

Subscriptions table. Stars invoice creation via Bot API. Payment webhook. Subscription activation.

**Flow:** Mini App → `POST /api/subscribe` → Bot API invoice → user pays → webhook → subscription activated.

---

#### TASK 2.03: Premium upgrade UI

**Priority:** P0 | **Effort:** Medium
**Files:** `frontend/src/pages/SettingsPage.tsx`, `frontend/src/components/PremiumBanner.tsx` (new)

Upgrade prompt in Settings + banner when limits hit. Pricing, benefits, Stars payment trigger.

---

#### TASK 2.04: Advanced practice — Quiz mode

**Priority:** P1 | **Effort:** Large
**Files:** `frontend/src/pages/QuizPage.tsx` (new), `backend/routers/practice.py`, `backend/db/models.py`, `frontend/src/App.tsx`

Multiple-choice quiz: show source word, 4 target options (1 correct + 3 distractors). Score tracking.

**Backend:**
- `GET /api/practice/quiz?limit=10` — questions with shuffled options
- `POST /api/practice/quiz/answer` — submit answer, track result

**Frontend:** QuizPage with multiple-choice UI, score tracking, session summary.

---

#### TASK 2.05: Quiz progress tracking

**Priority:** P1 | **Effort:** Medium
**Files:** `backend/db/connection.py`, `backend/db/models.py`, `backend/routers/stats.py`, `frontend/src/pages/StatsPage.tsx`

`quiz_results` table. Show accuracy %, most-missed words, weekly trends.

---

#### TASK 2.06: Pre-built word lists (curated decks)

**Priority:** P1 | **Effort:** Medium
**Files:** `backend/routers/decks.py`, `backend/db/models.py`, data files

Installable curated decks: "K-pop Vocabulary", "Travel Phrases", "TOPIK Level 1".

- `GET /api/decks/templates` — available templates
- `POST /api/decks/install/{template_id}` — copy into user's account

---

#### TASK 2.07: Badges and achievements

**Priority:** P2 | **Effort:** Medium

Milestones: 10/50/100/500 words, 7/30/100 day streaks, first quiz 100%.

---

#### TASK 2.08: Social sharing cards

**Priority:** P2 | **Effort:** Medium

Shareable image/card: streak, word count, achievements. Share to Telegram chats.

---

#### TASK 2.09: Daily review reminders

**Priority:** P2 | **Effort:** Medium

Telegram message when cards are due. Max 1/day.

---

#### TASK 2.10: Kyrgyz language pairs

**Priority:** P2 | **Effort:** Small

Add `ko-ky`, `en-ky`. Validate LLM quality with native speakers first.

---

#### TASK 2.11: Audio pronunciation (TTS)

**Priority:** P3 | **Effort:** Medium

Speaker icon on flashcards. Browser Web Speech API or Google Cloud TTS.

---

#### TASK 2.12: Referral program

**Priority:** P3 | **Effort:** Medium

Referral links, tracking, 1 week free premium per 3 referrals.

---

### Phase 3: Scale & Differentiation (Weeks 17-32)

| Task | Timeline | Description |
|------|----------|-------------|
| Group learning / shared lists | Week 17-20 | Teachers create lists; students subscribe |
| Leaderboards | Week 20-22 | Weekly/monthly ranking among contacts |
| Advanced analytics dashboard | Week 22-26 | Retention curves, forgetting curves, optimal review times |
| PostgreSQL migration (if needed) | Week 26-30 | Only if SQLite shows contention at scale |
| Additional language pairs | Ongoing | Uzbek, Kazakh based on demand |

### Key Milestones

| Milestone | Target Date | Success Metric |
|-----------|-------------|----------------|
| Phase 1 feature-complete | Week 5 | All P0 + P1 features working |
| Soft launch (friends & beta) | Week 6 | 10-20 active testers, feedback collected |
| Public launch | Week 8 | Mini App publicly accessible |
| 500 users | Week 12 | Organic growth from launch channels |
| 1,000 users | Week 16 | Viral + community growth |
| First paying customer | Week 9 | Stars payment processed |
| 50 paying users | Week 16 | $100+/month net revenue |
| $1,000/month MRR | Month 6-8 | Sustainable product |

---

## 9. RISK ANALYSIS

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM quality for Kyrgyz translations | HIGH | MEDIUM | Validate with native speakers before launch; fall back to English as intermediary |
| Telegram API changes / Stars policy changes | LOW | HIGH | Abstract payment layer; keep alternative monetization path |
| Database migration breaks existing data | MEDIUM | HIGH | Idempotent migration with schema_versions; backup before running; test on copy |
| SQLite write contention at scale | LOW | MEDIUM | WAL mode handles most cases; migrate to PostgreSQL only if needed |
| GPT-4.1-mini translation quality | LOW | MEDIUM | Fallback to Claude Haiku 4.5; prompt engineering; test across language pairs |
| Word explanation quality varies by language | MEDIUM | LOW | Cache good explanations; allow manual override; test with native speakers |

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Korean learning trend fades in CIS | LOW | HIGH | Multi-language design allows pivot to English learning |
| Duolingo adds Korean-Russian | MEDIUM | MEDIUM | Tili's SRS depth + Telegram distribution are defensible |
| Telegram Mini App discoverability is poor | MEDIUM | MEDIUM | Rely on community/viral growth |
| Low willingness to pay in target market | MEDIUM | HIGH | Price at $3.49/mo; add lifetime tier; consider ads |
| Slow organic growth | HIGH | MEDIUM | Content marketing playbook; budget for Telegram Ads |

### Financial Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM API costs spike | LOW | LOW | Caching reduces calls 30-50%; switch providers |
| Revenue insufficient for founder | HIGH (Year 1) | HIGH | Side project until $2K+/month; costs < $20/month at small scale |
| Telegram takes larger cut of Stars | LOW | MEDIUM | Unit economics still work even at 50% cut |

### Mitigation Summary

1. **Validate Kyrgyz LLM quality early** -- test 100 common words with native speakers
2. **Keep costs near zero** -- SQLite, single VPS, GPT-4.1-mini
3. **Design for multi-language from day 1** -- generic schema, parameterized prompts
4. **Build viral loops into the product** -- streaks, sharing, referrals

---

## 10. SUCCESS METRICS & KPIs

### North Star Metric

**Weekly Active Learners (WAL):** Users who completed at least 1 review session in the past 7 days.

### Phase 1 KPIs (Soft Launch, Weeks 1-6)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Active beta testers | 10-20 | Users with ≥ 1 review |
| Cards created per user | > 10 | Avg cards in first 2 weeks |
| D7 retention | > 30% | Users who return 7 days after first use |
| Crash/error rate | < 1% | Error logs |
| Explanation feature usage | Track | % of cards with explanations generated |

### Phase 2 KPIs (Growth, Weeks 7-16)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Total registered users | 1,000+ | Users table count |
| WAL | 200+ | Weekly active count |
| D30 retention | > 15% | 30-day return rate |
| Conversion to premium | > 3% | Paying / total users |
| MRR (Monthly Recurring Revenue) | > $100 | Sum of active subscriptions (net) |
| Viral coefficient | > 0.3 | New users from referrals / existing users |
| Average streak length | > 5 days | Median consecutive daily review days |
| Quiz completion rate | > 60% | Users who finish a quiz session |

### Phase 3 KPIs (Scale, Weeks 17-32)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Total registered users | 10,000+ | Users table count |
| WAL | 2,000+ | Weekly active count |
| D30 retention | > 20% | Improving retention |
| Conversion to premium | > 5% | Higher conversion with more features |
| MRR | > $1,000 | Sustainable revenue |
| Language pairs active | 5+ | Users active across multiple pairs |

### Tracking Implementation

For MVP, a lightweight approach:

1. **Users + flashcards tables** already track core metrics
2. **Daily cron job** aggregates into a `daily_metrics` table
3. **Simple admin endpoint** (password-protected) returns dashboard JSON
4. **Weekly founder review** of key metrics

No need for Mixpanel/Amplitude until 5K+ users.

---

## APPENDIX A: Language Pair LLM Prompt Templates

### Translation Prompt Template

```
You are a {source_lang}-{target_lang} language expert. The user will provide a word, phrase, or sentence. They may input text in either {source_lang} or {target_lang}.

Your task:
1. Detect whether the input is in {source_lang} or {target_lang}
2. Provide the {source_lang} text (cleaned/corrected if needed) as source_text
3. Provide the {target_lang} translation as target_text. If the word has multiple meanings, provide all translations.
4. An example sentence in {source_lang} using this word (as example_source), and its {target_lang} translation (as example_target).
   {language_specific_instructions}

IMPORTANT: source_text MUST always be in {source_lang}, and target_text MUST always be in {target_lang}.

Respond with ONLY a raw JSON object:
{"source_text": "...", "target_text": "...", "example_source": "...", "example_target": "..."}

If the input is not a valid word in either language, respond with "Invalid word".
```

**Language-specific instructions:**
- Korean: "Use polite/존댓말 form (e.g. ~요/~습니다 endings) for Korean example sentences."
- Russian: "Use formal register for Russian example sentences."

### Explanation Prompt Template

```
You are a {source_lang} language expert helping a {target_lang} speaker learn {source_lang}.

Explain the word/phrase: "{word}" (meaning: {translation})

Include:
1. **Word structure/etymology** — roots, origin, how the word is formed
2. **Word formation** — prefixes, suffixes, particles, conjugation patterns
3. **Common usage patterns** — formal vs informal, when to use this word
4. **Additional examples** — 2-3 sentences in {source_lang} with {target_lang} translations
5. **Related words** — synonyms, antonyms, words with the same root

Respond in {target_lang}. Use markdown formatting.
```

## APPENDIX B: Telegram Stars Payment Flow (Phase 2)

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
     prices=[LabeledPrice(label="Premium Monthly", amount=250)]  # 250 Stars
   )
4. Backend returns invoice URL to frontend
5. Frontend opens invoice via WebApp.openInvoice(url)
6. User pays in Telegram's native UI
7. Telegram sends pre_checkout_query to bot -> bot answers with ok=True
8. Telegram sends successful_payment to bot
9. Handler updates user tier + creates subscription record
10. Next Mini App API call sees premium tier
```

## APPENDIX C: File Change Map

### Phase 1 — New Files

| File | Description |
|------|-------------|
| `backend/routers/decks.py` | Deck CRUD endpoints |
| `backend/routers/users.py` | User profile + preferences endpoints |
| `frontend/src/pages/SettingsPage.tsx` | Language pair selector, settings |
| `frontend/src/utils/languages.ts` | Language pair code → display names |

### Phase 1 — Modified Files

| File | Changes |
|------|---------|
| `backend/db/connection.py` | New schema (users, decks, explanations, translation_cache, schema_versions), migration logic |
| `backend/db/models.py` | All functions updated for new columns + new deck/user/explanation functions |
| `backend/services/llm.py` | Parameterized prompts, `translate()` replaces `translate_korean()`, `explain_word()` added, default model GPT-4.1-mini |
| `backend/config.py` | Default LLM_PROVIDER → openai, LLM_MODEL → gpt-4.1-mini |
| `backend/routers/cards.py` | New field names, deck_id, language_pair, explanation endpoints |
| `backend/routers/practice.py` | Language pair filter, streak update call |
| `backend/routers/stats.py` | Language pair filter, streak data in response |
| `backend/main.py` | Register decks + users routers |
| `frontend/src/types.ts` | Flashcard/TranslationResult field renames, Deck interface, updated UserStats |
| `frontend/src/api.ts` | New endpoints (decks, user profile, explanation), updated field names |
| `frontend/src/App.tsx` | Settings route |
| `frontend/src/contexts/AppContext.tsx` | activeLanguagePair state, user profile fetch |
| `frontend/src/styles/global.css` | PC scrolling fix (overflow-y: auto) |
| `frontend/src/pages/HomePage.tsx` | Streak display, gear icon, dynamic language labels |
| `frontend/src/pages/AddCardPage.tsx` | Dynamic labels, deck selector, explain button, bidirectional input |
| `frontend/src/pages/PracticePage.tsx` | Reverse practice toggle, dynamic labels, explain button, source/target naming |
| `frontend/src/pages/CardsListPage.tsx` | Deck chip filter, dynamic labels, explain button, field renames |
| `frontend/src/pages/StatsPage.tsx` | Streak section, language pair stats |
| `frontend/src/components/FlashCard.tsx` | `showSide` type change, dynamic labels, field renames |
| `frontend/src/components/NavigationBar.tsx` | Review if any hardcoded labels |
| `.env.example` | Updated defaults |

**Estimated total:** ~4 new files, ~21 modified files

---

*End of Plan*
