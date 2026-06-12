#!/bin/bash
# ==============================================================================
#  MediFlow Stack Startup Script (macOS/Linux compatible)
#  Starts Docker infrastructure and launches all Spring Boot, Node.js and
#  Angular services locally in the background. Logs are written to .logs/
# ==============================================================================

set -e

# Setup absolute path to the root of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

LOGS_DIR="$ROOT_DIR/.logs"
mkdir -p "$LOGS_DIR"

echo "=========================================================================="
echo "               MediFlow Plateforme Stack Startup Script"
echo "=========================================================================="
echo "Root Directory: $ROOT_DIR"
echo "Logs Directory: $LOGS_DIR"
echo "=========================================================================="

# ------------------------------------------------------------------------------
#  Helpers
# ------------------------------------------------------------------------------

# Kill any process listening on the specified port
stop_port() {
  local port=$1
  local pids=$(lsof -t -i :$port 2>/dev/null)
  if [ -not -z "$pids" ] || [ ! -z "$pids" ]; then
    echo " -> Port $port is in use. Stopping PIDs: $pids"
    kill -9 $pids 2>/dev/null || true
  fi
}

# Wait for a port to be listening
wait_port() {
  local port=$1
  local timeout=${2:-300}
  local elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if nc -z 127.0.0.1 $port >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  return 1
}

# Wait for Keycloak realm endpoint to return HTTP 200
wait_keycloak_realm() {
  local elapsed=0
  local timeout=120
  echo -n "Waiting for Keycloak mediflow-realm to import and become healthy..."
  while [ $elapsed -lt $timeout ]; do
    if curl -s -f http://localhost:8080/realms/mediflow-realm >/dev/null 2>&1; then
      echo " READY!"
      return 0
    fi
    echo -n "."
    sleep 2
    elapsed=$((elapsed + 2))
  done
  echo " WARNING: Keycloak realm check timed out. Continuing anyway..."
  return 1
}

# Start a Java Spring Boot service via mvnw
start_java_svc() {
  local name=$1
  local rel_path=$2
  local dir="$ROOT_DIR/$rel_path"
  
  if [ ! -d "$dir" ]; then
    echo "SKIP $name (directory not found: $dir)"
    return
  fi
  
  local mvnw="$dir/mvnw"
  if [ ! -f "$mvnw" ]; then
    echo "SKIP $name (mvnw not found in $dir)"
    return
  fi
  
  chmod +x "$mvnw"
  
  local out="$LOGS_DIR/$name.log"
  local err="$LOGS_DIR/$name.err.log"
  rm -f "$out" "$err"
  
  echo "Starting $name (Java Spring Boot) ... log: .logs/$name.log"
  cd "$dir"
  nohup ./mvnw spring-boot:run > "$out" 2> "$err" &
  cd "$ROOT_DIR"
}

# Start a Node.js service via npm start
start_node_svc() {
  local name=$1
  local rel_path=$2
  local dir="$ROOT_DIR/$rel_path"
  
  if [ ! -d "$dir" ]; then
    echo "SKIP $name (directory not found: $dir)"
    return
  fi
  
  if [ ! -f "$dir/package.json" ]; then
    echo "SKIP $name (package.json not found in $dir)"
    return
  fi
  
  local out="$LOGS_DIR/$name.log"
  local err="$LOGS_DIR/$name.err.log"
  rm -f "$out" "$err"
  
  if [ ! -d "$dir/node_modules" ]; then
    echo "Installing $name npm dependencies (first time)..."
    cd "$dir"
    npm install > /dev/null 2>&1
    cd "$ROOT_DIR"
  fi
  
  echo "Starting $name (Node.js) ... log: .logs/$name.log"
  cd "$dir"
  nohup npm start > "$out" 2> "$err" &
  cd "$ROOT_DIR"
}

# Start Frontend (Angular)
start_frontend() {
  local dir="$ROOT_DIR/Frontend"
  if [ ! -d "$dir" ]; then
    echo "SKIP Frontend (directory not found)"
    return
  fi
  
  local out="$LOGS_DIR/Frontend.log"
  local err="$LOGS_DIR/Frontend.err.log"
  rm -f "$out" "$err"
  
  if [ ! -d "$dir/node_modules" ]; then
    echo "Installing Frontend npm dependencies (first time)..."
    cd "$dir"
    npm ci > /dev/null 2>&1
    cd "$ROOT_DIR"
  fi
  
  echo "Starting Frontend (Angular) ... log: .logs/Frontend.log"
  cd "$dir"
  nohup npx ng serve --host 127.0.0.1 --port 4200 > "$out" 2> "$err" &
  cd "$ROOT_DIR"
}

# ------------------------------------------------------------------------------
#  1. Stop conflicting processes on ports
# ------------------------------------------------------------------------------
echo "--- [1/5] Freeing up service ports ---"
PORTS=(8888 8761 8090 8081 8082 8083 8084 8085 8086 8087 8088 8089 4200)
for port in "${PORTS[@]}"; do
  stop_port $port
done

# ------------------------------------------------------------------------------
#  2. Start Docker containers (DBs, Keycloak, RabbitMQ)
# ------------------------------------------------------------------------------
echo "--- [2/5] Starting Docker Infrastructure (RabbitMQ, Keycloak, MySQL, Postgres) ---"
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker CLI not found. Please install Docker and make sure the daemon is running."
  exit 1
fi

docker compose up -d rabbitmq keycloak mysql postgres

echo "Waiting for Docker service ports to open..."
wait_port 5672 60  # RabbitMQ
wait_port 3306 60  # MySQL
wait_port 5432 60  # Postgres
wait_port 8080 120 # Keycloak

# Wait for the specific realm configuration to be imported
wait_keycloak_realm

# ------------------------------------------------------------------------------
#  3. Start Infrastructure microservices
# ------------------------------------------------------------------------------
echo "--- [3/5] Starting Infrastructure Microservices ---"

start_java_svc "config-server" "Backend/infrastructure/config-server"
echo "Waiting for config-server to be ready (8888)..."
wait_port 8888 120

start_java_svc "discovery-service" "Backend/infrastructure/discovery-service"
echo "Waiting for discovery-service (Eureka) to be ready (8761)..."
wait_port 8761 120

start_java_svc "api-gateway" "Backend/infrastructure/api-gateway"
echo "Waiting for api-gateway to be ready (8090)..."
wait_port 8090 120

# ------------------------------------------------------------------------------
#  4. Start Business microservices
# ------------------------------------------------------------------------------
echo "--- [4/5] Starting Business Microservices ---"

# Start Node.js microservices
start_node_svc "user-service" "Backend/services/user-service"
start_node_svc "notification-service" "Backend/services/notification-service"

# Start Spring Boot microservices
start_java_svc "patient-service" "Backend/services/patient-service"
start_java_svc "appointment-service" "Backend/services/appointment-service"
start_java_svc "assurance-service" "Backend/services/assurance-service"
start_java_svc "billing-service" "Backend/services/billing-service"
start_java_svc "exam-service" "Backend/services/exam-service"
start_java_svc "pharmacy-service" "Backend/services/pharmacy-service"
start_java_svc "room-service" "Backend/services/room-service"

# Wait for business services ports to open
echo "Waiting for all business microservices to register and open ports..."
SERVICES=(
  "user-service:8081"
  "appointment-service:8082"
  "assurance-service:8083"
  "billing-service:8084"
  "exam-service:8085"
  "notification-service:8086"
  "pharmacy-service:8087"
  "room-service:8088"
  "patient-service:8089"
)

for svc in "${SERVICES[@]}"; do
  name="${svc%%:*}"
  port="${svc##*:}"
  if wait_port $port 90; then
    echo "  [OK] $name is running on port $port"
  else
    echo "  [FAIL] $name failed to start on port $port (check .logs/$name.err.log)"
  fi
done

# ------------------------------------------------------------------------------
#  5. Start Frontend Angular application
# ------------------------------------------------------------------------------
echo "--- [5/5] Starting Frontend (Angular) ---"
start_frontend

if wait_port 4200 120; then
  echo "  [OK] Frontend is running on http://127.0.0.1:4200"
else
  echo "  [FAIL] Frontend failed to start on port 4200 (check .logs/Frontend.log)"
fi

echo ""
echo "=========================================================================="
echo "                   ALL SERVICES LAUNCHED SUCCESSFULLY"
echo "=========================================================================="
echo "  - Eureka Dashboard   : http://localhost:8761"
echo "  - Config Server      : http://localhost:8888"
echo "  - API Gateway        : http://localhost:8090"
echo "  - Keycloak Server    : http://localhost:8080"
echo "  - Keycloak Admin     : admin / admin"
echo "  - RabbitMQ Management: http://localhost:15672 (mediflow / mediflow123)"
echo "  - Frontend UI        : http://localhost:4200"
echo "=========================================================================="
echo "  To view logs, inspect the '.logs/' folder:"
echo "  - ls -la .logs/"
echo "  To stop everything, run: ./stop-all.sh"
echo "=========================================================================="
echo ""
