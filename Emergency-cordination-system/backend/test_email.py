import asyncio
from app.services.email_service import send_escalation_email

async def main():
    success = await send_escalation_email(
        recipient_email="test.infosys.springboard@gmail.com",
        recipient_name="Primary Contact Test",
        subject="🚨 TEST EMAIL",
        alert_type="Test Alert",
        resident_name="Test Resident",
        flat_no="101",
        block="A",
        society="Test Society",
        escalation_tier="Primary Contact"
    )
    print(f"Email success: {success}")

if __name__ == "__main__":
    asyncio.run(main())
