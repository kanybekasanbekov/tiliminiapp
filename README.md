# Tili - AI-Powered Korean Flashcard Mini App

A Telegram Mini App for learning Korean vocabulary using AI-powered translations and the SM-2 spaced repetition algorithm (same as Anki).

## Features

- **AI Translation** — Enter a Korean word and get an instant AI-powered translation with example sentences
- **Spaced Repetition (SM-2)** — Cards are scheduled using the same algorithm as Anki, with Easy/Medium/Hard difficulty ratings
- **Practice Mode** — Quiz yourself with flashcards showing either Korean or English side randomly
- **Card Management** — Browse, edit, and delete your flashcards with pagination
- **Progress Tracking** — View your learning statistics with interval distribution charts
- **Native Telegram UI** — Built with @telegram-apps/telegram-ui for a seamless, native-feeling experience
- **Secure Authentication** — Uses Telegram's initData HMAC-SHA256 validation (no passwords needed)

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite 6 | Build tool with HMR |
| @twa-dev/sdk | Telegram WebApp API integration |
| @telegram-apps/telegram-ui | Native Telegram UI components |
| react-router-dom | Hash-based routing |

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.11+ | Runtime |
| FastAPI | Async web framework |
| SQLite (aiosqlite) | Database with WAL mode |
| Anthropic/OpenAI SDKs | AI translation (dual provider support) |
| Pydantic v2 | Data validation |

## Architecture

```
┌─────────────────────────────────────────────┐
│            Telegram Client                  │
│         (iOS / Android / Desktop)           │
└──────────────┬──────────────────────────────┘
               │ WebView
┌──────────────▼──────────────────────────────┐
│          Frontend (React + Vite)            │
│  ┌──────────────────────────────────────┐   │
│  │  Pages: Home, Add, Practice,         │   │
│  │         CardsList, Stats             │   │
│  ├──────────────────────────────────────┤   │
│  │  Components: FlashCard, Navigation,  │   │
│  │  DifficultyButtons, EmptyState       │   │
│  ├──────────────────────────────────────┤   │
│  │  API Client (fetch + tma auth)       │   │
│  └──────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┘
               │ REST API (Authorization: tma <initData>)
┌──────────────▼──────────────────────────────┐
│          Backend (FastAPI)                   │
│  ┌──────────────────────────────────────┐   │
│  │  Auth: initData HMAC-SHA256          │   │
│  ├──────────────────────────────────────┤   │
│  │  Routers: /api/cards, /api/practice, │   │
│  │           /api/stats                 │   │
│  ├──────────────────────────────────────┤   │
│  │  Services: LLM (Claude/GPT), SRS    │   │
│  ├──────────────────────────────────────┤   │
│  │  Database: SQLite + aiosqlite        │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Prerequisites

- **Anaconda/Miniconda** — [anaconda.com](https://www.anaconda.com/download) (Python 3.12 environment will be created)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Telegram Bot Token** — From [@BotFather](https://t.me/BotFather)
- **LLM API Key** — Either [Anthropic](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/)
- **ngrok** (for testing) — [ngrok.com](https://ngrok.com/download)

## Quick Start

### 1. Clone and configure

```bash
cd tiliminiapp
cp .env.example .env
```

Edit `.env` with your actual values:
```env
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key
LLM_MODEL=claude-haiku-4-5-20251001
DATABASE_PATH=flashcards.db
FRONTEND_URL=http://localhost:5173
```

### 2. Set up the backend

```bash
# Create conda environment with Python 3.12
conda create -n tiliminiapp python=3.12 -y
conda activate tiliminiapp

# Install dependencies
pip install -r backend/requirements.txt

# Start the backend server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the interactive API documentation.

### 3. Set up the frontend

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`. The Vite dev server automatically proxies `/api` requests to the backend at `http://localhost:8000`.

### 4. Set up Telegram Bot and Mini App

1. **Create a bot** — Open [@BotFather](https://t.me/BotFather) in Telegram and send `/newbot`. Follow the prompts to create a bot and get the token.

2. **Start ngrok** — In a new terminal:
   ```bash
   ngrok http 5173
   ```
   Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

3. **Configure Mini App URL** — Send `/myapps` to @BotFather:
   - Select your bot
   - Click "Edit Web App URL"
   - Paste your ngrok HTTPS URL

4. **Set Menu Button** — Send `/setmenubutton` to @BotFather:
   - Select your bot
   - Enter a button title (e.g., "Open Tili")
   - Enter the same ngrok URL

5. **Update CORS** — Add the ngrok URL to your `.env`:
   ```env
   FRONTEND_URL=https://abc123.ngrok-free.app
   ```
   Restart the backend.

6. **Test** — Open your bot in Telegram and tap the menu button to launch the Mini App!

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | **Yes** | — | Bot token from @BotFather |
| `LLM_PROVIDER` | No | `anthropic` | AI provider: `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` | If using Anthropic | — | Anthropic API key |
| `OPENAI_API_KEY` | If using OpenAI | — | OpenAI API key |
| `LLM_MODEL` | No | `claude-haiku-4-5-20251001` | Model name for selected provider |
| `DATABASE_PATH` | No | `flashcards.db` | Path to SQLite database file |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL for CORS |
| `LOG_LEVEL` | No | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |

## Project Structure

```
tiliminiapp/
├── README.md                          # This file
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
│
├── backend/                           # Python FastAPI backend
│   ├── requirements.txt               # Python dependencies
│   ├── main.py                        # FastAPI app, CORS, lifespan
│   ├── config.py                      # Environment config
│   ├── auth.py                        # Telegram initData validation
│   ├── db/
│   │   ├── connection.py              # SQLite init with WAL mode
│   │   └── models.py                  # Database CRUD operations
│   ├── services/
│   │   ├── srs.py                     # SM-2 spaced repetition algorithm
│   │   └── llm.py                     # AI translation (Anthropic/OpenAI)
│   └── routers/
│       ├── cards.py                   # Card CRUD + AI translation endpoints
│       ├── practice.py                # Practice session + SRS review endpoints
│       └── stats.py                   # Learning statistics endpoint
│
└── frontend/                          # React + TypeScript frontend
    ├── package.json                   # NPM dependencies
    ├── vite.config.ts                 # Vite configuration
    ├── tsconfig.json                  # TypeScript configuration
    ├── index.html                     # Entry HTML with Telegram SDK script
    └── src/
        ├── main.tsx                   # React entry, Telegram SDK init
        ├── App.tsx                    # Root component, hash routing
        ├── types.ts                   # TypeScript interfaces
        ├── api.ts                     # API client with tma auth
        ├── contexts/
        │   └── AppContext.tsx          # Global state (user, theme, dueCount)
        ├── pages/
        │   ├── HomePage.tsx           # Dashboard with due count & quick actions
        │   ├── AddCardPage.tsx        # Korean word input + AI translation
        │   ├── PracticePage.tsx       # Flashcard quiz with SRS rating
        │   ├── CardsListPage.tsx      # Paginated card list + delete
        │   └── StatsPage.tsx          # Statistics + distribution chart
        ├── components/
        │   ├── NavigationBar.tsx      # Bottom tab navigation
        │   ├── FlashCard.tsx          # Flashcard display component
        │   ├── DifficultyButtons.tsx  # Easy/Medium/Hard rating buttons
        │   ├── LoadingSpinner.tsx     # Loading indicator
        │   └── EmptyState.tsx         # Empty state with icon + action
        └── styles/
            └── global.css             # Global styles, Telegram theme vars
```

## API Endpoints

### Cards
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/cards/translate` | Translate Korean word via AI |
| `POST` | `/api/cards` | Save a new flashcard |
| `GET` | `/api/cards?page=1&per_page=10` | List cards (paginated) |
| `GET` | `/api/cards/:id` | Get single card |
| `PUT` | `/api/cards/:id` | Update card fields |
| `DELETE` | `/api/cards/:id` | Delete a card |

### Practice
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/practice/due?limit=20` | Get cards due for review |
| `POST` | `/api/practice/review` | Submit difficulty rating |

### Stats
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/stats` | Get learning statistics |

### Health
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |

All endpoints (except `/api/health`) require the header: `Authorization: tma <initData>`

## SM-2 Spaced Repetition Algorithm

This app uses the same spaced repetition algorithm as Anki (SM-2):

| Rating | Quality | Effect |
|--------|---------|--------|
| Easy | 5 | Increases interval significantly, ease factor goes up |
| Medium | 3 | Normal progression, ease factor stays stable |
| Hard | 1 | Resets interval to 1 day, ease factor decreases |

**Interval progression** (all Easy): 1 day → 6 days → 16 days → 45 days → 131 days...

## Production Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the `dist/` folder to Vercel, Netlify, or any static hosting with HTTPS.

3. Set `VITE_API_URL` environment variable to your backend URL.

### Backend (VPS/Railway/Render)

1. Deploy the backend to any platform that supports Python (Railway, Render, DigitalOcean, etc.)

2. Set all environment variables from `.env.example`.

3. Run:
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port 8000
   ```

4. Update `FRONTEND_URL` to your deployed frontend URL for CORS.

### Update BotFather

Update the Mini App URL via `/myapps` in @BotFather to point to your deployed frontend.

## Debugging

### Enable WebView Inspector (Desktop)
1. Use Telegram Desktop Beta
2. Settings → Advanced → Experimental → Enable webview inspecting
3. Right-click in Mini App → Inspect

### Mobile Debugging
- **Android**: Enable WebView Debug in Telegram → `chrome://inspect/#devices`
- **iOS**: Enable WebView Debug → Safari Developer Tools

### Using Telegram Test Environment
For testing with HTTP (no SSL needed):
1. Register at [test.telegram.org](https://test.telegram.org)
2. Create a test bot via test @BotFather
3. Use `http://localhost:5173` directly as Mini App URL

## License

MIT
