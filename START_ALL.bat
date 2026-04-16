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

echo.
echo  Test qilmoqchimisiz?
set /p run_tests="[Y/N] Testlarni ishga tushirish: "
if /i "%run_tests%"=="Y" (
    echo.
    echo  Python testlar...
    python run_test_wrapper.py
    echo.
    echo  Backend testlar...
    timeout /t 3 /nobreak >nul
    cd backend
    node scripts/testE2E.js
    cd ..
)

pause
