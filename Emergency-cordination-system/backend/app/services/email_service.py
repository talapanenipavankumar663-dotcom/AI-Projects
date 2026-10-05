import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import aiosmtplib

from app.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_FROM_NAME,
    EMAIL_ENABLED,
)

logger = logging.getLogger(__name__)


def _build_escalation_html(
    recipient_name: str,
    alert_type: str,
    resident_name: str,
    flat_no: str,
    block: str,
    society: str,
    escalation_tier: str,
) -> str:
    """Returns a styled HTML email body for an escalation notification."""
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4F46E5,#6366F1);padding:28px 32px;text-align:center;">
            <span style="font-size:36px;">🚨</span>
            <h1 style="color:#FFFFFF;margin:8px 0 0;font-size:22px;font-weight:700;letter-spacing:.3px;">
              Emergency SOS Alert
            </h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="color:#111827;font-size:15px;margin:0 0 18px;">
              Hello <strong>{recipient_name}</strong>,
            </p>
            <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
              An emergency SOS alert has been raised and you have been notified as
              <strong style="color:#4F46E5;">{escalation_tier}</strong>.
            </p>
            <!-- Alert Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;margin-bottom:20px;">
              <tr><td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#6B7280;font-size:12px;padding-bottom:6px;">RESIDENT</td>
                    <td style="color:#111827;font-size:14px;font-weight:600;padding-bottom:6px;text-align:right;">{resident_name}</td>
                  </tr>
                  <tr>
                    <td style="color:#6B7280;font-size:12px;padding-bottom:6px;">EMERGENCY TYPE</td>
                    <td style="color:#DC2626;font-size:14px;font-weight:600;padding-bottom:6px;text-align:right;">{alert_type}</td>
                  </tr>
                  <tr>
                    <td style="color:#6B7280;font-size:12px;padding-bottom:6px;">LOCATION</td>
                    <td style="color:#111827;font-size:14px;font-weight:600;padding-bottom:6px;text-align:right;">Flat {flat_no}, {block}, {society}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Please open the app immediately to respond to this emergency.
              If you are unable to respond, the system will automatically escalate to the next tier.
            </p>
            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="#" style="display:inline-block;background:#DC2626;color:#FFFFFF;text-decoration:none;
                   padding:12px 32px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:.5px;">
                  ⚡ OPEN APP &amp; RESPOND
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB;text-align:center;">
            <p style="color:#9CA3AF;font-size:11px;margin:0;">
              EmergX Network &bull; This is an automated alert
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


async def send_escalation_email(
    recipient_email: str,
    recipient_name: str,
    subject: str,
    alert_type: str,
    resident_name: str,
    flat_no: str,
    block: str,
    society: str,
    escalation_tier: str,
) -> bool:
    """
    Sends an HTML escalation email to a single recipient.
    Returns True on success, False on failure (never raises).
    """
    if not EMAIL_ENABLED:
        logger.info("[EmailService] Email disabled via EMAIL_ENABLED=false. Skipping.")
        return False

    if not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.warning(
            "[EmailService] SMTP credentials not configured. "
            "Set SMTP_USERNAME and SMTP_PASSWORD in .env to enable email notifications."
        )
        return False

    if not recipient_email:
        logger.warning(f"[EmailService] No email address for recipient '{recipient_name}'. Skipping.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USERNAME}>"
        msg["To"] = recipient_email

        html_body = _build_escalation_html(
            recipient_name=recipient_name,
            alert_type=alert_type,
            resident_name=resident_name,
            flat_no=flat_no,
            block=block,
            society=society,
            escalation_tier=escalation_tier,
        )
        msg.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USERNAME,
            password=SMTP_PASSWORD,
            start_tls=True,
        )

        logger.info(f"[EmailService] Email sent to {recipient_email} ({escalation_tier})")
        print(f"[EmailService] Email sent to {recipient_email} ({escalation_tier})")
        return True

    except Exception as e:
        logger.error(f"[EmailService] Failed to send email to {recipient_email}: {e}")
        print(f"[EmailService] Failed to send email to {recipient_email}: {e}")
        return False


def send_email_background(
    recipient_email: str,
    recipient_name: str,
    subject: str,
    alert_type: str,
    resident_name: str,
    flat_no: str,
    block: str,
    society: str,
    escalation_tier: str,
):
    """
    Fire-and-forget: schedules the email send as an asyncio background task
    so it never blocks the escalation flow.
    """
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(
            send_escalation_email(
                recipient_email=recipient_email,
                recipient_name=recipient_name,
                subject=subject,
                alert_type=alert_type,
                resident_name=resident_name,
                flat_no=flat_no,
                block=block,
                society=society,
                escalation_tier=escalation_tier,
            )
        )
    except RuntimeError:
        pass


def _build_otp_html(recipient_name: str, otp_code: str) -> str:
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:32px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4F46E5,#6366F1);padding:24px 32px;text-align:center;">
            <span style="font-size:36px;">📲</span>
            <h2 style="color:#FFFFFF;margin:8px 0 0;font-size:20px;font-weight:700;">
              Emergency Contact Verification
            </h2>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;text-align:center;">
            <p style="color:#111827;font-size:15px;margin:0 0 16px;">
              Hello <strong>{recipient_name}</strong>,
            </p>
            <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Your 6-digit Emergency Contact verification code is:
            </p>
            <div style="background:#EEF2FF;border:2px dashed #6366F1;border-radius:8px;padding:16px;display:inline-block;margin-bottom:20px;">
              <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#4F46E5;">{otp_code}</span>
            </div>
            <p style="color:#6B7280;font-size:13px;margin:0;">
              This code will expire in 10 minutes. Please enter it in the app to complete verification.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


async def send_otp_email(recipient_email: str, recipient_name: str, otp_code: str) -> bool:
    if not EMAIL_ENABLED or not recipient_email or not SMTP_USERNAME or not SMTP_PASSWORD:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"📲 Emergency Contact Verification OTP: {otp_code}"
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USERNAME}>"
        msg["To"] = recipient_email
        msg.attach(MIMEText(_build_otp_html(recipient_name, otp_code), "html"))

        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USERNAME,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"[EmailService] OTP email sent to {recipient_email}")
        print(f"[EmailService] OTP email sent to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"[EmailService] Failed to send OTP email to {recipient_email}: {e}")
        print(f"[EmailService] Failed to send OTP email to {recipient_email}: {e}")
        return False


def send_otp_email_sync(recipient_email: str, recipient_name: str, otp_code: str):
    try:
        asyncio.run(send_otp_email(recipient_email, recipient_name, otp_code))
    except Exception as e:
        logger.error(f"[EmailService] Error sending OTP email: {e}")


def send_otp_email_background(recipient_email: str, recipient_name: str, otp_code: str):
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(send_otp_email(recipient_email, recipient_name, otp_code))
    except RuntimeError:
        send_otp_email_sync(recipient_email, recipient_name, otp_code)


