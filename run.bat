@echo off
echo ========================================================
echo Starting Student Mental Health Prediction Web Server...
echo ========================================================
echo.
echo URL: http://127.0.0.1:8000/
echo Press CTRL+C to stop the server.
echo.
.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
