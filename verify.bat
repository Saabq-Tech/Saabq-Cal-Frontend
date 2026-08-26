@echo off
echo Running Frontend Pre-Commit Verification Routine...

echo.
echo [1/4] Formatting Frontend Code...
call npm run format
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend formatting failed.
    exit /b %errorlevel%
)

echo.
echo [2/4] Linting Frontend Code...
call npm run lint
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend linting failed.
    exit /b %errorlevel%
)

echo.
echo [3/4] Checking Frontend Translations...
call npm run lang:check
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend language check failed.
    exit /b %errorlevel%
)

echo.
echo [4/4] Running Frontend Tests...
call npm run test -- --run
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend tests failed.
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] All frontend verification steps passed!
exit /b 0
