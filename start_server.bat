@echo off
title Fatama Fighting Dragons - Local Server
cd /d "%~dp0"

:: Check if python is accessible
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found on your PATH.
    echo Please ensure Python is installed.
    pause
    exit /b 1
)

:: Run server.py which starts the server on an available port and opens the browser
python server.py
pause
