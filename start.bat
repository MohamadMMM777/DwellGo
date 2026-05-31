@echo off
setlocal enabledelayedexpansion
title DwellGo - Starting...
color 0A

echo.
echo  ================================================================
echo    ^<^>  DWELLGO - PROJECT STARTER
echo  ================================================================
echo.

:: Set base directory
set "BASE=%~dp0"
cd /d "%BASE%"

:: ── 1. Check Node.js ──────────────────────────────────────────────
echo  [1/5] Checking Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Node.js not found! Please install Node.js first.
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)
echo        Node.js OK ^<^>

:: ── 2. Install Backend dependencies ───────────────────────────────
echo  [2/5] Checking Backend dependencies...
if not exist "api\node_modules\" (
    echo        Installing backend packages...
    cd api && call npm install && cd ..
    echo        Backend packages installed ^<^>
) else (
    echo        Backend packages OK ^<^>
)

:: ── 3. Install Frontend dependencies ──────────────────────────────
echo  [3/5] Checking Frontend dependencies...
if not exist "client\node_modules\" (
    echo        Installing frontend packages...
    cd client && call npm install && cd ..
    echo        Frontend packages installed ^<^>
) else (
    echo        Frontend packages OK ^<^>
)

:: ── 4. Database setup (Prisma) ─────────────────────────────────────
echo  [4/5] Setting up database...
cd api
if not exist "prisma\dev.db" (
    echo        Database not found - creating and migrating...
    call npx prisma migrate dev --name init --skip-generate
    echo        Database created ^<^>
)
echo        Syncing Prisma client...
call npx prisma generate >nul 2>&1
cd ..
echo        Database ready ^<^>

:: ── 5. Launch all services ─────────────────────────────────────────
echo  [5/5] Launching all services...
echo.

:: Start Backend API
start "DwellGo - Backend API" cmd /k "title DwellGo - Backend API (Port 4000) && color 0B && cd /d "%BASE%api" && echo. && echo  Backend API is starting on http://localhost:4000 && echo. && node index.js"

:: Wait a moment
timeout /t 2 /nobreak >nul

:: Start Frontend
start "DwellGo - Frontend" cmd /k "title DwellGo - Frontend (Port 5173) && color 0E && cd /d "%BASE%client" && echo. && echo  Frontend is starting on http://localhost:5173 && echo. && npm run dev"

:: Wait a moment
timeout /t 2 /nobreak >nul

:: Start Prisma Studio (Database Viewer)
start "DwellGo - Database Studio" cmd /k "title DwellGo - Database Studio (Port 5555) && color 0D && cd /d "%BASE%api" && echo. && echo  Prisma Studio is starting on http://localhost:5555 && echo. && npx prisma studio"

echo.
echo  ================================================================
echo    All services are starting...
echo.
echo    [*] Backend  API :  http://localhost:4000
echo    [*] Frontend App :  http://localhost:5173
echo    [*] Database View:  http://localhost:5555
echo  ================================================================
echo.
echo  Opening browser in 8 seconds...
timeout /t 8 /nobreak >nul

:: Open all in browser
start http://localhost:5173
timeout /t 1 /nobreak >nul
start http://localhost:5555

echo.
echo  ================================================================
echo    DwellGo is running!
echo    To STOP the project, run: stop.bat
echo  ================================================================
echo.
pause >nul
