@echo off
REM
REM Stop Event Hook (Windows)
REM
REM Runs after Claude's response completes. Performs:
REM 1. Track file edits
REM 2. Auto-format modified files (detects formatter)
REM 3. Run build/type check (detects build system)
REM 4. Check for error handling patterns
REM
REM Multi-stack: auto-detects Node.js, Python, Go, Rust projects.

setlocal enabledelayedexpansion

echo [Hook] Running post-response checks...
echo.

REM Get project root
set PROJECT_ROOT=%CD%
set HOOK_DIR=%PROJECT_ROOT%\.claude\hooks
set LOG_DIR=%PROJECT_ROOT%\.claude\logs

REM Create log directory if it doesn't exist
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Timestamp for logs
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set datetime=%%I
if defined datetime (
    set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
) else (
    set TIMESTAMP=unknown
)

set ISSUES_FOUND=0

REM
REM 1. TRACK FILE EDITS
REM
echo [1/4] Tracking file edits...

git diff --name-only > "%TEMP%\claude_modified_files.txt" 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f %%i in ('type "%TEMP%\claude_modified_files.txt" ^| find /c /v ""') do set FILE_COUNT=%%i
    if !FILE_COUNT! GTR 0 (
        type "%TEMP%\claude_modified_files.txt" >> "%LOG_DIR%\file-edits-%TIMESTAMP%.log"
        echo   Tracked !FILE_COUNT! modified files
    ) else (
        echo   No files modified
    )
) else (
    echo   Not a git repository or no git available
)

REM
REM 2. AUTO-FORMAT MODIFIED FILES
REM
echo.
echo [2/4] Auto-formatting modified files...

if exist "%TEMP%\claude_modified_files.txt" (
    REM Detect formatter: Node.js (Prettier)
    if exist "package.json" (
        findstr /R "\.ts$ \.tsx$ \.js$ \.jsx$ \.json$ \.md$ \.yml$ \.yaml$" "%TEMP%\claude_modified_files.txt" > "%TEMP%\claude_formattable.txt" 2>nul
        if exist "%TEMP%\claude_formattable.txt" (
            for /f "usebackq delims=" %%f in ("%TEMP%\claude_formattable.txt") do (
                if exist "%%f" (
                    call npx prettier --write "%%f" >nul 2>&1
                )
            )
            echo   Formatted with Prettier
        ) else (
            echo   No formattable files
        )
    ) else if exist "pyproject.toml" (
        REM Python: use Black
        findstr /R "\.py$" "%TEMP%\claude_modified_files.txt" > "%TEMP%\claude_py_files.txt" 2>nul
        if exist "%TEMP%\claude_py_files.txt" (
            for /f "usebackq delims=" %%f in ("%TEMP%\claude_py_files.txt") do (
                if exist "%%f" (
                    call black --quiet "%%f" 2>nul
                )
            )
            echo   Formatted with Black
        )
    ) else if exist "go.mod" (
        REM Go: use gofmt
        findstr /R "\.go$" "%TEMP%\claude_modified_files.txt" > "%TEMP%\claude_go_files.txt" 2>nul
        if exist "%TEMP%\claude_go_files.txt" (
            for /f "usebackq delims=" %%f in ("%TEMP%\claude_go_files.txt") do (
                if exist "%%f" (
                    gofmt -w "%%f" 2>nul
                )
            )
            echo   Formatted with gofmt
        )
    ) else (
        echo   No formatter detected
    )
) else (
    echo   No files to format
)

REM
REM 3. BUILD / TYPE CHECK
REM
echo.
echo [3/4] Running build check...

set BUILD_LOG=%LOG_DIR%\build-%TIMESTAMP%.log

if exist "package.json" (
    REM Node.js: try typecheck, then build
    findstr /C:"typecheck" package.json >nul 2>&1
    if not errorlevel 1 (
        call npm run typecheck > "%BUILD_LOG%" 2>&1
        if errorlevel 1 (
            echo   FAILED: TypeScript errors found
            echo   See: .claude\logs\build-%TIMESTAMP%.log
            echo   Run '/build-and-fix' to resolve
            set /a ISSUES_FOUND+=1
        ) else (
            echo   TypeScript type check passed
        )
    ) else (
        findstr /C:"build" package.json >nul 2>&1
        if not errorlevel 1 (
            call npm run build > "%BUILD_LOG%" 2>&1
            if errorlevel 1 (
                echo   FAILED: Build errors found
                set /a ISSUES_FOUND+=1
            ) else (
                echo   Build passed
            )
        ) else (
            echo   No build script found in package.json
        )
    )
) else if exist "pyproject.toml" (
    REM Python: run mypy
    where mypy >nul 2>&1
    if not errorlevel 1 (
        mypy . > "%BUILD_LOG%" 2>&1
        if errorlevel 1 (
            echo   FAILED: mypy errors found
            set /a ISSUES_FOUND+=1
        ) else (
            echo   mypy type check passed
        )
    ) else (
        echo   mypy not installed, skipping
    )
) else if exist "go.mod" (
    REM Go: run go build
    go build ./... > "%BUILD_LOG%" 2>&1
    if errorlevel 1 (
        echo   FAILED: Go build errors found
        set /a ISSUES_FOUND+=1
    ) else (
        echo   Go build passed
    )
) else if exist "Cargo.toml" (
    REM Rust: run cargo check
    cargo check > "%BUILD_LOG%" 2>&1
    if errorlevel 1 (
        echo   FAILED: Cargo check errors found
        set /a ISSUES_FOUND+=1
    ) else (
        echo   Cargo check passed
    )
) else (
    echo   No build system detected, skipping
)

REM
REM 4. ERROR HANDLING PATTERNS CHECK
REM
echo.
echo [4/4] Checking error handling patterns...

if exist "%TEMP%\claude_modified_files.txt" (
    where node >nul 2>&1
    if not errorlevel 1 (
        if exist "%HOOK_DIR%\utils\error-pattern-checker.js" (
            REM Collect code files
            findstr /R "\.ts$ \.tsx$ \.js$ \.jsx$ \.py$ \.go$" "%TEMP%\claude_modified_files.txt" > "%TEMP%\claude_code_files.txt" 2>nul
            if exist "%TEMP%\claude_code_files.txt" (
                set CODE_FILES=
                for /f "usebackq delims=" %%f in ("%TEMP%\claude_code_files.txt") do (
                    set CODE_FILES=!CODE_FILES! "%%f"
                )
                if defined CODE_FILES (
                    node "%HOOK_DIR%\utils\error-pattern-checker.js" !CODE_FILES! 2>nul
                )
            ) else (
                echo   No code files to check
            )
        ) else (
            echo   Error pattern checker not found
        )
    ) else (
        echo   Node.js not available, skipping error pattern check
    )
) else (
    echo   No files to check
)

REM
REM SUMMARY
REM
echo.
echo ----------------------------------------
if !ISSUES_FOUND! GTR 0 (
    echo Post-response checks complete ^(!ISSUES_FOUND! issue^(s^) found^)
) else (
    echo Post-response checks complete!
)
echo ----------------------------------------
echo.

REM Cleanup temp files
del "%TEMP%\claude_modified_files.txt" 2>nul
del "%TEMP%\claude_formattable.txt" 2>nul
del "%TEMP%\claude_py_files.txt" 2>nul
del "%TEMP%\claude_go_files.txt" 2>nul
del "%TEMP%\claude_code_files.txt" 2>nul

REM Cleanup old logs (keep last 20)
pushd "%LOG_DIR%" 2>nul
if not errorlevel 1 (
    for /f "skip=20 delims=" %%f in ('dir /b /o-d file-edits-*.log 2^>nul') do del "%%f" 2>nul
    for /f "skip=20 delims=" %%f in ('dir /b /o-d build-*.log 2^>nul') do del "%%f" 2>nul
    popd
)

endlocal
exit /b 0
