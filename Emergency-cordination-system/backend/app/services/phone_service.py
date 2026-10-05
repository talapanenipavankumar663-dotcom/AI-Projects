import re


def format_to_e164(phone: str | None, default_country_code: str = "91") -> str:
    """Convert a phone number to E.164, defaulting bare 10-digit numbers to India."""
    if not phone:
        return ""

    raw_phone = phone.strip()
    digits = re.sub(r"\D", "", raw_phone)
    if not digits:
        return ""

    if raw_phone.startswith("+"):
        formatted_phone = f"+{digits}"
    elif len(digits) == 10:
        formatted_phone = f"+{default_country_code}{digits}"
    else:
        formatted_phone = f"+{digits}"

    if not re.fullmatch(r"\+[1-9]\d{7,14}", formatted_phone):
        return ""

    return formatted_phone