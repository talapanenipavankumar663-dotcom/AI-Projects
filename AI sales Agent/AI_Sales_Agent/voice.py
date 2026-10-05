import os
import tempfile

try:
    from gtts import gTTS
except ModuleNotFoundError:
    gTTS = None

try:
    from playsound import playsound
except ModuleNotFoundError:
    def playsound(_path: str) -> None:
        print("Audio playback skipped because playsound is not installed.")


def speak_text(text: str) -> None:
    if not text:
        return

    try:
        if gTTS is None:
            print("gTTS is not installed; audio playback skipped.")
            return
        tts = gTTS(text=text, lang="en")
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tmp_path = tmp.name
        tts.save(tmp_path)
        playsound(tmp_path)
        os.remove(tmp_path)
    except Exception as exc:
        print(f"Text-to-speech error: {exc}")
