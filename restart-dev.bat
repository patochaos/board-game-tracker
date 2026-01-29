@echo off
echo ========================================
echo   Restarting Development Server
echo ========================================
echo.

echo [1/4] Killing Node processes...
taskkill /F /IM node.exe >nul 2>&1
echo       Done.

echo [2/4] Freeing port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo       Done.

echo [3/4] Cleaning .next folder...
if exist ".next" rmdir /s /q ".next" >nul 2>&1
echo       Done.

echo [4/4] Starting dev server...
echo.
echo ========================================
echo   Server starting on http://localhost:3000
echo   Press Ctrl+C to stop
echo ========================================
echo.

npm run dev
