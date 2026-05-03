$ErrorActionPreference = "Stop"

# ============================================================
#  Run the full stack
#   - Spring Cloud microservices (Java)
#   - Node.js user-service
#   - Angular frontend
#  Logs: .logs/<Service>.log
# ============================================================

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $root

$logs = Join-Path $root ".logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null

# ------------------------------------------------------------
#  Helpers
# ------------------------------------------------------------
function Get-PortPids([int]$port) {
  $lines = netstat -ano | Select-String (":$port") | ForEach-Object { $_.ToString().Trim() }
  $pids = @()
  foreach ($l in $lines) {
    $tok = ($l -split '\s+')
    $procPid = $tok[-1]
    if ($procPid -match '^\d+$') { $pids += [int]$procPid }
  }
  $pids | Select-Object -Unique
}

function Stop-PortIfSafe([int]$port) {
  $pids = Get-PortPids $port
  foreach ($procId in $pids) {
    $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if (-not $p) { continue }
    $name = $p.ProcessName.ToLowerInvariant()
    if ($name -in @('java', 'node')) {
      "Stopping PID $procId ($($p.ProcessName)) on port $port" | Out-Host
      try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch {}
    }
  }
}

function Wait-Port([int]$port, [int]$seconds = 240) {
  $deadline = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $iar = $client.BeginConnect("127.0.0.1", $port, $null, $null)
      $ok = $iar.AsyncWaitHandle.WaitOne(400)
      if ($ok -and $client.Connected) { $client.Close(); return $true }
      $client.Close()
    } catch {}
    Start-Sleep -Milliseconds 600
  }
  return $false
}

# ------------------------------------------------------------
#  Start a Spring Boot service via mvnw.cmd
# ------------------------------------------------------------
function Start-Svc([string]$name, [string]$dir) {
  if (-not (Test-Path -LiteralPath $dir)) {
    "SKIP $name (directory not found: $dir)" | Out-Host
    return
  }

  $mvnw = Join-Path $dir "mvnw.cmd"
  if (-not (Test-Path -LiteralPath $mvnw)) {
    "SKIP $name (mvnw.cmd not found in $dir)" | Out-Host
    return
  }

  $out = Join-Path $logs "$name.log"
  $err = Join-Path $logs "$name.err.log"
  Remove-Item -Force -LiteralPath $out, $err -ErrorAction SilentlyContinue

  "Starting $name (Java) ... log: $out" | Out-Host

  Start-Process -WindowStyle Hidden `
                -WorkingDirectory $dir `
                -FilePath "cmd.exe" `
                -ArgumentList "/c", "mvnw.cmd", "spring-boot:run" `
                -RedirectStandardOutput $out `
                -RedirectStandardError $err | Out-Null
}

# ------------------------------------------------------------
#  Start a Node.js service via npm start
# ------------------------------------------------------------
function Start-NodeSvc([string]$name, [string]$dir) {
  if (-not (Test-Path -LiteralPath $dir)) {
    "SKIP $name (directory not found: $dir)" | Out-Host
    return
  }

  $pkg = Join-Path $dir "package.json"
  if (-not (Test-Path -LiteralPath $pkg)) {
    "SKIP $name (package.json not found in $dir)" | Out-Host
    return
  }

  $out = Join-Path $logs "$name.log"
  $err = Join-Path $logs "$name.err.log"
  Remove-Item -Force -LiteralPath $out, $err -ErrorAction SilentlyContinue

  # Install deps if missing
  if (-not (Test-Path -LiteralPath (Join-Path $dir "node_modules"))) {
    "Installing $name npm dependencies (first time)..." | Out-Host
    Push-Location -LiteralPath $dir
    try {
      & npm install
    } finally {
      Pop-Location
    }
  }

  "Starting $name (Node.js) ... log: $out" | Out-Host

  Start-Process -WindowStyle Hidden `
                -WorkingDirectory $dir `
                -FilePath "cmd.exe" `
                -ArgumentList "/c", "npm", "start" `
                -RedirectStandardOutput $out `
                -RedirectStandardError $err | Out-Null
}

# ------------------------------------------------------------
#  Start the Angular frontend
# ------------------------------------------------------------
function Start-Frontend() {
  $dir = Join-Path $root "Frontend"
  if (-not (Test-Path -LiteralPath $dir)) {
    "SKIP Frontend (directory not found)" | Out-Host
    return
  }

  $out = Join-Path $logs "Frontend.log"
  $err = Join-Path $logs "Frontend.err.log"
  Remove-Item -Force -LiteralPath $out, $err -ErrorAction SilentlyContinue
  "Starting Frontend ... log: $out" | Out-Host

  if (-not (Test-Path -LiteralPath (Join-Path $dir "node_modules"))) {
    "Installing Frontend npm dependencies (first time)..." | Out-Host
    Push-Location -LiteralPath $dir
    try {
      & npm ci
    } finally {
      Pop-Location
    }
  }

  Start-Process -WindowStyle Hidden `
                -WorkingDirectory $dir `
                -FilePath "cmd.exe" `
                -ArgumentList "/c", "npx", "ng", "serve", "--host", "127.0.0.1", "--port", "4200" `
                -RedirectStandardOutput $out `
                -RedirectStandardError $err | Out-Null
}

# ------------------------------------------------------------
#  1. Free up ports
# ------------------------------------------------------------
foreach ($p in @(8888, 8761, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 4200)) {
  Stop-PortIfSafe $p
}

# ------------------------------------------------------------
#  2. Infrastructure (sequential, order matters)
# ------------------------------------------------------------
"=== [1/3] Starting infrastructure ===" | Out-Host

Start-Svc "config-server" (Join-Path $root "Backend\infrastructure\config-server")
$ok = Wait-Port 8888 300
"READY config-server port=8888 ok=$ok" | Out-Host

Start-Svc "discovery-service" (Join-Path $root "Backend\infrastructure\discovery-service")
$ok = Wait-Port 8761 300
"READY discovery-service port=8761 ok=$ok" | Out-Host

Start-Svc "api-gateway" (Join-Path $root "Backend\infrastructure\api-gateway")
$ok = Wait-Port 8080 300
"READY api-gateway port=8080 ok=$ok" | Out-Host

# ------------------------------------------------------------
#  3. Business microservices
# ------------------------------------------------------------
"=== [2/3] Starting business microservices ===" | Out-Host

# Node.js user-service (différent des autres !)
Start-NodeSvc "user-service" (Join-Path $root "Backend\services\user-service")
Start-NodeSvc "notification-service" (Join-Path $root "Backend\services\notification-service")

# Spring Boot services
Start-Svc "appointment-service"  (Join-Path $root "Backend\services\appointment-service")
Start-Svc "assurance-service"    (Join-Path $root "Backend\services\assurance-service")
Start-Svc "billing-service"      (Join-Path $root "Backend\services\billing-service")
Start-Svc "exam-service"         (Join-Path $root "Backend\services\exam-service")
Start-Svc "pharmacy-service"     (Join-Path $root "Backend\services\pharmacy-service")
Start-Svc "room-service"         (Join-Path $root "Backend\services\room-service")

$services = @(
  @{ name = "user-service";         port = 8081 },
  @{ name = "appointment-service";  port = 8082 },
  @{ name = "assurance-service";    port = 8083 },
  @{ name = "billing-service";      port = 8084 },
  @{ name = "exam-service";         port = 8085 },
  @{ name = "notification-service"; port = 8086 },
  @{ name = "pharmacy-service";     port = 8087 },
  @{ name = "room-service";         port = 8088 }
)

foreach ($s in $services) {
  $ok = Wait-Port $s.port 300
  "READY $($s.name) port=$($s.port) ok=$ok" | Out-Host
}

# ------------------------------------------------------------
#  4. Frontend
# ------------------------------------------------------------
"=== [3/3] Starting frontend ===" | Out-Host
Start-Frontend
$ok = Wait-Port 4200 300
"READY Frontend port=4200 ok=$ok" | Out-Host

# ------------------------------------------------------------
#  Done
# ------------------------------------------------------------
""                                                     | Out-Host
"========================================="            | Out-Host
"  All services launched"                              | Out-Host
"========================================="            | Out-Host
"Config Server : http://localhost:8888"                | Out-Host
"Eureka        : http://localhost:8761"                | Out-Host
"API Gateway   : http://localhost:8080"                | Out-Host
"User Service  : http://localhost:8081  (Node)"        | Out-Host
"Notification Service : http://localhost:8086  (Node)" | Out-Host
"Frontend (UI) : http://localhost:4200"                | Out-Host
""                                                     | Out-Host
"Logs folder   : $logs"                                | Out-Host