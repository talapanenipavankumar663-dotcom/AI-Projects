@echo off
setlocal

cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo Python was not found. Please install Python and run setup again.
    exit /b 1
)

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing dependencies...
pip install -r requirements.txt

if not exist .env (
    echo Creating .env template...
    (
        echo TWILIO_ACCOUNT_SID=your_twilio_account_sid
        echo TWILIO_AUTH_TOKEN=your_twilio_auth_token
        echo TWILIO_PHONE_NUMBER=+15551234567
        echo OPENAI_API_KEY=your_openai_api_key
        echo APP_BASE_URL=http://127.0.0.1:5000
        echo FLASK_HOST=0.0.0.0
        echo FLASK_PORT=5000
    ) > .env
)

echo Setup complete. Please update .env with your credentials.
pause
