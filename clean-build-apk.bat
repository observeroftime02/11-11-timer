@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo   Next 11:11 ^& 4:20 - Clean Rebuild ^& APK Compiler
echo =======================================================
echo.

echo [1/4] Stopping running Gradle daemons (if any)...
if exist "android\gradlew.bat" (
    cd android
    call gradlew.bat --stop >nul 2>nul
    cd ..
)

echo [2/4] Wiping previous build artifacts (dist, android, .vite)...
if exist "dist\" rmdir /s /q "dist"
if exist "android\" rmdir /s /q "android"
if exist "node_modules\.vite\" rmdir /s /q "node_modules\.vite"

echo [3/4] Re-initializing Capacitor Android platform...
call npx cap add android
if %errorlevel% neq 0 (
    echo [ERROR] Failed to add Android platform.
    pause
    exit /b 1
)

echo [4/4] Building web app, injecting native widgets, and compiling APK...
call npm run build:apk
if %errorlevel% neq 0 (
    echo [ERROR] Build and widget injection step failed.
    pause
    exit /b 1
)

cd android
call gradlew.bat clean assembleDebug
if %errorlevel% neq 0 (
    echo [ERROR] Gradle compilation failed.
    cd ..
    pause
    exit /b 1
)
cd ..

set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"
if exist "%APK_PATH%" (
    echo.
    echo =======================================================
    echo   CLEAN BUILD SUCCESSFUL!
    echo =======================================================
    echo   APK Path: %CD%\%APK_PATH%
    echo.
    where adb >nul 2>nul
    if %errorlevel% equ 0 (
        set /p INSTALL_CHOICE="Do you want to install the APK to your connected device/emulator now? (Y/N): "
        if /i "!INSTALL_CHOICE!"=="Y" (
            echo   Installing APK to device...
            adb install -r "%APK_PATH%"
            if !errorlevel! equ 0 (
                echo   [SUCCESS] App installed on device!
            ) else (
                echo   [WARNING] ADB installation failed.
            )
        )
    )
)

echo.
pause
