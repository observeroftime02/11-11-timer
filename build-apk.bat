@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo   Next 11:11 ^& 4:20 World Clock - Windows APK Builder
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
    echo [1/5] node_modules missing. Installing npm dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
) else (
    echo [1/5] Node dependencies found.
)

:: 3. Check/Add Android platform via Capacitor
if not exist "android\" (
    echo [2/5] Initializing Android Capacitor platform...
    call npx cap add android
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to add Android platform via Capacitor.
        pause
        exit /b 1
    )
) else (
    echo [2/5] Android directory found.
)

:: 4. Build web app, generate chimes, sync capacitor, and inject widgets
echo [3/5] Building React app, generating chime audio, and injecting native widgets...
call npm run build:apk
if %errorlevel% neq 0 (
    echo [ERROR] Build and widget injection step failed.
    pause
    exit /b 1
)

:: 5. Navigate to android directory and compile debug APK via Gradle
echo [4/5] Compiling Android Debug APK with Gradle...
cd android
if not exist "gradlew.bat" (
    echo [ERROR] gradlew.bat not found in android directory.
    cd ..
    pause
    exit /b 1
)

call gradlew.bat clean assembleDebug
if %errorlevel% neq 0 (
    echo [ERROR] Gradle APK compilation failed.
    cd ..
    pause
    exit /b 1
)

cd ..

:: 6. Check if APK was generated successfully
set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"
if exist "%APK_PATH%" (
    echo.
    echo =======================================================
    echo   BUILD SUCCESSFUL!
    echo =======================================================
    echo   Debug APK location:
    echo   %CD%\%APK_PATH%
    echo.
    
    :: Optional: Check if ADB is available and prompt to install
    where adb >nul 2>nul
    if %errorlevel% equ 0 (
        echo   [ADB Detected]
        set /p INSTALL_CHOICE="Do you want to install the APK to your connected device/emulator now? (Y/N): "
        if /i "!INSTALL_CHOICE!"=="Y" (
            echo   Installing APK to device...
            adb install -r "%APK_PATH%"
            if !errorlevel! equ 0 (
                echo   [SUCCESS] App installed on device!
            ) else (
                echo   [WARNING] ADB installation failed. Check device USB connection and permissions.
            )
        )
    )
) else (
    echo [ERROR] APK file was not found at expected location: %APK_PATH%
)

echo.
pause
