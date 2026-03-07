#!/usr/bin/env bash
set -uo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

killed=0

kill_by_pattern() {
    local pattern="$1"
    local label="$2"
    local pids
    pids=$(pgrep -f "$pattern" 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill 2>/dev/null
        echo -e "  ${GREEN}Stopped${NC} $label (PID: $(echo $pids | tr '\n' ' '))"
        killed=$((killed + 1))
    fi
}

kill_by_port() {
    local port="$1"
    local label="$2"
    local pids
    pids=$(lsof -ti:"$port" 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill 2>/dev/null
        echo -e "  ${GREEN}Stopped${NC} $label on port $port (PID: $(echo $pids | tr '\n' ' '))"
        killed=$((killed + 1))
    fi
}

echo -e "${YELLOW}Stopping TiliMiniApp processes...${NC}"

kill_by_pattern "uvicorn backend.main" "backend (uvicorn)"
kill_by_pattern "python bot.py" "bot"
kill_by_pattern "ngrok http" "ngrok"

# Fallback: kill by port if processes weren't caught by pattern
kill_by_port 8000 "backend"
kill_by_port 5173 "frontend (vite)"

if [ "$killed" -eq 0 ]; then
    echo -e "  No running TiliMiniApp processes found."
fi

echo -e "${GREEN}Done.${NC}"
