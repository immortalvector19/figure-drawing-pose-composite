@echo off
setlocal
cd /d "%~dp0"

if "%~1"=="" (
    echo ========================================================
    echo   Pose Shape Composite - Quick Test Runner
    echo ========================================================
    echo   No image provided. Running on default 'reference.jpg'...
    echo ========================================================
    python pose_shape_composite.py reference.jpg assets/male -o test_run.png
    if %errorlevel% equ 0 (
        start "" test_run.png
    )
    goto :end
)

echo ========================================================
echo   Processing image: %~nx1
echo ========================================================
python pose_shape_composite.py "%~1" assets/ --gender auto -o "%~dpn1_composite.png"
if %errorlevel% equ 0 (
    echo [Success] Opening composite result...
    start "" "%~dpn1_composite.png"
) else (
    echo [Error] Pose detection or assembly failed.
)

:end
