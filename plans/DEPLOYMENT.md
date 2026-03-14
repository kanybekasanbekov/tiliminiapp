# TiliMiniApp — Production Deployment Guide

> Comprehensive plan for deploying TiliMiniApp from a local dev setup (ngrok) to a production VPS.
>
> **Last updated:** 2026-03-14
> **Plan status:** Reviewed by Architect + Critic, consensus reached

---

## Table of Contents

1. [Why Move Off ngrok?](#1-why-move-off-ngrok)
2. [Choosing a Server](#2-choosing-a-server)
3. [Production Architecture](#3-production-architecture)
4. [Cost Breakdown](#4-cost-breakdown)
5. [Step-by-Step Deployment](#5-step-by-step-deployment)
   - [Step 1: VPS & Domain Setup](#step-1-vps--domain-setup-30-min)
   - [Step 2: Server Environment](#step-2-server-environment-20-min)
   - [Step 3: Deploy the App](#step-3-deploy-the-app-15-min)
   - [Step 4: Configure Services](#step-4-configure-services-15-min)
   - [Step 5: Go Live](#step-5-go-live-10-min)
   - [Step 6: Backups & Monitoring](#step-6-backups--monitoring-10-min)
6. [Deployment Files Reference](#6-deployment-files-reference)
7. [Day-to-Day Operations](#7-day-to-day-operations)
8. [Troubleshooting](#8-troubleshooting)
9. [Scale Ceiling & Future Considerations](#9-scale-ceiling--future-considerations)

---

## 1. Why Move Off ngrok?

| Issue | ngrok Free | ngrok Paid ($8/mo) | VPS ($4/mo) |
|-------|-----------|-------------------|-------------|
| URL changes on restart | Yes | No (static subdomain) | No (your domain) |
| Bandwidth | 1 GB/month | 5 GB/month | 20 TB/month |
| PC must be on 24/7 | Yes | Yes | No |
| Browser interstitial warning | Yes | No | No |
| Monthly cost | $0 | $8 | ~$4 |
| Latency overhead | +20-100ms | +20-100ms | None |

**Verdict:** A VPS is cheaper than ngrok paid, more reliable, and eliminates the dependency on your local machine.

### Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| **Cloudflare Tunnel** (free) | Requires your PC to be always on — same core problem as ngrok |
| **Oracle Cloud Free Tier** ($0) | "Out of capacity" provisioning lottery, complex setup, account termination risk |
| **Railway** ($5/mo) | SQLite doesn't persist on ephemeral filesystem — would need PostgreSQL migration |
| **Render** ($7/mo) | Free tier sleeps after 15 min (kills the bot), paid tier costs more |
| **Fly.io** (~$4/mo) | No free tier, complex config for multi-process app |
| **Tailscale Funnel** | Beta, no SLA, PC must be on |

---

## 2. Choosing a Server

### VPS Provider Comparison

| Provider | Plan | Price/mo | RAM | vCPU | Storage | Bandwidth | Best For |
|----------|------|----------|-----|------|---------|-----------|----------|
| **Hetzner** | CX22 | ~$4 (€3.49) | 4 GB | 2 | 40 GB SSD | 20 TB | **Best value (recommended)** |
| **Hetzner** | CAX11 (ARM) | ~$4.40 (€3.79) | 4 GB | 2 Ampere | 40 GB SSD | 20 TB | ARM alternative |
| **Vultr** | High Perf | $6/mo | 1 GB | 1 | 25 GB NVMe | 2 TB | Closest DC to Central Asia (Istanbul) |
| **DigitalOcean** | Basic | $6/mo | 1 GB | 1 | 25 GB SSD | 1 TB | Good docs ecosystem |
| **Linode/Akamai** | Nanode | $5/mo | 1 GB | 1 | 25 GB SSD | 1 TB | Solid alternative |

### Recommendation: Hetzner CX22 in Frankfurt

- **€3.49/month** (~$4) for 2 vCPU, 4 GB RAM, 40 GB SSD
- Frankfurt is well-connected to Central Asia (~60-80ms)
- 20 TB traffic — essentially unlimited for this app
- Ubuntu 24.04 LTS

### Minimum Specs for This App

The entire stack (FastAPI + SQLite + Telegram bot + Caddy) uses ~200-400 MB RAM at idle. A 1 GB VPS works but is tight during `npm ci` builds. The 4 GB on Hetzner CX22 gives comfortable headroom.

---

## 3. Production Architecture

```
┌─────────────────────────────────────────────┐
│  Hetzner VPS (Ubuntu 24.04, Frankfurt)      │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Caddy (port 443, auto-HTTPS)      │    │
│  │  ├── /api/*  → reverse_proxy :8000 │    │
│  │  └── /*      → static dist/        │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──────────────────────┐  ┌────────────┐  │
│  │ uvicorn :8000        │  │ bot.py     │  │
│  │ (FastAPI backend)    │  │ (polling)  │  │
│  │ systemd service      │  │ systemd    │  │
│  └──────────┬───────────┘  └────────────┘  │
│             │                               │
│  ┌──────────▼───────────┐                   │
│  │ SQLite (WAL mode)    │                   │
│  │ flashcards.db        │                   │
│  │ + TTS audio cache    │                   │
│  └──────────────────────┘                   │
│                                             │
│  External: OpenAI API (LLM + TTS)           │
└─────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Chosen | Why |
|----------|--------|-----|
| Web server | **Caddy** | Auto-HTTPS (Let's Encrypt), ~10 lines of config vs 50+ for Nginx |
| Process manager | **systemd** | Built into Ubuntu, auto-restart, log management via journald |
| Python environment | **venv** | Simpler than conda on Linux servers |
| Bot mode | **Polling** | Simpler than webhooks, no extra port/route needed |
| Workers | **1 uvicorn worker** | Sufficient for <100 users, avoids SQLite concurrency issues |
| Containerization | **None (bare metal)** | Docker adds complexity without benefit for single-app VPS |
| Frontend serving | **Static files via Caddy** | `npm run build` → `dist/`, no Vite dev server in production |

---

## 4. Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Hetzner CX22 | ~$4/month | 2 vCPU, 4 GB RAM, 40 GB SSD |
| Domain (.com) | ~$1/month | ~$12/year via Cloudflare Registrar or Namecheap |
| SSL Certificate | **$0** | Let's Encrypt via Caddy (automatic) |
| OpenAI API (LLM) | ~$0.50–2/month | gpt-4.1-mini for translations, ~100 cards/month |
| OpenAI API (TTS) | ~$0.10–0.50/month | gpt-4o-mini-tts, cached in SQLite so repeats are free |
| UptimeRobot | **$0** | Free tier (50 monitors, 5-min intervals) |
| **Total** | **~$5–7/month** | Conservative estimate for <100 users |

---

## 5. Step-by-Step Deployment

### Step 1: VPS & Domain Setup (~30 min)

#### 1a. Provision the VPS

1. Create a [Hetzner Cloud](https://www.hetzner.com/cloud) account
2. Create a new server:
   - **Location:** Frankfurt (closest to Central Asia)
   - **Image:** Ubuntu 24.04
   - **Type:** CX22 (Shared vCPU, x86, €3.49/mo)
   - **SSH Key:** Add your public key during creation
3. Note the server's IP address

#### 1b. Get a Domain

Buy a cheap domain (~$12/year):
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (at-cost pricing)
- [Namecheap](https://www.namecheap.com/) (often has first-year deals)
- Or use a subdomain if you already own a domain (e.g., `tili.yourdomain.com`)

#### 1c. Configure DNS

Create an **A record** pointing your domain to the VPS IP:

```
Type: A
Name: tili (or @ for root domain)
Value: <your-vps-ip>
TTL: 300
```

#### 1d. Harden the Server

SSH into the VPS and run:

```bash
# Create a non-root deploy user
adduser deploy
usermod -aG sudo deploy

# Copy SSH key to new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Disable password authentication
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Set up firewall (CRITICAL — without this, port 8000 is exposed directly!)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Verify:** `sudo ufw status` shows only ports 22, 80, 443 open.

From now on, SSH as the deploy user: `ssh deploy@<your-vps-ip>`

---

### Step 2: Server Environment (~20 min)

```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Python 3.12+ and SQLite CLI (for backups)
sudo apt install -y python3 python3-pip python3-venv sqlite3

# Node.js 20 LTS (needed to build the React frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Caddy web server (handles HTTPS automatically)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy

# Add 2 GB swap (prevents out-of-memory during npm builds)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Verify:**
```bash
python3 --version   # 3.12+
node --version      # v20+
caddy version       # should print version
free -h             # should show 2 GB swap
```

---

### Step 3: Deploy the App (~15 min)

#### 3a. Clone the Repository

```bash
# Create app directory
sudo mkdir -p /opt/tiliminiapp
sudo chown deploy:deploy /opt/tiliminiapp

# Clone (use deploy key or personal access token for private repos)
git clone <your-repo-url> /opt/tiliminiapp
cd /opt/tiliminiapp
```

> **Note:** If the repo is private, set up a [GitHub deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) or use `https://` with a personal access token.

#### 3b. Set Up Python Environment

```bash
cd /opt/tiliminiapp
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
```

#### 3c. Build the Frontend

```bash
cd /opt/tiliminiapp/frontend
npm ci
npm run build
```

This creates `frontend/dist/` with static HTML/JS/CSS files. Caddy will serve these directly — no Vite dev server needed.

#### 3d. Create the Production `.env`

```bash
cp .env.example .env
nano .env
```

Fill in these values carefully:

```env
# Required — get from @BotFather
TELEGRAM_BOT_TOKEN=your-real-bot-token

# Required — your OpenAI API key
OPENAI_API_KEY=sk-your-real-key

# LLM settings
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini

# CRITICAL — must match your domain exactly, no trailing slash!
FRONTEND_URL=https://tili.yourdomain.com

# CRITICAL — use absolute path on the server!
DATABASE_PATH=/opt/tiliminiapp/database/flashcards.db

# Reduce log noise in production
LOG_LEVEL=WARNING

# Your Telegram user ID for admin dashboard access
ADMIN_USER_ID=your-telegram-user-id

# TTS — DO NOT use values from .env.example, they are outdated!
# The old tts-1 model silently ignores pronunciation instructions
TTS_MODEL=gpt-4o-mini-tts
TTS_VOICE=coral
```

> **Warning:** The `.env.example` has `TTS_MODEL=tts-1` and `TTS_VOICE=nova` — these are outdated. The `tts-1` model silently ignores the `instructions` parameter, producing wrong pronunciation for non-English words. Always use `gpt-4o-mini-tts` with `coral`.

---

### Step 4: Configure Services (~15 min)

#### 4a. Caddy (Reverse Proxy + HTTPS)

Edit the Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

Replace the contents with:

```
tili.yourdomain.com {
    handle /api/* {
        reverse_proxy localhost:8000
    }

    handle {
        root * /opt/tiliminiapp/frontend/dist
        try_files {path} /index.html
        file_server
    }
}
```

**How this works:**
- Caddy automatically obtains a Let's Encrypt certificate for your domain
- `/api/*` requests are proxied to the FastAPI backend on port 8000
- Everything else serves the React SPA from the built static files
- `try_files {path} /index.html` ensures client-side routing works
- The `handle` blocks provide mutual exclusivity (API vs static files)

> **Important:** The directive ordering matters! The `handle /api/*` block must come first, and `try_files` must be inside the second `handle` block (before `file_server`). Getting this wrong causes 404 errors.

Reload Caddy:

```bash
sudo systemctl reload caddy
```

#### 4b. Backend Service (FastAPI)

Create the systemd unit file:

```bash
sudo nano /etc/systemd/system/tiliminiapp-backend.service
```

```ini
[Unit]
Description=TiliMiniApp Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/tiliminiapp
Environment=PATH=/opt/tiliminiapp/.venv/bin:/usr/bin
ExecStart=/opt/tiliminiapp/.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Key points:**
- Binds to `127.0.0.1` only — not accessible from the internet directly (Caddy handles that)
- No `--reload` flag (that's for development only)
- `Restart=always` ensures it comes back after crashes
- `WorkingDirectory` is set so the relative `DATABASE_PATH` fallback works (though you should use an absolute path in `.env`)

#### 4c. Bot Service (Telegram)

```bash
sudo nano /etc/systemd/system/tiliminiapp-bot.service
```

```ini
[Unit]
Description=TiliMiniApp Telegram Bot
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/tiliminiapp
Environment=PATH=/opt/tiliminiapp/.venv/bin:/usr/bin
ExecStart=/opt/tiliminiapp/.venv/bin/python bot.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Note:** `RestartSec=10` (longer than backend) to avoid Telegram rate limits on reconnect.

#### 4d. Enable and Start Everything

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tiliminiapp-backend
sudo systemctl enable --now tiliminiapp-bot
```

`enable --now` starts the service immediately AND ensures it starts on boot.

---

### Step 5: Go Live (~10 min)

#### 5a. Verify Services

```bash
# Check service status
systemctl status tiliminiapp-backend
systemctl status tiliminiapp-bot
systemctl status caddy

# Test the API
curl -sf https://tili.yourdomain.com/api/health
# Expected: {"status":"ok"}
```

#### 5b. Verify HTTPS

Open `https://tili.yourdomain.com` in your browser. You should see the React app with a valid SSL certificate (padlock icon).

#### 5c. Verify the Telegram Bot

1. Open your bot in Telegram
2. The bot's `post_init` callback automatically sets the menu button URL to `FRONTEND_URL`
3. Tap the menu button — the Mini App should open from your production domain
4. Test: add a flashcard, practice (all 3 modes: flip, type, quiz), check TTS playback

#### 5d. Copy Your Existing Database (Optional)

If you want to keep your existing flashcards from local development:

```bash
# On your local Mac:
scp database/flashcards.db deploy@<vps-ip>:/opt/tiliminiapp/database/flashcards.db

# On the VPS:
sudo systemctl restart tiliminiapp-backend
```

> **Note:** The database includes the `review_history` table (study mode stats, accuracy tracking) — this data transfers correctly.

---

### Step 6: Backups & Monitoring (~10 min)

#### 6a. Database Backup Script

```bash
mkdir -p /opt/tiliminiapp/deploy
nano /opt/tiliminiapp/deploy/backup.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/opt/tiliminiapp/backups"
DB_PATH="/opt/tiliminiapp/database/flashcards.db"
mkdir -p "$BACKUP_DIR"

# SQLite online backup — safe with WAL mode, no need to stop the server
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/flashcards-$(date +%Y%m%d-%H%M%S).db'"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.db" -mtime +7 -delete

echo "Backup completed: $(ls -lh $BACKUP_DIR/*.db | tail -1)"
```

```bash
chmod +x /opt/tiliminiapp/deploy/backup.sh

# Schedule daily backup at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/tiliminiapp/deploy/backup.sh") | crontab -
```

#### 6b. Uptime Monitoring

1. Sign up for [UptimeRobot](https://uptimerobot.com) (free)
2. Add a monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://tili.yourdomain.com/api/health`
   - **Interval:** 5 minutes
3. Set up email or Telegram alerts for downtime

#### 6c. View Logs

```bash
# Backend logs
journalctl -u tiliminiapp-backend --since "1 hour ago"

# Bot logs
journalctl -u tiliminiapp-bot --since "1 hour ago"

# Caddy logs
journalctl -u caddy --since "1 hour ago"

# Follow logs in real-time
journalctl -u tiliminiapp-backend -f
```

Logs are automatically rotated by journald. To limit log retention:

```bash
sudo journalctl --vacuum-time=30d
```

---

## 6. Deployment Files Reference

### Deploy Script (for future updates)

Save as `/opt/tiliminiapp/deploy/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /opt/tiliminiapp

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Updating Python dependencies ==="
.venv/bin/pip install -r backend/requirements.txt --quiet

echo "=== Building frontend ==="
cd frontend && npm ci --silent && npm run build && cd ..

echo "=== Restarting services ==="
sudo systemctl restart tiliminiapp-backend
sudo systemctl restart tiliminiapp-bot

echo "=== Verifying ==="
sleep 3
systemctl is-active tiliminiapp-backend && echo "Backend: running"
systemctl is-active tiliminiapp-bot && echo "Bot: running"
curl -sf http://localhost:8000/api/health && echo "Health check: OK"

echo "=== Deploy complete ==="
```

```bash
chmod +x /opt/tiliminiapp/deploy/deploy.sh
```

**Usage from your local machine:**

```bash
ssh deploy@<vps-ip> '/opt/tiliminiapp/deploy/deploy.sh'
```

### File Layout on Server

```
/opt/tiliminiapp/
├── .env                          # Production config (not in git!)
├── .venv/                        # Python virtual environment
├── backend/                      # FastAPI app
├── frontend/
│   ├── src/                      # Source (only needed for builds)
│   └── dist/                     # Built static files (served by Caddy)
├── database/
│   └── flashcards.db             # SQLite database
├── bot.py                        # Telegram bot entry point
├── deploy/
│   ├── backup.sh                 # Daily backup script
│   └── deploy.sh                 # Update deploy script
└── backups/                      # SQLite backup files (7-day rotation)
```

### System Config Files

```
/etc/caddy/Caddyfile                          # Caddy reverse proxy config
/etc/systemd/system/tiliminiapp-backend.service  # Backend service
/etc/systemd/system/tiliminiapp-bot.service      # Bot service
```

---

## 7. Day-to-Day Operations

| Task | Command |
|------|---------|
| Deploy an update | `ssh deploy@vps '/opt/tiliminiapp/deploy/deploy.sh'` |
| Check if services are running | `systemctl status tiliminiapp-backend tiliminiapp-bot` |
| Restart backend | `sudo systemctl restart tiliminiapp-backend` |
| Restart bot | `sudo systemctl restart tiliminiapp-bot` |
| View backend logs | `journalctl -u tiliminiapp-backend -f` |
| View bot logs | `journalctl -u tiliminiapp-bot -f` |
| Manual backup | `/opt/tiliminiapp/deploy/backup.sh` |
| Check disk space | `df -h /` |
| Reboot the server | `sudo reboot` (services auto-start) |

---

## 8. Troubleshooting

### "Web App not available" in Telegram

- The bot's `post_init` sets the menu button URL automatically from `FRONTEND_URL`
- Verify `.env` has `FRONTEND_URL=https://tili.yourdomain.com` (exact match, no trailing slash)
- Restart the bot: `sudo systemctl restart tiliminiapp-bot`

### CORS errors in browser console

- `FRONTEND_URL` in `.env` must exactly match the URL in the browser address bar
- Must include `https://`, no trailing slash
- After changing `.env`, restart the backend: `sudo systemctl restart tiliminiapp-backend`

### 502 Bad Gateway from Caddy

- The backend isn't running: `systemctl status tiliminiapp-backend`
- Check backend logs: `journalctl -u tiliminiapp-backend --since "5 min ago"`
- Verify backend is listening: `curl http://localhost:8000/api/health`

### TTS pronunciation is wrong

- Check `.env` has `TTS_MODEL=gpt-4o-mini-tts` (NOT `tts-1`)
- The old `tts-1` model ignores the `instructions` parameter
- After fixing, restart backend and clear the TTS cache if needed

### Database errors

- Verify `DATABASE_PATH` in `.env` is an absolute path
- Check the database directory exists and is writable by the `deploy` user
- If SQLite is locked: the 5-second `busy_timeout` usually handles this, but if persistent, restart the backend

### npm build fails with OOM

- Verify swap is enabled: `free -h` (should show 2 GB swap)
- If not: re-run the swap setup commands from Step 2

---

## 9. Scale Ceiling & Future Considerations

### When This Architecture Is Sufficient

| Users | Status | Notes |
|-------|--------|-------|
| 1–100 | Comfortable | No changes needed |
| 100–500 | Fine | Monitor RAM and response times |
| 500+ | Strain begins | See upgrade path below |

### What Breaks First and How to Fix It

| Bottleneck | Symptom | Fix |
|------------|---------|-----|
| Single SQLite connection | `SQLITE_BUSY` errors under load | Add connection pool or switch to PostgreSQL |
| Single uvicorn worker | Slow responses during LLM/TTS calls | Add `--workers 2` (but needs PostgreSQL first) |
| TTS cache BLOBs grow | Backups become slow | Move audio to filesystem or object storage |
| 4 GB RAM | OOM killer | Upgrade to CX32 (8 GB, ~€6/mo) |
| 40 GB SSD fills | Writes fail | Upgrade disk or add Hetzner volume |

### SQLite Production Notes

SQLite is perfectly fine for this use case. The current configuration (in `backend/db/connection.py`) is already production-ready:

- `journal_mode=WAL` — allows concurrent reads during writes
- `busy_timeout=5000` — retries on lock instead of failing
- `synchronous=NORMAL` — good balance of safety and performance
- `cache_size=-2000` — 2 MB page cache
- `temp_store=MEMORY` — temp tables in RAM

The database handles all features including: flashcards, decks, SRS scheduling, review history (with study mode tracking for flip/type/quiz), TTS audio cache, API usage tracking, and user preferences.

### When to Consider PostgreSQL

Only if you need:
- Multiple uvicorn workers (horizontal scaling)
- More than ~1000 concurrent users
- Advanced queries or full-text search

For a vocabulary learning app with <500 users, SQLite will serve you well for years.

---

## Checklist Summary

Use this as a quick reference during deployment:

- [ ] Hetzner CX22 provisioned (Ubuntu 24.04, Frankfurt)
- [ ] Domain purchased and A record points to VPS IP
- [ ] SSH as non-root user with key auth works
- [ ] UFW firewall active (ports 22, 80, 443 only)
- [ ] Python 3.12+, Node.js 20, Caddy, SQLite3 installed
- [ ] 2 GB swap enabled
- [ ] Repo cloned to `/opt/tiliminiapp`
- [ ] Python venv created and dependencies installed
- [ ] Frontend built (`frontend/dist/` exists)
- [ ] `.env` created with correct production values
- [ ] `.env` has `TTS_MODEL=gpt-4o-mini-tts` (NOT `tts-1`)
- [ ] Caddyfile configured with `handle` blocks
- [ ] Backend systemd service enabled and running
- [ ] Bot systemd service enabled and running
- [ ] `https://yourdomain.com` loads the app with valid HTTPS
- [ ] `https://yourdomain.com/api/health` returns `{"status":"ok"}`
- [ ] Telegram bot menu button opens the Mini App
- [ ] All features work: add card, practice (flip/type/quiz), TTS, stats
- [ ] Backup cron job installed (daily at 3 AM)
- [ ] UptimeRobot monitoring configured
- [ ] Local database copied to VPS (if keeping existing data)
