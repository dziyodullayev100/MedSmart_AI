@echo off
setlocal
cd /d "%~dp0"

echo 1. Backend...
start "MedSmart Backend" cmd /c "cd /d "%~dp0backend" && node server.js"

echo 2. AI Service...
start "MedSmart AI" cmd /c "cd /d "%~dp0ai_service" && uvicorn api:app --reload --port 8000"

echo 3. Frontend...
start "MedSmart Frontend" cmd /c "cd /d "%~dp0frontend" && node server.js"

echo.
echo All services started. 
echo URL: http://localhost:3000
pause
