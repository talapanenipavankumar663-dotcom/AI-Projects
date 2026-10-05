import asyncio
import base64
import html
import logging
import os
import re
import urllib.parse
import urllib.request

from dotenv import load_dotenv
from app.services.phone_service import format_to_e164

load_dotenv()

logger = logging.getLogger(__name__)

VOICE_ENABLED = os.getenv("VOICE_ENABLED", "true").lower() == "true"

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")


def _build_twiml(
    resident_name: str,
    alert_type: str,
    emergency_message: str | None,
    location: str,
    maps_url: str | None,
) -> str:

    details = (
        f"Emergency alert from {resident_name}. "
        f"Emergency type: {alert_type}. "
        f"Location: {location}. "
    )

    if emergency_message:
        details += f"Message: {emergency_message}. "

    if maps_url:
        details += f"The map location is {maps_url}. "

    details += "Please respond immediately or contact emergency services."

    return (
        f'<Response><Say language="en-US" voice="alice">'
        f'{html.escape(details)}'
        f"</Say></Response>"
    )


def send_voice_alert(
    phone_number: str,
    resident_name: str,
    alert_type: str,
    emergency_message: str | None,
    location: str,
    maps_url: str | None = None,
) -> bool:

    """Place an automated emergency call containing the alert details."""

    if not VOICE_ENABLED:
        logger.info(
            "[VoiceService] Voice calls disabled via VOICE_ENABLED=false."
        )
        return False

    if not phone_number:
        logger.warning(
            "[VoiceService] Contact has no phone number. Skipping call."
        )
        return False

    formatted_phone = format_to_e164(phone_number)

    if not formatted_phone:
        logger.warning(
            "[VoiceService] Invalid contact phone number '%s'. Skipping call.",
            phone_number,
        )
        return False

    if (
        not TWILIO_ACCOUNT_SID
        or not TWILIO_AUTH_TOKEN
        or not TWILIO_PHONE_NUMBER
        or "your_twilio_phone_number"
        in TWILIO_PHONE_NUMBER.lower()
    ):
        logger.warning(
            "[VoiceService] Twilio credentials are not configured. "
            "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and "
            "TWILIO_PHONE_NUMBER to a real Twilio phone number "
            "in E.164 format."
        )
        return False

    # Correct E.164 validation
    if not re.fullmatch(
        r"\+[1-9]\d{7,14}",
        TWILIO_PHONE_NUMBER.strip()
    ):
        logger.warning(
            "[VoiceService] TWILIO_PHONE_NUMBER must be a real "
            "E.164 number, for example +14155552671."
        )
        return False

    try:

        # Correct Twilio API URL
        url = (
            f"https://api.twilio.com/2010-04-01/"
            f"Accounts/{TWILIO_ACCOUNT_SID}/Calls.json"
        )

        twiml = _build_twiml(
            resident_name=resident_name,
            alert_type=alert_type,
            emergency_message=emergency_message,
            location=location,
            maps_url=maps_url,
        )

        data = urllib.parse.urlencode(
            {
                "To": formatted_phone,
                "From": TWILIO_PHONE_NUMBER,
                "Twiml": twiml,
            }
        ).encode("utf-8")

        request = urllib.request.Request(
            url,
            data=data,
            method="POST",
        )

        auth = base64.b64encode(
            f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}".encode(
                "utf-8"
            )
        ).decode("ascii")

        request.add_header(
            "Authorization",
            f"Basic {auth}",
        )

        with urllib.request.urlopen(
            request,
            timeout=15,
        ) as response:

            if response.status in (200, 201):

                logger.info(
                    "[VoiceService] Emergency call placed to %s",
                    formatted_phone,
                )

                return True

    except urllib.error.HTTPError as error:

        detail = error.read().decode(
            "utf-8",
            errors="replace",
        )

        logger.error(
            "[VoiceService] Emergency call failed to %s: %s %s",
            formatted_phone,
            error.code,
            detail,
        )

    except Exception as error:

        logger.error(
            "[VoiceService] Emergency call failed to %s: %s",
            formatted_phone,
            error,
        )

    return False


def send_voice_alert_background(
    phone_number: str,
    resident_name: str,
    alert_type: str,
    emergency_message: str | None,
    location: str,
    maps_url: str | None = None,
) -> None:

    """Place the call in an executor so escalation is not blocked."""

    try:

        loop = asyncio.get_running_loop()

        loop.run_in_executor(
            None,
            send_voice_alert,
            phone_number,
            resident_name,
            alert_type,
            emergency_message,
            location,
            maps_url,
        )

    except RuntimeError:

        send_voice_alert(
            phone_number,
            resident_name,
            alert_type,
            emergency_message,
            location,
            maps_url,
        )