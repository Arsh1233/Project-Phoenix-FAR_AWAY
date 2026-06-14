# =============================================================================
# Project PHOENIX — Stop All Services (PowerShell)
# =============================================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "Stopping PHOENIX services..." -ForegroundColor Red
Write-Host ""

# Try to read saved PIDs
$pidFile = "$ROOT\.phoenix_pids.json"
if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile | ConvertFrom-Json
    foreach ($svc in @("crypto", "aiml", "blockchain", "edge", "frontend")) {
        $pid = $pids.$svc
        if ($pid) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "  Stopped $svc (PID: $pid)" -ForegroundColor Green
            } catch [System.Exception] {
                Write-Host "  $svc (PID: $pid) already stopped" -ForegroundColor DarkGray
            }
        }
    }
    Remove-Item $pidFile -Force
} else {
    Write-Host "  No PID file found. Killing by port..." -ForegroundColor Yellow
}

# Kill any processes on our ports (fallback)
$ports = @(8080, 8001, 8000, 5000, 3000)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        try {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "  Killed process on port $port (PID: $($conn.OwningProcess))" -ForegroundColor Green
        } catch [System.Exception] {
            Write-Host "  Port $port already free" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "All PHOENIX services stopped." -ForegroundColor Green
Write-Host ""
