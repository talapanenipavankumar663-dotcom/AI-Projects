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


ensure_dependency("openai", "openai")
ensure_dependency("python-dotenv", "dotenv")

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = (
    "You are an AI sales agent. "
    "Your responsibility is to talk with customers, "
    "understand their needs, explain products, answer objections, "
    "and convert leads professionally."
)


def generate_response(user_text: str) -> str:
    if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_api_key":
        return (
            "Hello! I am your AI sales assistant. "
            "Please configure your OpenAI API key in the .env file to enable live responses."
        )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_text},
            ],
            temperature=0.7,
            max_tokens=200,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        return f"I am sorry, I could not process that request right now. Error: {exc}"
