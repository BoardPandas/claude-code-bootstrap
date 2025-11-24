@echo off
REM
REM Stop Event Hook (Windows)
REM
REM Runs after Claude's response completes. Performs:
REM 1. Track file edits
REM 2. Auto-format modified files with Prettier
REM 3. Run build check on affected code
REM 4. Check for error handling patterns
REM
REM This implements the "no mess left behind" philosophy from the Reddit post.

setlocal enabledelayedexpansion

echo [Hook] Running post-response checks...
echo.

REM Get project root
set PROJECT_ROOT=%CD%
set LOG_DIR=%PROJECT_ROOT%\.claude\logs

REM Create log directory if it doesn't exist
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Timestamp for logs
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

REM
REM 1. TRACK FILE EDITS
REM
echo [1/4] Tracking file edits...

REM Get list of modified files
git diff --name-only > "%TEMP%\modified_files.txt" 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f %%i in ('type "%TEMP%\modified_files.txt" ^| find /c /v ""') do set FILE_COUNT=%%i
    if !FILE_COUNT! GTR 0 (
        type "%TEMP%\modified_files.txt" >> "%LOG_DIR%\file-edits-%TIMESTAMP%.log"
        echo [32m✓ Tracked !FILE_COUNT! modified files[0m
    ) else (
        echo [33mNo files modified[0m
    )
) else (
    echo [33mNot a git repository or no git available[0m
)

REM
REM 2. AUTO-FORMAT WITH PRETTIER
REM
echo.
echo [2/4] Auto-formatting modified files...

if exist "%TEMP%\modified_files.txt" (
    REM Filter for formattable files
    findstr /R "\.ts$ \.tsx$ \.js$ \.jsx$ \.json$ \.md$ \.yml$ \.yaml$" "%TEMP%\modified_files.txt" > "%TEMP%\formattable_files.txt" 2>nul

    if exist "%TEMP%\formattable_files.txt" (
        for /f "usebackq delims=" %%f in ("%TEMP%\formattable_files.txt") do (
            if exist "%%f" (
                echo   Formatting: %%f
                call npx prettier --write "%%f" >nul 2>&1
                if errorlevel 1 echo     [33mWarning: Failed to format %%f[0m
            )
        )
        echo [32m✓ Formatted files with Prettier[0m
    ) else (
        echo [33mNo formattable files to process[0m
    )
) else (
    echo [33mNo files to format[0m
)

REM
REM 3. BUILD CHECK (TypeScript)
REM
echo.
echo [3/4] Checking TypeScript compilation...

if exist "%TEMP%\modified_files.txt" (
    findstr /R "\.ts$ \.tsx$" "%TEMP%\modified_files.txt" > "%TEMP%\ts_files.txt" 2>nul

    if exist "%TEMP%\ts_files.txt" (
        call npm run typecheck > "%LOG_DIR%\typecheck-%TIMESTAMP%.log" 2>&1
        if errorlevel 1 (
            echo [31m✗ TypeScript errors found[0m
            echo [33m  See: .claude\logs\typecheck-%TIMESTAMP%.log[0m
            echo [33m  Run '/build-and-fix' to resolve errors[0m
        ) else (
            echo [32m✓ TypeScript compilation successful[0m
        )
    ) else (
        echo [33mNo TypeScript files modified, skipping build check[0m
    )
) else (
    echo [33mNo files to check[0m
)

REM
REM 4. ERROR HANDLING PATTERNS CHECK
REM
echo.
echo [4/4] Checking error handling patterns...

if exist "%TEMP%\ts_files.txt" (
    set ISSUES_FOUND=0

    for /f "usebackq delims=" %%f in ("%TEMP%\ts_files.txt") do (
        if exist "%%f" (
            REM Check for async functions without try-catch
            findstr /R "async.*(" "%%f" >nul 2>&1
            if not errorlevel 1 (
                findstr /R "try {" "%%f" >nul 2>&1
                if errorlevel 1 (
                    echo [33m  ⚠ %%f: Async function without try-catch[0m
                    set /a ISSUES_FOUND+=1
                )
            )

            REM Check for fetch/API calls without error handling
            findstr /R "fetch\( axios\. pool\.query" "%%f" >nul 2>&1
            if not errorlevel 1 (
                findstr /R "try { \.catch\( catch \(" "%%f" >nul 2>&1
                if errorlevel 1 (
                    echo [33m  ⚠ %%f: API call without error handling[0m
                    set /a ISSUES_FOUND+=1
                )
            )

            REM Check for console.log in production code
            echo %%f | findstr /V ".test. .spec." >nul 2>&1
            if not errorlevel 1 (
                findstr "console\.log" "%%f" >nul 2>&1
                if not errorlevel 1 (
                    echo [33m  ⚠ %%f: Contains console.log (consider using proper logging)[0m
                )
            )
        )
    )

    if !ISSUES_FOUND! EQU 0 (
        echo [32m✓ No obvious error handling issues detected[0m
    )
) else (
    echo [33mNo TypeScript files to check[0m
)

REM
REM SUMMARY
REM
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [32mPost-response checks complete![0m
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Cleanup temp files
del "%TEMP%\modified_files.txt" 2>nul
del "%TEMP%\formattable_files.txt" 2>nul
del "%TEMP%\ts_files.txt" 2>nul

REM Cleanup old logs (keep last 20)
pushd "%LOG_DIR%" 2>nul
if not errorlevel 1 (
    for /f "skip=20 delims=" %%f in ('dir /b /o-d file-edits-*.log 2^>nul') do del "%%f" 2>nul
    for /f "skip=20 delims=" %%f in ('dir /b /o-d typecheck-*.log 2^>nul') do del "%%f" 2>nul
    popd
)

endlocal
exit /b 0
