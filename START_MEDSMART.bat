@echo off
title MedSmart Integrated System - AI + Backend
color 0A

echo ==================================================
echo      MEDSMART MEDICAL SYSTEM - INITIALIZING
echo ==================================================
echo.

:: 1. AI Service Start (Python FastAPI on port 8000)
echo [1/2] AI xizmati (Python FastAPI) fonda ishga tushirilmoqda...
echo       URL: http://localhost:8000
echo       Docs: http://localhost:8000/docs
start "MedSmart AI Service" cmd /k "cd /d %~dp0ai_service && python run.py"

:: Wait 3 seconds for AI service to initialize
timeout /t 3 /nobreak > nul

echo.
:: 2. Node.js Backend Start  
echo [2/2] Backend server (Node.js) ishga tushirilmoqda...
echo       URL: http://localhost:5000
echo.
cd /d %~dp0backend
npm start

pause
