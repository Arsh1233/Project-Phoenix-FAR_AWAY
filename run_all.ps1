# =============================================================================
# Project PHOENIX - Run All Services (PowerShell)
# =============================================================================
# Usage: .\run_all.ps1
#        .\run_all.ps1 -SkipInstall    (skip pip/npm install)
#        .\run_all.ps1 -DemoOnly       (only run leak simulation demo)
# =============================================================================

param(
    [switch]$SkipInstall,
    [switch]$DemoOnly
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "           PROJECT PHOENIX - SERVICE LAUNCHER                 " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

function Test-Command($cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

Write-Host "[PRE-FLIGHT] Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Command "python")) {
    Write-Host "  [X] Python not found." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Python found" -ForegroundColor Green

if (-not (Test-Command "node")) {
    Write-Host "  [X] Node.js not found." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Node.js found" -ForegroundColor Green

if (-not $SkipInstall -and -not $DemoOnly) {
    Write-Host "[1/6] Installing dependencies..." -ForegroundColor Yellow

    Write-Host "  -> Backend (Crypto Service)..." -ForegroundColor DarkGray
    Push-Location "$ROOT\backend"
    pip install -r requirements.txt --quiet 2>&1 | Out-Null
    Pop-Location

    Write-Host "  -> AI/ML Service..." -ForegroundColor DarkGray
    Push-Location "$ROOT\aiml"
    pip install -r requirements.txt --quiet 2>&1 | Out-Null
    Pop-Location

    Write-Host "  -> Blockchain Service..." -ForegroundColor DarkGray
    pip install fastapi uvicorn pydantic --quiet 2>&1 | Out-Null

    Write-Host "  -> Edge Agent..." -ForegroundColor DarkGray
    Push-Location "$ROOT\edge-agent"
    pip install -r requirements.txt --quiet 2>&1 | Out-Null
    Pop-Location

    Write-Host "  -> Frontend..." -ForegroundColor DarkGray
    Push-Location "$ROOT\frontend"
    if (-not (Test-Path "node_modules")) {
        npm install --silent 2>&1 | Out-Null
    }
    Pop-Location
    Write-Host ""
}

if ($DemoOnly) {
    Write-Host "[DEMO] Running leak simulation..." -ForegroundColor Yellow
    pip install requests --quiet 2>&1 | Out-Null
    python "$ROOT\demo\leak_simulation.py"
    exit 0
}

Write-Host "[2/6] Starting Crypto Service (port 8080)..." -ForegroundColor Yellow
$crypto = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "info" -WorkingDirectory "$ROOT\backend" -PassThru -NoNewWindow:$false
Start-Sleep -Seconds 2

Write-Host "[3/6] Starting AI/ML Service (port 8001)..." -ForegroundColor Yellow
$aiml = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "main_ai:app", "--host", "0.0.0.0", "--port", "8001", "--log-level", "info" -WorkingDirectory "$ROOT\aiml" -PassThru -NoNewWindow:$false
Start-Sleep -Seconds 1

Write-Host "[4/6] Starting Blockchain Service (port 8000)..." -ForegroundColor Yellow
$blockchain = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "api.gateway:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info" -WorkingDirectory "$ROOT\blockchain" -PassThru -NoNewWindow:$false
Start-Sleep -Seconds 1

Write-Host "[5/6] Starting Edge Agent (port 5000)..." -ForegroundColor Yellow
$edge = Start-Process -FilePath "python" -ArgumentList "app.py" -WorkingDirectory "$ROOT\edge-agent" -PassThru -NoNewWindow:$false
Start-Sleep -Seconds 1

Write-Host "[6/6] Starting Frontend (port 3000)..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm run dev" -WorkingDirectory "$ROOT\frontend" -PassThru

Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "                  ALL SERVICES LAUNCHED                       " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  Frontend      -> http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Edge Agent    -> http://localhost:5000/health" -ForegroundColor Cyan
Write-Host "  Crypto API    -> http://localhost:8080/health" -ForegroundColor Cyan
Write-Host "  AI/ML API     -> http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host "  Blockchain    -> http://localhost:8000/logs" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$pids = [PSCustomObject]@{
    crypto = $crypto.Id; aiml = $aiml.Id; blockchain = $blockchain.Id; edge = $edge.Id; frontend = $frontend.Id
}
$pids | ConvertTo-Json | Out-File "$ROOT\.phoenix_pids.json" -Encoding UTF8

Write-Host "Press Enter to stop all services..." -ForegroundColor Yellow
Read-Host

Write-Host "Stopping all services..." -ForegroundColor Yellow
Stop-Process -Id $crypto.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $aiml.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $blockchain.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $edge.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue

Get-NetTCPConnection -LocalPort 8080,8001,8000,5000,3000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host "All services stopped." -ForegroundColor Green
