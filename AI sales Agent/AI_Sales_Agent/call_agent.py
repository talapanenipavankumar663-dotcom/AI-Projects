import importlib
import os
import subprocess
import sys


def ensure_dependency(package_name: str, module_name: str | None = None) -> None:
    module_name = module_name or package_name
    try:
        importlib.import_module(module_name)
    except ModuleNotFoundError:
        print(f"Installing missing dependency: {package_name}")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
        importlib.import_module(module_name)


ensure_dependency("twilio", "twilio.rest")
ensure_dependency("python-dotenv", "dotenv")

from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

ACCOUNT_SID = (os.getenv("TWILIO_ACCOUNT_SID") or "").strip()
AUTH_TOKEN = (os.getenv("TWILIO_AUTH_TOKEN") or "").strip()
FROM_NUMBER = (os.getenv("TWILIO_PHONE_NUMBER") or "").strip()
APP_BASE_URL = (os.getenv("APP_BASE_URL") or "http://127.0.0.1:5000").strip()


def normalize_phone_number(number: str) -> str:
    number = number.strip().replace(" ", "")
    if not number:
        raise ValueError("Phone number cannot be empty.")
    if number.startswith("+"):
        return number
    if number.startswith("00"):
        return "+" + number[2:]
    if number.isdigit() and len(number) == 10:
        return "+91" + number
    if number.isdigit() and len(number) == 12 and number.startswith("91"):
        return "+" + number
    return number


def get_phone_number() -> str:
    if len(sys.argv) >= 2:
        return normalize_phone_number(sys.argv[1])
    return normalize_phone_number(input("Enter the phone number to call (example: +919876543210): "))


def make_call(to_number: str) -> None:
    if not ACCOUNT_SID or not AUTH_TOKEN or not FROM_NUMBER:
        raise ValueError(
            "Twilio credentials are missing. Open .env and replace TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER with your real Twilio values."
        )

    if ACCOUNT_SID == "your_twilio_account_sid" or AUTH_TOKEN == "your_twilio_auth_token" or FROM_NUMBER in {"+15551234567", "your_twilio_phone_number"}:
        raise ValueError(
            "The .env file still contains placeholder Twilio values. Replace them with your real Twilio credentials before placing a call."
        )

    if "127.0.0.1" in APP_BASE_URL or "localhost" in APP_BASE_URL:
        print("Warning: APP_BASE_URL points to localhost. Twilio cannot reach it unless you use a public URL such as ngrok.")

    twiml = (
        f'<Response>'
        f'<Say>Hello! You are now connected to an AI sales agent.</Say>'
        f'<Gather input="speech" action="{APP_BASE_URL}/webhook" method="POST" timeout="5">'
        f'<Say>Please tell me what you need today.</Say>'
        f'</Gather>'
        f'</Response>'
    )

    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    call = client.calls.create(
        twiml=twiml,
        to=to_number,
        from_=FROM_NUMBER,
    )
    print(f"Call initiated successfully. SID: {call.sid}")


if __name__ == "__main__":
    try:
        phone_number = get_phone_number()
        make_call(phone_number)
    except Exception as exc:
        print(f"Failed to place call: {exc}")
        sys.exit(1)
