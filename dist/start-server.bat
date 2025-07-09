@echo off
echo Starting Standaardwerk TIA Portal Converter with local server...
echo.
echo Checking if Python is available...
python --version >nul 2>&1
if %errorlevel%==0 (
    echo Starting Python HTTP server on port 8000...
    echo Open your browser and go to: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop the server
    python -m http.server 8000
) else (
    echo Python not found. Trying Node.js...
    node --version >nul 2>&1
    if %errorlevel%==0 (
        echo Starting Node.js HTTP server on port 8000...
        echo Open your browser and go to: http://localhost:8000
        echo.
        echo Press Ctrl+C to stop the server
        npx http-server -p 8000
    ) else (
        echo Neither Python nor Node.js found. Opening file directly...
        start index.html
    )
)
pause