@echo off
setlocal enabledelayedexpansion
title DwellGo - Stopping...
color 0C

echo.
echo  ================================================================
echo    [X] DWELLGO - PROJECT STOPPER
echo  ================================================================
echo.
echo  Shutting down all DwellGo services...
echo.

:: ── Kill by window title (CMD windows opened by start.bat) ─────────
echo  [1/3] Closing Backend API window...
taskkill /FI "WINDOWTITLE eq DwellGo - Backend API*" /F >nul 2>&1
echo        Done.

echo  [2/3] Closing Frontend window...
taskkill /FI "WINDOWTITLE eq DwellGo - Frontend*" /F >nul 2>&1
echo        Done.

echo  [3/3] Closing Database Studio window...
taskkill /FI "WINDOWTITLE eq DwellGo - Database Studio*" /F >nul 2>&1
echo        Done.

:: ── Kill any remaining Node.js processes on the used ports ─────────
echo.
echo  Killing any remaining Node.js processes on ports 4000, 5173, 5555...

:: Kill port 4000 (Backend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill port 5173 (Frontend / Vite)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill port 5555 (Prisma Studio)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5555 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo  All ports cleared.

echo.
echo  ================================================================
echo    DwellGo has been stopped successfully.
echo    To START the project again, run: start.bat
echo  ================================================================
echo.
timeout /t 3 /nobreak >nul
