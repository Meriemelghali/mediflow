$ErrorActionPreference = "Stop"

function Start-MediflowService {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$WorkingDir,
        [Parameter(Mandatory = $true)][string]$Command
    )

    if (-not (Test-Path -LiteralPath $WorkingDir)) {
        throw "Directory not found: $WorkingDir"
    }

    Write-Host "Starting $Name ..."
    Start-Process -FilePath "powershell.exe" `
        -WorkingDirectory $WorkingDir `
        -ArgumentList @(
            "-NoExit",
            "-Command",
            "$Command"
        )
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$discoveryDir = Join-Path $root "Backend\infrastructure\discovery-service"
$configDir    = Join-Path $root "Backend\infrastructure\config-server"
$gatewayDir   = Join-Path $root "Backend\infrastructure\api-gateway"
$patientDir   = Join-Path $root "Backend\services\patient-service"
$assuranceDir = Join-Path $root "Backend\services\assurance-service"

Start-MediflowService -Name "discovery-service (Eureka) :8761" -WorkingDir $discoveryDir -Command ".\mvnw.cmd spring-boot:run"
Start-Sleep -Seconds 3

Start-MediflowService -Name "config-server :8888" -WorkingDir $configDir -Command ".\mvnw.cmd spring-boot:run"
Start-Sleep -Seconds 3

Start-MediflowService -Name "patient-service (mock) :random" -WorkingDir $patientDir -Command ".\mvnw.cmd spring-boot:run"
Start-Sleep -Seconds 3

Start-MediflowService -Name "api-gateway :8080" -WorkingDir $gatewayDir -Command ".\mvnw.cmd spring-boot:run"
Start-Sleep -Seconds 3

Start-MediflowService -Name "assurance-service :random" -WorkingDir $assuranceDir -Command ".\mvnw.cmd spring-boot:run"

Write-Host ""
Write-Host "Services launched in separate PowerShell windows."
Write-Host "Eureka: http://localhost:8761"
Write-Host "Gateway: http://localhost:8080"
