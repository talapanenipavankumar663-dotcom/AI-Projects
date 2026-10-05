import importlib
import os
import subprocess
import sys
from flask import Flask, request, Response


def ensure_dependency(package_name: str, module_name: str | None = None) -> None:
    module_name = module_name or package_name
    try:
        importlib.import_module(module_name)
    except ModuleNotFoundError:
        print(f"Installing missing dependency: {package_name}")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
        importlib.import_module(module_name)


ensure_dependency("python-dotenv", "dotenv")
from dotenv import load_dotenv
from ai_agent import generate_response

load_dotenv()

app = Flask(__name__)
conversation_history = {}


@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok"}, 200


@app.route("/webhook", methods=["POST"])
def webhook():
    try:
        form_data = request.form.to_dict()
        call_sid = form_data.get("CallSid", "unknown")
        speech_text = form_data.get("SpeechResult", "").strip()

        if not speech_text:
            speech_text = "Hello, how can I help you today?"

        history = conversation_history.setdefault(call_sid, [])
        history.append({"role": "user", "content": speech_text})

        ai_reply = generate_response(speech_text)
        history.append({"role": "assistant", "content": ai_reply})

        print(f"Call {call_sid}: {speech_text} -> {ai_reply}")

        twiml_response = f"""<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<Response>
    <Gather input=\"speech\" action=\"/webhook\" method=\"POST\" timeout=\"5\" speechTimeout=\"auto\">
        <Say>{ai_reply}</Say>
    </Gather>
</Response>"""
        return Response(twiml_response, mimetype="text/xml")
    except Exception as exc:
        print(f"Webhook error: {exc}")
        return Response(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>Sorry, an error occurred.</Say></Response>",
            mimetype="text/xml",
        )


@app.route("/stream", methods=["POST"])
def stream():
    try:
        return Response(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Connect><Stream url=\"wss://example.com/stream\" /></Connect></Response>",
            mimetype="text/xml",
        )
    except Exception as exc:
        print(f"Stream error: {exc}")
        return Response(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say>Sorry, an error occurred.</Say></Response>",
            mimetype="text/xml",
        )


if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    app.run(host=host, port=port, debug=True)
