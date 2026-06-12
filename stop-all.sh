#!/bin/bash
# ==============================================================================
#  MediFlow Stack Shutdown Script (macOS/Linux compatible)
#  Stops all running backend and frontend services and halts the Docker stack.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=========================================================================="
echo "               MediFlow Plateforme Stack Shutdown Script"
echo "=========================================================================="

# ------------------------------------------------------------------------------
#  Helpers
# ------------------------------------------------------------------------------
stop_port() {
  local port=$1
  local pids=$(lsof -t -i :$port 2>/dev/null)
  if [ ! -z "$pids" ]; then
    echo "Stopping processes on port $port (PIDs: $pids)..."
    kill -9 $pids 2>/dev/null || true
  else
    echo "Port $port is already free."
  fi
}

# 1. Stop local processes
echo "--- [1/2] Terminating local services ---"
PORTS=(8888 8761 8090 8081 8082 8083 8084 8085 8086 8087 8088 8089 4200)
for port in "${PORTS[@]}"; do
  stop_port $port
done

# 2. Stop docker containers
echo "--- [2/2] Stopping Docker infrastructure ---"
if command -v docker &> /dev/null; then
  docker compose down
else
  echo "Docker CLI not found, skipping Docker down."
fi

echo "=========================================================================="
echo "                     ALL SERVICES STOPPED SUCCESSFULLY"
echo "=========================================================================="
