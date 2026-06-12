$ErrorActionPreference = 'Stop'

function Stop-ProcessByCommandLine {
    param(
        [Parameter(Mandatory = $true)] [string] $Filter,
        [Parameter(Mandatory = $true)] [string[]] $ProcessNames
    )

    $processes = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $ProcessNames -contains $_.Name -and $_.CommandLine -and ($_.CommandLine -match $Filter)
        }

    if (-not $processes) {
        return
    }

    foreach ($process in $processes) {
        try {
            Write-Host "Stopping PID $($process.ProcessId): $($process.Name)  `n    $($process.CommandLine)"
            Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
        }
        catch {
            Write-Warning "Unable to stop PID $($process.ProcessId): $_"
        }
    }
}

Write-Host 'Stopping Mediflow services...'

$filters = @(
    'mvnw\.cmd\s+spring-boot:run',
    'mvnw\s+spring-boot:run',
    'spring-boot:run',
    'ng\s+serve',
    'npm\s+start',
    'run-mediflow-services\.ps1'
)

foreach ($filter in $filters) {
    Stop-ProcessByCommandLine -Filter $filter -ProcessNames @('powershell.exe', 'pwsh.exe', 'cmd.exe', 'node.exe', 'java.exe')
}

Write-Host 'Recherche et arrêt des processus Java/VB liés à Spring Boot...'
Stop-ProcessByCommandLine -Filter 'spring-boot' -ProcessNames @('java.exe')

Write-Host 'Arrêt terminé. Si des fenêtres PowerShell restent ouvertes, vous pouvez les fermer manuellement.'
