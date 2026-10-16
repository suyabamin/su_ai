@echo off
echo ===================================================
echo             SuAI - Change API Key
echo ===================================================
echo.
set /p NEW_KEY="Paste your new API key here and press Enter: "

if "%NEW_KEY%"=="" (
    echo [ERROR] Key cannot be empty!
    pause
    exit /b
)

(
echo # Google Gemini API Key from Google AI Studio
echo GEMINI_API_KEY=%NEW_KEY%
echo.
echo # Supported model ID
echo GEMINI_MODEL=gemini-2.5-flash
echo.
echo # Frontend Allowed Origin
echo FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
) > "%~dp0backend\.env"

echo.
echo ===================================================
echo [SUCCESS] API key updated successfully in backend\.env!
echo ===================================================
echo Restart the backend server if it was already running.
echo.
pause
