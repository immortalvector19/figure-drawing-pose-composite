@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

:: Use direct Python 3.13 executable if found
set "PY=python"
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    set "PY=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
)

if "%~1"=="" (
    echo ========================================================
    echo   Pose Shape Composite - Quick Test Runner
    echo ========================================================
    echo   No image provided. Running on default 'reference.jpg'...
    echo ========================================================
    "%PY%" pose_shape_composite.py reference.jpg assets/male -o reference_composite.png
    if !errorlevel! equ 0 (
        echo [Success] Opening composite result in browser...
        if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
            start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "%~dp0reference_composite.png"
        ) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
            start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "%~dp0reference_composite.png"
        ) else (
            start "" mspaint "%~dp0reference_composite.png"
        )
    )
    goto :end
)

echo ========================================================
echo   Processing image: %~nx1
echo ========================================================
set "OUT_FILE=%~dpn1_composite.png"
"%PY%" pose_shape_composite.py "%~1" assets/ --gender auto -o "!OUT_FILE!"
if !errorlevel! equ 0 (
    echo [Success] Opening composite result...
    if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
        start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "!OUT_FILE!"
    ) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
        start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "!OUT_FILE!"
    ) else (
        start "" mspaint "!OUT_FILE!"
    )
) else (
    echo [Error] Pose detection or assembly failed.
    pause
)

:end
