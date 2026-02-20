# Tili: Multi-Language Vocabulary Learning Product Plan

**Date:** 2026-02-20
**Status:** FINAL - Consensus Approved (Planner + Architect + Critic)
**Author:** Planner (Prometheus), reviewed by Architect & Critic

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

**Tilibot (Telegram Bot):**
- /add command with AI translation (Korean -> English)
- /practice with SM-2 spaced repetition (easy/medium/hard)
- /list, /delete, /stats commands
- Switchable LLM providers (Anthropic Claude / OpenAI)
- SQLite with WAL mode, 40 tests

**Tiliminiapp (Mini App):**
- Full flashcard CRUD via React + FastAPI
- Practice mode with flip cards and difficulty rating
- Telegram initData HMAC-SHA256 authentication
- Session persistence, haptic feedback, dark/light theme
- Shares database with bot

**What's Missing for MVP Launch:**
- Multi-language support (currently Korean -> English only)
- User tier system (free/premium)
- Payment integration (Telegram Stars)
- Usage tracking and limits
- Onboarding flow

### Phase 1: MVP Launch Features

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| Multi-language pair support | P0 | HIGH | Add language_pair to DB schema; parameterize LLM prompts for source/target language; UI language selector |
| User accounts & tiers table | P0 | MEDIUM | Users table with tier (free/premium), created_at, language preferences |
| Free tier usage limits | P0 | MEDIUM | 30 cards max, 10 translations/day, 1 language pair |
| Telegram Stars payment | P0 | HIGH | Stars subscription via Telegram Payments API; webhook for payment confirmation |
| Onboarding flow | P1 | MEDIUM | Language pair selection on first use; tutorial for adding first card |
| Daily review reminders | P1 | LOW | Scheduled Telegram message when cards are due |
| Basic analytics events | P1 | LOW | Track: cards added, reviews completed, retention rate |

**Target language pairs for MVP:**
1. Korean -> English (exists)
2. Korean -> Russian
3. English -> Russian
4. English -> Korean

### Phase 2: Growth & Retention Features (Month 2-4)

| Feature | Priority | Description |
|---------|----------|-------------|
| Reverse practice mode | P1 | Practice English -> Korean (not just Korean -> English) |
| Streak tracking & badges | P1 | Daily streak counter, milestone badges (10, 50, 100, 500 words) |
| Pre-built word lists | P1 | Curated topical lists: K-pop vocabulary, travel phrases, TOPIK levels |
| Social sharing | P1 | Share streak/progress card to Telegram chats |
| Korean-Kyrgyz pair | P2 | Add Kyrgyz as target language |
| English-Kyrgyz pair | P2 | Add Kyrgyz as target language |
| Audio pronunciation | P2 | TTS for Korean/English words during practice |
| Card tags/categories | P2 | User-defined tags for organizing vocabulary |

### Phase 3: Scale & Differentiation (Month 4-8)

| Feature | Priority | Description |
|---------|----------|-------------|
| Group learning | P2 | Shared word lists for classes/study groups |
| Leaderboards | P2 | Weekly/monthly leaderboards among friends |
| Contextual sentences | P3 | AI-generated sentences at user's level using their vocabulary |
| Grammar hints | P3 | Brief grammar notes attached to example sentences |
| Offline mode | P3 | Cache cards locally for practice without internet |
| Spaced repetition optimization | P3 | FSRS or adaptive algorithm based on user performance data |
| API for third-party content | P3 | Allow educators to create and distribute word lists |

---

## 4. MONETIZATION STRATEGY

### Tier Structure

**Free Tier (forever free):**
- 30 flashcards maximum
- 10 AI translations per day
- 1 active language pair (can create new cards in 1 pair only, but may review all existing cards regardless of pair)
- Basic SRS practice
- Basic stats

**Premium Tier ($3.49/month = ~250 Stars):**
- Unlimited flashcards
- Unlimited AI translations
- All language pairs
- Reverse practice mode
- Streak tracking & badges
- Pre-built word lists
- Priority support

**Premium Annual ($29.99/year = ~2,100 Stars):**
- Everything in Premium
- ~28% discount vs monthly
- Early access to new features

**Lifetime ($69.99 = ~5,000 Stars):**
- Everything in Premium, forever
- Introduced after product-market fit is validated (Phase 2)

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

**Optimistic scenario (5% conversion -- if product-market fit is strong):**

| Metric | 1K Users | 5K Users | 10K Users | 50K Users | 100K Users |
|--------|----------|----------|-----------|-----------|------------|
| Free users (95%) | 950 | 4,750 | 9,500 | 47,500 | 95,000 |
| Premium monthly (3%) | 30 | 150 | 300 | 1,500 | 3,000 |
| Premium annual (2%) | 20 | 100 | 200 | 1,000 | 2,000 |
| Monthly revenue (net) | $113 | $567 | $1,134 | $5,670 | $11,340 |
| Annual revenue (net) | $1,356 | $6,804 | $13,608 | $68,040 | $136,080 |

*Net revenue = after Telegram's ~35% cut on Stars*

---

## 5. GROWTH STRATEGY

### Phase 1: First 1,000 Users (Month 1-2)

**Launch channels (all organic, $0 budget):**

1. **K-pop fan communities on Telegram** (highest ROI)
   - Join 20-30 K-pop fan groups in Russian-speaking Telegram (BTS, Blackpink, Stray Kids fan groups)
   - Share the bot with a message like: "Made a free tool to learn Korean words from your favorite songs"
   - Create a "K-pop Vocabulary" pre-built word list as a hook
   - Target: 200-500 users from this channel alone

2. **Korean language learning Telegram groups**
   - Post in Korean study groups for Russian speakers
   - Offer the bot as a complementary tool to their existing study
   - Target: 100-200 users

3. **Reddit/X communities**
   - r/Korean, r/languagelearning, r/kpop
   - Product Hunt launch
   - Target: 100-200 users

4. **Personal network & founder-led content**
   - Founder's personal Telegram, social media
   - "Building in public" posts about the product
   - Target: 50-100 users

### Phase 2: 1,000 to 10,000 Users (Month 2-6)

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

### Phase 3: 10,000+ Users (Month 6-12)

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

### Current Architecture Assessment

**Strengths:**
- Clean async Python codebase (both bot and backend)
- Factory pattern for LLM providers (easy to add new models)
- Proper Telegram initData auth (HMAC-SHA256)
- SQLite with WAL mode (good for single-server)
- Well-separated concerns: handlers -> services -> db
- 40 tests on bot side

**Weaknesses/Gaps:**
- Hardcoded Korean-English language pair throughout (SYSTEM_PROMPT, column names `korean`/`english`)
- No user management table (user_id exists in flashcards but no users table)
- No payment/subscription infrastructure
- No usage tracking or rate limiting
- Two separate codebases share a DB but duplicate code (models, llm, srs)
- No tests for mini app backend
- SQLite won't scale beyond ~50K concurrent users on a single server
- Column names (`korean`, `english`) are language-specific, not generic

### CRITICAL: SRS Algorithm Divergence (Architect Finding)

The bot and mini-app have **divergent SRS implementations** that produce different scheduling on the shared database:

| Scenario | Tilibot (bot/services/srs.py) | Tiliminiapp (backend/services/srs.py) |
|----------|-------------------------------|---------------------------------------|
| New card rated "Medium" | 1-day interval | 0-day interval (5 hours) |
| Card rated "Hard" | Reset to 1-day interval | Reset to 0-day (10-minute review) |

**Decision:** The tiliminiapp version is pedagogically superior (sub-day intervals for initial learning and failed cards is standard SRS behavior) and becomes **canonical in tili-core**. This is a behavior change for bot users -- cards rated "Hard" will now come back in 10 minutes instead of 1 day, which is more aligned with how Anki works.

### CRITICAL: Concurrent SQLite Writer Coordination (Architect Finding)

Both the bot (polling) and mini-app (FastAPI) open independent `aiosqlite.Connection` instances to the same database file. Currently low-risk for flashcard writes, but payment-critical writes (subscription activation after Stars payment) cannot fail silently.

**Mitigations:**
1. `busy_timeout=5000` PRAGMA (already configured) provides basic retry on lock
2. Add `BEGIN IMMEDIATE` transaction around payment writes to fail fast
3. Add explicit retry logic (3 attempts with backoff) around subscription activation
4. Long-term: consider webhook mode or unified backend process

### Required Changes for Multi-Language Support

**Database Schema Changes:**

```sql
-- New: Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,              -- Telegram user ID
    telegram_username TEXT,
    first_name TEXT,
    last_name TEXT,
    tier TEXT DEFAULT 'free',            -- 'free', 'premium'
    tier_expires_at TIMESTAMP,
    active_language_pair TEXT DEFAULT 'ko-en',
    daily_translations_used INTEGER DEFAULT 0,
    daily_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New: Subscriptions table
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    telegram_payment_charge_id TEXT,
    plan TEXT NOT NULL,                   -- 'monthly', 'annual', 'lifetime'
    stars_amount INTEGER,
    status TEXT DEFAULT 'active',         -- 'active', 'cancelled', 'expired'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Modified: Flashcards table (rename columns to be language-agnostic)
CREATE TABLE flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    language_pair TEXT NOT NULL DEFAULT 'ko-en',  -- e.g., 'ko-en', 'ko-ru', 'en-ru'
    source_text TEXT NOT NULL,            -- was 'korean'
    target_text TEXT NOT NULL,            -- was 'english'
    example_source TEXT,                  -- was 'example_kr'
    example_target TEXT,                  -- was 'example_en'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0
);

-- New: Usage tracking
CREATE TABLE usage_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    event_type TEXT NOT NULL,             -- 'translation', 'review', 'card_created'
    language_pair TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flashcards_user_lang ON flashcards(user_id, language_pair, next_review);
CREATE INDEX idx_usage_user_date ON usage_events(user_id, created_at);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, status);
```

**LLM Service Changes:**

The current `SYSTEM_PROMPT` is hardcoded for Korean -> English. It needs to be parameterized:

```
Current (hardcoded):
  "You are a Korean language expert. Given a Korean word..."

Target (parameterized):
  translate(word, source_lang="korean", target_lang="russian")
  -> dynamically builds prompt with correct language names and instructions
```

The `LLMProvider` abstract class needs a new method signature:
```python
async def translate(self, word: str, source_lang: str, target_lang: str) -> TranslationResult
```

The `TranslationResult` model needs renaming:
```python
class TranslationResult(BaseModel):
    source_text: str      # was: korean
    target_text: str      # was: english
    example_source: str   # was: example_kr
    example_target: str   # was: example_en
```

**Language Pair Configuration:**

```python
SUPPORTED_PAIRS = {
    "ko-en": {"source": "Korean", "target": "English", "source_script": "hangul"},
    "ko-ru": {"source": "Korean", "target": "Russian", "source_script": "hangul"},
    "en-ru": {"source": "English", "target": "Russian", "source_script": "latin"},
    "en-ko": {"source": "English", "target": "Korean", "source_script": "latin"},
    "ko-ky": {"source": "Korean", "target": "Kyrgyz", "source_script": "hangul"},
    "en-ky": {"source": "English", "target": "Kyrgyz", "source_script": "latin"},
}
```

### Required Changes for Monetization

**Telegram Stars Payment Integration:**

Telegram Bot API supports `createInvoiceLink` and `sendInvoice` for Stars payments. The flow:

1. User taps "Upgrade to Premium" in Mini App
2. Frontend calls backend `/api/subscribe` endpoint
3. Backend creates a Telegram Stars invoice via Bot API
4. User pays in Telegram's native payment UI
5. Telegram sends `pre_checkout_query` to bot webhook -> bot approves
6. Telegram sends `successful_payment` update -> bot activates subscription
7. Backend updates user tier and subscription table

**Middleware for tier enforcement:**

```python
# FastAPI dependency
async def check_tier_limits(user_id: int, action: str, db) -> None:
    user = await get_user(db, user_id)
    if user["tier"] == "free":
        # Lazy daily reset (Architect finding: no reset mechanism was specified)
        if user["daily_reset_at"] < start_of_today_utc():
            await reset_daily_translations(db, user_id)
            user["daily_translations_used"] = 0
        if action == "translate" and user["daily_translations_used"] >= 10:
            raise HTTPException(402, "Daily translation limit reached. Upgrade to Premium.")
        if action == "create_card":
            card_count = await get_card_count(db, user_id)
            if card_count >= 30:
                raise HTTPException(402, "Card limit reached. Upgrade to Premium.")
```

### Code Deduplication

Currently `tilibot` and `tiliminiapp` duplicate: models.py, llm.py, srs.py, config.py, connection.py.

**Recommended approach:** Extract shared code into a `tili-core` package (local Python package):

```
tili/
  tili-core/           # Shared library
    tili_core/
      db/
        connection.py
        models.py
      services/
        llm.py
        srs.py
      config.py
    pyproject.toml
  tilibot/             # Depends on tili-core
    bot/
      handlers/
      main.py
  tiliminiapp/         # Depends on tili-core
    backend/
      routers/
      auth.py
      main.py
    frontend/
```

Both `tilibot` and `tiliminiapp` install `tili-core` as a local dependency (`pip install -e ../tili-core`).

**Default LLM model:** tili-core config should default to `gpt-4o-mini` (currently tilibot defaults to Claude Sonnet at ~100x the cost, tiliminiapp defaults to Claude Haiku). GPT-4o-mini at $0.15/1M input tokens is sufficient for vocabulary translation.

### Migration Strategy (Architect Review Addition)

SQLite column renames require a CREATE-COPY-DROP-RENAME approach for maximum portability:

```sql
-- 1. Create users table first
CREATE TABLE users (...);

-- 2. Backfill users from existing flashcard data
INSERT INTO users (id) SELECT DISTINCT user_id FROM flashcards;

-- 3. Create new flashcards table with generic column names
CREATE TABLE flashcards_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    language_pair TEXT NOT NULL DEFAULT 'ko-en',
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    example_source TEXT,
    example_target TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0
);

-- 4. Copy data with column mapping
INSERT INTO flashcards_new
    SELECT id, user_id, 'ko-en', korean, english, example_kr, example_en,
           created_at, next_review, ease_factor, interval_days, repetitions
    FROM flashcards;

-- 5. Drop old table and rename
DROP TABLE flashcards;
ALTER TABLE flashcards_new RENAME TO flashcards;

-- 6. Recreate indexes
CREATE INDEX idx_flashcards_user_lang ON flashcards(user_id, language_pair, next_review);
CREATE UNIQUE INDEX idx_user_source ON flashcards(user_id, language_pair, source_text);

-- 7. Enable foreign keys
PRAGMA foreign_keys=ON;
```

**All steps must run in a single transaction. Backup the database before running.**

### Scaling Considerations

| Users | Database | Hosting | Notes |
|-------|----------|---------|-------|
| 0-10K | SQLite (current) | Single VPS ($10-20/mo) | Totally fine with WAL mode |
| 10K-50K | SQLite still viable | Larger VPS ($20-40/mo) | Monitor write contention |
| 50K-100K | Migrate to PostgreSQL | VPS + managed DB ($40-80/mo) | Only if write contention appears |
| 100K+ | PostgreSQL + read replicas | Cloud ($100-200/mo) | Unlikely in Year 1 |

**Key insight:** SQLite with WAL mode can handle far more than people think. For a flashcard app where writes are infrequent (a few per user per day), SQLite on a single server can realistically handle 50K+ users. Don't over-engineer until you need to.

### LLM Cost Optimization

1. **Model selection:** Use GPT-4o-mini or Gemini 2.0 Flash (~$0.001 per 1K tokens) instead of Claude Sonnet for translations. Quality is sufficient for vocabulary translation.
2. **Translation caching:** Cache common word translations in DB. If user B translates the same word as user A in the same language pair, serve from cache.
3. **Batch translations:** For pre-built word lists, translate once and store.

```sql
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
```

This could reduce LLM costs by 30-50% as vocabulary follows a power law (common words are translated by many users).

---

## 7. COST & EXPENSE PROJECTIONS

### Monthly Cost Model

| Cost Item | 100 Users | 1K Users | 10K Users | 100K Users |
|-----------|-----------|----------|-----------|------------|
| **Hosting (VPS)** | $10 | $10 | $20 | $80 |
| **LLM API (translations)** | $1 | $8 | $50 | $300 |
| **Domain + SSL** | $1 | $1 | $1 | $1 |
| **Monitoring (free tier)** | $0 | $0 | $0 | $20 |
| **Database (if PostgreSQL)** | $0 | $0 | $0 | $40 |
| **Total monthly** | **$12** | **$19** | **$71** | **$441** |

**LLM cost assumptions:**
- Average active user: 3 translations/day, 20 active days/month = 60 translations/month
- With caching (30% hit rate): ~42 LLM calls/user/month
- GPT-4o-mini cost: ~$0.00015 per translation (150 input tokens + 200 output tokens)
- Cost per active user/month: ~$0.006
- Assuming 30% of total users are active in a given month

### Revenue vs Cost Analysis

| Scale | Revenue (conservative) | Revenue (optimistic) | Monthly Cost | Profit (conservative) |
|-------|----------------------|---------------------|--------------|----------------------|
| 100 users | $0 (pre-monetization) | $0 | $12 | -$12 |
| 1K users | $57 | $113 | $19 | $38 |
| 5K users | $284 | $567 | $40 | $244 |
| 10K users | $567 | $1,134 | $71 | $496 |
| 50K users | $2,835 | $5,670 | $250 | $2,585 |
| 100K users | $5,670 | $11,340 | $441 | $5,229 |

### Break-Even Analysis

**Fixed costs (founder time excluded):** ~$12/month minimum
**Variable cost per user:** ~$0.002/month (hosting + LLM, amortized)
**Revenue per paying user (net):** ~$2.27/month
**Conversion rate assumed (conservative):** 2.5%
**Revenue per user (blended):** $0.057/month

**Break-even point:** ~210 users (where blended revenue covers hosting)

**To reach $1,000/month net profit (conservative):** ~18,000 users
**To reach $1,000/month net profit (optimistic, 5%):** ~9,000 users
**To reach $5,000/month net profit:** ~90,000 users (conservative) / ~45,000 users (optimistic)

The unit economics are extremely favorable because:
- LLM costs are negligible (~$0.006/active user/month)
- Hosting scales slowly (SQLite, single server)
- Telegram handles payments (no Stripe fees on top)
- No mobile app development cost (Mini App)
- Distribution cost is near zero (Telegram organic)

---

## 8. IMPLEMENTATION PLAN

### Phase 1: MVP Launch (Weeks 1-6)

**Week 1-2: Core Infrastructure**

| Task | Description | Acceptance Criteria |
|------|-------------|-------------------|
| Extract shared `tili-core` package | Create shared library for db, llm, srs, config. Note: tiliminiapp has `update_flashcard()` that bot lacks; tili-core models should be the union of both. SRS: use tiliminiapp version (sub-day intervals) as canonical. Use `datetime.now(datetime.UTC)` instead of deprecated `datetime.utcnow()`. | Both tilibot and tiliminiapp import from tili-core; all 40 existing tests pass (migrate tests first to de-risk extraction) |
| Database migration: rename columns | `korean` -> `source_text`, `english` -> `target_text` via CREATE-COPY-DROP-RENAME approach (see Migration Strategy below) | Migration script runs idempotently; existing data preserved; backup created before migration |
| Add `users` table + backfill | Schema per Section 6; backfill with `INSERT INTO users (id) SELECT DISTINCT user_id FROM flashcards` BEFORE adding foreign keys; enable `PRAGMA foreign_keys=ON` | User record exists for all existing flashcard owners; auto-create on first new interaction |
| Add `subscriptions` table | Schema per Section 6 | Table exists with proper indexes |
| Add `language_pair` to flashcards | Column with default `ko-en`; existing cards get `ko-en` | All existing cards tagged; new cards require language_pair |

**Week 2-3: Multi-Language Support**

| Task | Description | Acceptance Criteria |
|------|-------------|-------------------|
| Parameterize LLM prompts | `translate(word, source_lang, target_lang)` | Works for ko-en, ko-ru, en-ru, en-ko with correct prompts |
| Language pair selector (Mini App) | UI to choose/switch language pair in settings | User can select from supported pairs; persisted to user record |
| Language pair selector (Bot) | `/language` command + inline keyboard | User can switch pairs; subsequent /add uses selected pair |
| Update all queries for language_pair | Filter flashcards by active language pair. **Important:** `check_duplicate()` must scope by `language_pair` -- same word can exist in different pairs (e.g., "hello" in en-ko and en-ru). Update `idx_user_korean` index to `idx_user_source` on `(user_id, language_pair, source_text)`. | Practice only shows cards from active pair; stats per pair; duplicates checked per-pair |

**Week 3-4: Monetization**

| Task | Description | Acceptance Criteria |
|------|-------------|-------------------|
| Free tier limits | Enforce 30 card cap, 10 translations/day, 1 pair for free users | Proper HTTP 402 errors with upgrade prompts |
| Telegram Stars invoice creation | Bot API integration for Stars payments | Invoice generated; test payment flow works |
| Payment webhook handling | Handle pre_checkout_query + successful_payment | Subscription activated; user tier updated in DB |
| Premium upgrade UI (Mini App) | Pricing page with subscribe button | Stars payment triggered from Mini App via bot deep link |
| Subscription status check | Middleware that validates active subscription | Premium features accessible; expired subscriptions downgrade |

**Week 4-5: Onboarding & Polish**

| Task | Description | Acceptance Criteria |
|------|-------------|-------------------|
| Onboarding flow (Mini App) | First-launch: choose language pair, add first word, do first review | New user completes onboarding in < 2 minutes |
| Onboarding flow (Bot) | /start redesign with language selection | New user guided to add first card within 3 messages |
| Daily review reminders | Scheduled message when cards due | User gets 1 notification/day max; respects timezone |
| Translation cache | Cache table + lookup before LLM call | Duplicate translations served from cache; 0 LLM cost |

**Week 5-6: Testing & Launch**

| Task | Description | Acceptance Criteria |
|------|-------------|-------------------|
| Backend test suite (Mini App) | Tests for all routers, auth, tier limits | 80%+ coverage on backend |
| Integration tests for payment flow | End-to-end Stars payment test | Payment -> subscription -> feature access verified |
| Migration script for existing data | Migrate current flashcards to new schema | All existing cards preserved with correct language_pair |
| Soft launch to beta testers | 20-50 users from Korean learning communities | Collect feedback; fix critical bugs |
| Public launch | Post in target communities per growth strategy | Bot accessible; Mini App listed |

### Phase 2: Growth & Retention (Weeks 7-16)

| Task | Timeline | Description |
|------|----------|-------------|
| Streak tracking & daily goals | Week 7-8 | Track daily review streaks; display in stats |
| Badges/achievements | Week 8-9 | Milestone badges (10, 50, 100, 500 words learned) |
| Social sharing cards | Week 9-10 | Generate shareable images of streaks/achievements |
| Referral program | Week 10-11 | Invite link tracking; 1 week free premium per 3 referrals |
| Pre-built word lists | Week 11-13 | 5-10 curated lists: K-pop vocab, travel, TOPIK 1, etc. |
| Reverse practice mode | Week 13-14 | Show target language, recall source language |
| Korean-Kyrgyz + English-Kyrgyz | Week 14-16 | New language pairs with validated LLM quality |
| @tili_words Telegram channel | Week 7+ | Daily word posts; growth channel |

### Phase 3: Scale & Differentiation (Weeks 17-32)

| Task | Timeline | Description |
|------|----------|-------------|
| Audio pronunciation (TTS) | Week 17-20 | Google Cloud TTS or browser Web Speech API |
| Group learning / shared lists | Week 20-24 | Teachers create lists; students subscribe |
| Leaderboards | Week 22-24 | Weekly/monthly ranking among contacts |
| Advanced analytics dashboard | Week 24-28 | Retention curves, forgetting curves, optimal review times |
| PostgreSQL migration (if needed) | Week 28-32 | Only if SQLite shows contention at scale |
| Additional language pairs | Ongoing | Uzbek, Kazakh based on demand |

### Key Milestones

| Milestone | Target Date | Success Metric |
|-----------|-------------|----------------|
| MVP feature-complete | Week 4 | All P0 features working |
| Beta launch (50 users) | Week 5 | 50 active testers |
| Public launch | Week 6 | Bot + Mini App publicly accessible |
| 500 users | Week 10 | Organic growth from launch channels |
| 1,000 users | Week 14 | Viral + community growth |
| First paying customer | Week 7 | Stars payment processed |
| 50 paying users | Week 16 | $100+/month net revenue |
| $1,000/month MRR | Month 6-8 | Sustainable product |

---

## 9. RISK ANALYSIS

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM quality for Kyrgyz translations | HIGH | MEDIUM | Validate with native speakers before launch; fall back to English as intermediary |
| Telegram API changes / Stars policy changes | LOW | HIGH | Abstract payment layer; keep alternative monetization path (direct payment) |
| Database migration breaks existing data | MEDIUM | HIGH | Write idempotent migration; backup before running; test on copy of production DB |
| Bot/Mini App state desync (shared DB) | MEDIUM | MEDIUM | tili-core shared library ensures consistent DB access patterns |
| SQLite write contention at scale | LOW | MEDIUM | WAL mode handles most cases; monitor and migrate to PostgreSQL only if needed |
| Payment webhook latency (polling mode) | MEDIUM | HIGH | Bot uses `run_polling()` -- Telegram gives only 10s to answer `pre_checkout_query`. Polling interval may cause timeout. **Mitigation:** Switch to webhook mode before payment launch, or verify polling picks up payment updates fast enough. `allowed_updates=ALL_TYPES` is already set. |
| SRS algorithm divergence (existing bug) | CONFIRMED | MEDIUM | Bot and mini-app produce different scheduling for same card. Fixed by tili-core extraction using tiliminiapp version as canonical. |

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Korean learning trend fades in CIS | LOW | HIGH | Multi-language design allows pivot to English learning (much larger market) |
| Duolingo adds Korean-Russian | MEDIUM | MEDIUM | Tili's SRS depth + Telegram distribution are defensible; Duolingo won't match niche focus |
| Telegram Mini App discoverability is poor | MEDIUM | MEDIUM | Rely on community/viral growth, not store placement |
| Low willingness to pay in target market | MEDIUM | HIGH | Price at $3.49/mo (lowest viable); add lifetime tier; consider ad-supported free tier |
| Slow organic growth | HIGH | MEDIUM | Prepare content marketing playbook; budget for small Telegram Ads spend |

### Financial Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM API costs spike | LOW | LOW | Caching reduces calls 30-50%; can switch to cheapest provider; costs are tiny regardless |
| Revenue insufficient for founder | HIGH (Year 1) | HIGH | Treat as side project until $2K+/month; keep day job; costs are < $20/month at small scale |
| Telegram takes larger cut of Stars | LOW | MEDIUM | Current ~35% cut is favorable; even at 50% cut, unit economics work |

### Mitigation Summary

1. **Validate Kyrgyz LLM quality early** -- test 100 common words with native speakers before promising the language pair
2. **Keep costs near zero** -- SQLite, single VPS, cheapest LLM model. No reason to spend more until 10K+ users
3. **Design for multi-language from day 1** -- don't hardcode any language. This is the core insurance against market risk
4. **Build viral loops into the product** -- sharing streaks, challenging friends, referral program. Organic distribution is the moat

---

## 10. SUCCESS METRICS & KPIs

### North Star Metric

**Weekly Active Learners (WAL):** Users who completed at least 1 review session in the past 7 days.

This captures both acquisition and retention in a single metric. A growing WAL means users are finding value and returning.

### Phase 1 KPIs (Launch, Weeks 1-6)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Total registered users | 100+ | Users table count |
| WAL (Weekly Active Learners) | 30+ | Users with >= 1 review in past 7 days |
| D1 retention | > 40% | Users who return day after first use |
| D7 retention | > 20% | Users who return 7 days after first use |
| Cards created per active user | > 5 | Avg cards added in first week |
| Translations per day (system) | Track | Monitor LLM costs |
| Crash/error rate | < 1% | Error logs |

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
| NPS (Net Promoter Score) | > 40 | In-app survey |

### Phase 3 KPIs (Scale, Weeks 17-32)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Total registered users | 10,000+ | Users table count |
| WAL | 2,000+ | Weekly active count |
| D30 retention | > 20% | Improving retention |
| Conversion to premium | > 5% | Higher conversion with more features |
| MRR | > $1,000 | Sustainable revenue |
| LTV per user | > $2 | Total revenue / total users |
| CAC (if doing paid) | < $0.50 | Ad spend / new users from ads |
| LTV:CAC ratio | > 4:1 | Healthy growth economics |
| Language pairs active | 5+ | Users active across multiple pairs |

### Tracking Implementation

For MVP, a lightweight approach:

1. **Usage events table** (already in schema) tracks all user actions
2. **Daily cron job** aggregates into a `daily_metrics` table
3. **Simple admin endpoint** (password-protected) returns dashboard JSON
4. **Weekly founder review** of key metrics

No need for Mixpanel/Amplitude until 5K+ users. The usage_events table gives you everything.

---

## APPENDIX A: Language Pair LLM Prompt Templates

### Korean -> Russian Example

```
You are a Korean-Russian language expert. Given a Korean word, phrase, or sentence, provide:
1. The Korean text (cleaned/corrected if needed)
2. Russian translation. If the word has multiple meanings, provide the Russian translation for each meaning.
3. An example sentence in Korean using this word, and its Russian translation.
   Use polite/존댓말 form for Korean example sentences.

Respond with ONLY a raw JSON object:
{"source_text": "...", "target_text": "...", "example_source": "...", "example_target": "..."}
```

### English -> Kyrgyz Example

```
You are an English-Kyrgyz language expert. Given an English word, phrase, or sentence, provide:
1. The English text (cleaned/corrected if needed)
2. Kyrgyz translation. If the word has multiple meanings, provide the Kyrgyz translation for each meaning.
3. An example sentence in English using this word, and its Kyrgyz translation.

Respond with ONLY a raw JSON object:
{"source_text": "...", "target_text": "...", "example_source": "...", "example_target": "..."}
```

## APPENDIX B: Telegram Stars Payment Flow (Technical Detail)

```
User Journey:
1. User taps "Upgrade" in Mini App
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
9. Bot handler updates user tier + creates subscription record
10. Next Mini App API call sees premium tier
```

## APPENDIX C: File Change Map

Files that need modification (estimated):

**New files:**
- `tili-core/tili_core/db/connection.py` (extracted)
- `tili-core/tili_core/db/models.py` (extracted + refactored)
- `tili-core/tili_core/services/llm.py` (extracted + parameterized)
- `tili-core/tili_core/services/srs.py` (extracted)
- `tili-core/tili_core/config.py` (extracted)
- `tili-core/tili_core/languages.py` (new: language pair config)
- `tiliminiapp/backend/routers/subscribe.py` (new: payment endpoints)
- `tiliminiapp/frontend/src/pages/SettingsPage.tsx` (new: language selector, subscription)
- `tiliminiapp/frontend/src/pages/OnboardingPage.tsx` (new)
- `tilibot/bot/handlers/language.py` (new: /language command)
- `tilibot/bot/handlers/subscribe.py` (new: payment handler)

**Modified files:**
- `tilibot/bot/db/models.py` -> import from tili-core
- `tilibot/bot/services/llm.py` -> import from tili-core
- `tilibot/bot/services/srs.py` -> import from tili-core
- `tilibot/bot/handlers/add.py` -> use language_pair
- `tilibot/bot/handlers/practice.py` -> use language_pair
- `tilibot/bot/main.py` -> register new handlers
- `tiliminiapp/backend/routers/cards.py` -> use language_pair, tier limits
- `tiliminiapp/backend/routers/practice.py` -> use language_pair
- `tiliminiapp/backend/main.py` -> register subscribe router
- `tiliminiapp/frontend/src/types.ts` -> updated interfaces
- `tiliminiapp/frontend/src/api.ts` -> new endpoints
- `tiliminiapp/frontend/src/App.tsx` -> new routes
- `tiliminiapp/frontend/src/pages/AddCardPage.tsx` -> language pair aware
- `tiliminiapp/frontend/src/pages/PracticePage.tsx` -> language pair aware
- `tiliminiapp/frontend/src/contexts/AppContext.tsx` -> language pair + tier state

**Additional frontend files with hardcoded Korean/English (Architect finding):**
- `tiliminiapp/frontend/src/components/FlashCard.tsx` -> `showSide` type `'korean' | 'english'` must become generic; labels "Korean"/"English" hardcoded
- `tiliminiapp/frontend/src/pages/HomePage.tsx` -> "Ready to learn Korean?" text
- `tiliminiapp/frontend/src/components/DifficultyButtons.tsx` -> review if language-specific

**Estimated total:** ~15 new files, ~18 modified files (frontend effort is larger than initially scoped -- at least 7 existing frontend files need field name changes and dynamic label rendering, adding ~2-3 days to Week 2-3)

---

*End of Plan*
