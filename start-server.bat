@echo off
title KandaLedger Local Server
cd /d "%~dp0"
echo ==========================================
echo    KandaLedger - Local Server
echo    URL: http://localhost:5500
echo    (Close this window to stop the server)
echo ==========================================
echo.
npx --yes live-server --port=5500 .
pause
