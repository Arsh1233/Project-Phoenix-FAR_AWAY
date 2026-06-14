@echo off
REM =============================================================================
REM Project PHOENIX — Run All Services (Batch)
REM Double-click this file or run from command prompt
REM =============================================================================

title Project PHOENIX — Service Launcher
color 0B
cd /d "%~dp0"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           PROJECT PHOENIX — SERVICE LAUNCHER                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM ---------------------------------------------------------------------------
REM Install dependencies
REM ---------------------------------------------------------------------------
echo [1/7] Installing Python dependencies...

echo   → Backend...
cd backend
pip install -r requirements.txt --quiet >nul 2>&1
cd ..

echo   → AI/ML...
cd aiml
pip install -r requirements.txt --quiet >nul 2>&1
cd ..

echo   → Blockchain...
pip install fastapi uvicorn pydantic --quiet >nul 2>&1

echo   → Edge Agent...
cd edge-agent
pip install -r requirements.txt --quiet >nul 2>&1
cd ..

echo   → Demo dependencies...
pip install requests --quiet >nul 2>&1

echo   → Frontend...
cd frontend
if not exist "node_modules" (
    call npm install --silent >nul 2>&1
)
cd ..

echo   Done!
echo.

REM ---------------------------------------------------------------------------
REM Start services in separate windows
REM ---------------------------------------------------------------------------
echo [2/7] Starting Crypto Service (port 8080)...
start "PHOENIX - Crypto Service" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8080 --log-level info"

timeout /t 3 /nobreak >nul

echo [3/7] Starting AI/ML Service (port 8001)...
start "PHOENIX - AI/ML Service" cmd /k "cd /d %~dp0aiml && python -m uvicorn main_ai:app --host 0.0.0.0 --port 8001 --log-level info"

timeout /t 2 /nobreak >nul

echo [4/7] Starting Blockchain Service (port 8000)...
start "PHOENIX - Blockchain" cmd /k "cd /d %~dp0blockchain && python -m uvicorn api.gateway:app --host 0.0.0.0 --port 8000 --log-level info"

timeout /t 2 /nobreak >nul

echo [5/7] Starting Edge Agent (port 5000)...
start "PHOENIX - Edge Agent" cmd /k "cd /d %~dp0edge-agent && python app.py"

timeout /t 2 /nobreak >nul

echo [6/7] Starting Frontend (port 3000)...
start "PHOENIX - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 5 /nobreak >nul

REM ---------------------------------------------------------------------------
REM Summary
REM ---------------------------------------------------------------------------
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                  ALL SERVICES LAUNCHED                      ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  Frontend      → http://localhost:3000                       ║
echo ║  Edge Agent    → http://localhost:5000/health                ║
echo ║  Crypto API    → http://localhost:8080/health                ║
echo ║  AI/ML API     → http://localhost:8001/docs                  ║
echo ║  Blockchain    → http://localhost:8000/logs                   ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [7/7] Running Leak Simulation Demo in 5 seconds...
timeout /t 5 /nobreak >nul
echo.

python demo\leak_simulation.py

echo.
echo Press any key to STOP all services...
pause >nul

REM Kill all service windows
taskkill /FI "WINDOWTITLE eq PHOENIX - Crypto Service" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq PHOENIX - AI/ML Service" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq PHOENIX - Blockchain" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq PHOENIX - Edge Agent" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq PHOENIX - Frontend" /F >nul 2>&1

echo All services stopped.
