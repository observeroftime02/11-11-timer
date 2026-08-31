@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo   Next 11:11 - Google Play Release Bundle Builder (.aab)
echo =======================================================
echo.

:: 1. Check if node and npm are available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH. Please install Node.js.
    pause
    exit /b 1
)

:: 2. Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo [1/4] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: 3. Re-initialize / sync Android
if not exist "android\" (
    echo [2/4] Initializing Android Capacitor platform...
    call npx cap add android
)

echo [3/4] Building web application and injecting native assets...
call npm run build:apk
if %errorlevel% neq 0 (
    echo [ERROR] Web build and asset injection failed.
    pause
    exit /b 1
)

:: 4. Build Release App Bundle via Gradle
echo [4/4] Compiling Release Android App Bundle (.aab)...
cd android
if not exist "gradlew.bat" (
    echo [ERROR] gradlew.bat not found in android directory.
    cd ..
    pause
    exit /b 1
)

call gradlew.bat clean bundleRelease
if %errorlevel% neq 0 (
    echo [ERROR] Gradle bundle compilation failed.
    cd ..
    pause
    exit /b 1
)

cd ..

set "AAB_PATH=android\app\build\outputs\bundle\release\app-release.aab"
set "UNSIGNED_AAB_PATH=android\app\build\outputs\bundle\release\app-release-unsigned.aab"

echo.
echo =======================================================
if exist "%AAB_PATH%" (
    echo   BUILD SUCCESSFUL!
    echo   Release Bundle: %CD%\%AAB_PATH%
) else if exist "%UNSIGNED_AAB_PATH%" (
    echo   BUILD SUCCESSFUL (Unsigned)!
    echo   Release Bundle: %CD%\%UNSIGNED_AAB_PATH%
    echo   Note: Sign with your keystore or let Google Play App Signing manage it.
) else (
    echo   Check android\app\build\outputs\bundle\release\ for generated .aab
)
echo =======================================================
echo.
pause
