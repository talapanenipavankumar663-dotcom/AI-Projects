import os
import re
import logging
import urllib.parse
import urllib.request
import json
import asyncio
from app.services.phone_service import format_to_e164 as _format_to_e164

logger = logging.getLogger(__name__)

SMS_ENABLED = os.getenv("SMS_ENABLED", "true").lower() == "true"
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")


def format_to_e164(phone: str) -> str:
    return _format_to_e164(phone)


def send_sms_otp(phone_number: str, otp_code: str) -> bool:
    """
    Sends a 6-digit verification OTP code via SMS to the target mobile phone number.
    Supports Twilio SMS API, Fast2SMS API, and console logging.
    """
    formatted_phone = format_to_e164(phone_number)
    message_body = f"Your Emergency Contact verification code is {otp_code}. Valid for 10 minutes."

    print(f"\n=======================================================")
    print(f"[MOBILE SMS DISPATCH] Sending OTP to Mobile Number")
    print(f"   Recipient Phone: {formatted_phone}")
    print(f"   SMS Message: '{message_body}'")
    print(f"=======================================================\n")

    if not SMS_ENABLED:
        logger.info(f"[SMSService] SMS disabled via SMS_ENABLED=false.")
        return False

    # 1. Twilio SMS Integration
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            data = urllib.parse.urlencode({
                "To": formatted_phone,
                "From": TWILIO_PHONE_NUMBER,
                "Body": message_body,
            }).encode("utf-8")

            req = urllib.request.Request(url, data=data, method="POST")
            # Basic Auth header for Twilio
            import base64
            auth_str = f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}"
            b64_auth = base64.b64encode(auth_str.encode()).decode()
            req.add_header("Authorization", f"Basic {b64_auth}")

            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status in (200, 201):
                    logger.info(f"[SMSService] Twilio SMS successfully dispatched to {formatted_phone}")
                    return True
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")
            logger.error(f"[SMSService] Twilio SMS dispatch failed to {formatted_phone}: {e.code} {detail}")
        except Exception as e:
            logger.error(f"[SMSService] Twilio SMS dispatch failed to {formatted_phone}: {e}")

    # 2. Fast2SMS Integration (India SMS Gateway)
    if FAST2SMS_API_KEY:
        try:
            clean_digits = re.sub(r"\D", "", phone_number)[-10:]
            url = "https://www.fast2sms.com/dev/bulkV2"
            payload = json.dumps({
                "variables_values": otp_code,
                "route": "otp",
                "numbers": clean_digits
            }).encode("utf-8")

            req = urllib.request.Request(url, data=payload, method="POST")
            req.add_header("authorization", FAST2SMS_API_KEY)
            req.add_header("Content-Type", "application/json")

            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    logger.info(f"[SMSService] Fast2SMS OTP successfully dispatched to {clean_digits}")
                    return True
        except Exception as e:
            logger.error(f"[SMSService] Fast2SMS dispatch failed to {phone_number}: {e}")

    return True


def send_sms_background(phone_number: str, otp_code: str):
    """Schedules SMS dispatch safely in background."""
    try:
        loop = asyncio.get_running_loop()
        loop.run_in_executor(None, send_sms_otp, phone_number, otp_code)
    except RuntimeError:
        send_sms_otp(phone_number, otp_code)


def send_sms_alert(
    phone_number: str,
    resident_name: str,
    alert_type: str,
    emergency_message: str | None,
    location: str,
    maps_url: str | None = None,
) -> bool:
    """Send an emergency alert with the incident type, message, and location."""
    formatted_phone = format_to_e164(phone_number)
    message = (
        f"EMERGENCY SOS: {resident_name}. Type: {alert_type}. "
        f"Location: {location}."
    )
    if emergency_message:
        message += f" Message: {emergency_message}."
    if maps_url:
        message += f" Map: {maps_url}"

    if not SMS_ENABLED:
        logger.info("[SMSService] SMS disabled via SMS_ENABLED=false.")
        return False

    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER):
        logger.warning(
            "[SMSService] Twilio credentials are not configured; emergency SMS skipped."
        )
        return False

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        data = urllib.parse.urlencode({
            "To": formatted_phone,
            "From": TWILIO_PHONE_NUMBER,
            "Body": message,
        }).encode("utf-8")
        request = urllib.request.Request(url, data=data, method="POST")
        import base64
        auth = base64.b64encode(
            f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}".encode("utf-8")
        ).decode("ascii")
        request.add_header("Authorization", f"Basic {auth}")

        with urllib.request.urlopen(request, timeout=15) as response:
            if response.status in (200, 201):
                logger.info("[SMSService] Emergency SMS sent to %s", formatted_phone)
                return True
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        logger.error("[SMSService] Emergency SMS failed to %s: %s %s", formatted_phone, error.code, detail)
    except Exception as error:
        logger.error("[SMSService] Emergency SMS failed to %s: %s", formatted_phone, error)

    return False


def send_sms_alert_background(
    phone_number: str,
    resident_name: str,
    alert_type: str,
    emergency_message: str | None,
    location: str,
    maps_url: str | None = None,
) -> None:
    """Send an emergency SMS without blocking escalation."""
    try:
        loop = asyncio.get_running_loop()
        loop.run_in_executor(
            None,
            send_sms_alert,
            phone_number,
            resident_name,
            alert_type,
            emergency_message,
            location,
            maps_url,
        )
    except RuntimeError:
        send_sms_alert(
            phone_number,
            resident_name,
            alert_type,
            emergency_message,
            location,
            maps_url,
        )
