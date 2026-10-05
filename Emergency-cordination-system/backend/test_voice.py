
from app.services.voice_service import send_voice_alert

result = send_voice_alert(
    phone_number="+917337254526",
    resident_name="Pavan",
    alert_type="Emergency",
    emergency_message="This is a test emergency call.",
    location="Anantapur",
    maps_url=None
)

print("CALL RESULT:", result)
