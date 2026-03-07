#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
LOG_DIR="$PROJECT_DIR/.logs"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# PIDs to clean up
NGROK_PID=""
BACKEND_PID=""
FRONTEND_PID=""
BOT_PID=""
ROTATE_PID=""

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    [ -n "$ROTATE_PID" ] && kill "$ROTATE_PID" 2>/dev/null
    [ -n "$BOT_PID" ] && kill "$BOT_PID" 2>/dev/null && echo "  Stopped bot"
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null && echo "  Stopped backend"
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && echo "  Stopped frontend"
    [ -n "$NGROK_PID" ] && kill "$NGROK_PID" 2>/dev/null && echo "  Stopped ngrok"
    wait 2>/dev/null
    echo -e "${GREEN}All processes stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# --- Create log directory ---

mkdir -p "$LOG_DIR"

# --- Log rotation (cap at 5MB per file) ---

MAX_LOG_SIZE=$((5 * 1024 * 1024))

rotate_logs() {
    while true; do
        sleep 600
        for logfile in "$LOG_DIR"/*.log; do
            [ -f "$logfile" ] || continue
            size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null || echo 0)
            if [ "$size" -gt "$MAX_LOG_SIZE" ]; then
                tail -n 1000 "$logfile" > "$logfile.tmp" && mv "$logfile.tmp" "$logfile"
            fi
        done
    done
}

rotate_logs &
ROTATE_PID=$!

# --- Preflight checks ---

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: .env file not found at $ENV_FILE${NC}"
    echo "Copy .env.example to .env and fill in your values."
    exit 1
fi

if ! command -v ngrok &>/dev/null; then
    echo -e "${RED}Error: ngrok not found. Install it: https://ngrok.com/download${NC}"
    exit 1
fi

# --- 1. Start ngrok ---

echo -e "${YELLOW}Starting ngrok on port 5173...${NC}"
ngrok http 5173 --log=stdout --log-level=warn > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for ngrok API to be ready
echo -n "  Waiting for ngrok tunnel"
NGROK_URL=""
for i in $(seq 1 30); do
    sleep 1
    echo -n "."
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
        | python3 -c "import sys,json; tunnels=json.load(sys.stdin).get('tunnels',[]); print(next((t['public_url'] for t in tunnels if t['public_url'].startswith('https')), ''))" 2>/dev/null) || true
    if [ -n "$NGROK_URL" ]; then
        break
    fi
done
echo ""

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}Error: Could not get ngrok URL after 30s. Is ngrok authenticated?${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}  Ngrok URL: $NGROK_URL${NC}"

# --- 2. Update FRONTEND_URL in .env ---

if grep -q "^FRONTEND_URL=" "$ENV_FILE"; then
    sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=$NGROK_URL|" "$ENV_FILE"
    rm -f "$ENV_FILE.bak"
else
    echo "FRONTEND_URL=$NGROK_URL" >> "$ENV_FILE"
fi
echo -e "${GREEN}  Updated FRONTEND_URL in .env${NC}"

# --- 3. Start backend ---

echo -e "${YELLOW}Starting backend (uvicorn) on port 8000...${NC}"
cd "$PROJECT_DIR"
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}  Backend started (PID $BACKEND_PID)${NC}"

# --- 4. Start frontend ---

echo -e "${YELLOW}Starting frontend (vite) on port 5173...${NC}"
cd "$PROJECT_DIR/frontend"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd "$PROJECT_DIR"
echo -e "${GREEN}  Frontend started (PID $FRONTEND_PID)${NC}"

# --- 5. Start bot ---

echo -e "${YELLOW}Starting Telegram bot...${NC}"
cd "$PROJECT_DIR"
python bot.py > "$LOG_DIR/bot.log" 2>&1 &
BOT_PID=$!
echo -e "${GREEN}  Bot started (PID $BOT_PID)${NC}"

# --- Ready ---

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  TiliMiniApp is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Mini App URL:  ${GREEN}$NGROK_URL${NC}"
echo -e "  Backend:       http://localhost:8000"
echo -e "  Frontend:      http://localhost:5173"
echo -e "  Ngrok inspect: http://127.0.0.1:4040"
echo ""
echo -e "  Logs:"
echo -e "    tail -f .logs/backend.log"
echo -e "    tail -f .logs/frontend.log"
echo -e "    tail -f .logs/bot.log"
echo ""
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop all processes."
echo ""

# Keep script alive, waiting for any child to exit
wait
