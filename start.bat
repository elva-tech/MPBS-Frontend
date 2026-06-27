@echo off
echo ========================================
echo    MPBS Project Startup
echo ========================================
echo.

echo Starting servers...
powershell -ExecutionPolicy Bypass -File "%~dp0start.ps1"

pause
