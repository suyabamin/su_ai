@echo off
echo ===================================================
echo             SuAI - API Key Configuration
echo ===================================================
echo.
echo Tip: You can paste ONE key or MULTIPLE keys separated by commas
echo (e.g. AIzaSyKey1...,AIzaSyKey2...) for automatic rotation.
echo.
set /p NEW_KEY="Paste API key(s) here and press Enter: "

if "%NEW_KEY%"=="" (
    echo [ERROR] Key cannot be empty!
    pause
    exit /b
)

(
echo # Google Gemini API Key from Google AI Studio
echo # Supports multiple comma-separated keys for automatic rotation
echo GEMINI_API_KEY=%NEW_KEY%
echo.
echo # Supported model ID
echo GEMINI_MODEL=gemini-3.8-flash
) > "%~dp0.env"

if exist "%~dp0backend" (
    copy "%~dp0.env" "%~dp0backend\.env" >nul
)

echo.
echo ===================================================
echo [SUCCESS] API key(s) updated successfully in .env!
echo ===================================================
echo For local development, run: npm run dev
echo For Vercel production, set GEMINI_API_KEY in Vercel Project Settings.
echo.
pause
