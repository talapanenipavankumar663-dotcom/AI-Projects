import { useState } from "react";

function RaiseSOSModal({ isOpen, onClose, onRaiseSuccess }) {
  const [emergencyType, setEmergencyType] = useState("Medical");
  const [location, setLocation] = useState("Block A, Flat 302");
  const [notes, setNotes] = useState("");
  const [contactPhone, setContactPhone] = useState("+15550192");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (onRaiseSuccess) {
        await onRaiseSuccess({
          emergency_type: emergencyType,
          location_details: location,
          notes: notes,
          contact_phone: contactPhone,
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to raise SOS:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const emergencyCategories = [
    { id: "Medical", title: "Medical Emergency", icon: "🚑", desc: "Ambulance, Cardiac, Severe Injury" },
    { id: "Fire", title: "Fire Hazard", icon: "🔥", desc: "Smoke, Electrical Fire, Gas Leak" },
    { id: "Security", title: "Security Threat", icon: "🛡️", desc: "Break-in, Intruder, Theft" },
    { id: "Disaster", title: "Natural Disaster", icon: "🌊", desc: "Flood, Earthquake, Structural" },
    { id: "General", title: "General SOS", icon: "⚠️", desc: "Other Urgent Community Assistance" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: "var(--emergency-red-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--emergency-red)" }}>
            <span style={{ fontSize: "1.5rem" }}>⚡</span>
            <h3 className="modal-title" style={{ color: "var(--emergency-red)" }}>
              RAISE EMERGENCY SOS
            </h3>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Select emergency type to immediately alert nearby security guards, volunteer responders, and emergency contact list.
            </p>

            <div className="form-group">
              <label className="form-label">SELECT EMERGENCY TYPE</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                {emergencyCategories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setEmergencyType(cat.id)}
                    style={{
                      padding: "0.85rem",
                      borderRadius: "var(--radius-md)",
                      border: `2px solid ${emergencyType === cat.id ? "var(--emergency-red)" : "var(--border-color)"}`,
                      background: emergencyType === cat.id ? "var(--emergency-red-light)" : "var(--surface-card)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "1.35rem", marginBottom: "0.25rem" }}>{cat.icon}</div>
                    <div style={{ fontWeight: "700", fontSize: "0.9rem", color: emergencyType === cat.id ? "var(--emergency-red)" : "var(--text-main)" }}>
                      {cat.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{cat.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">SPECIFIC LOCATION / FLAT / TOWER</label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Building B, Flat 405"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">CONTACT PHONE NUMBER</label>
              <input
                type="text"
                className="form-input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 555-0192"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">ADDITIONAL NOTES / INSTRUCTIONS (OPTIONAL)</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe current situation or victim state..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-emergency"
              disabled={isSubmitting}
              style={{ padding: "0.75rem 1.75rem", fontSize: "1rem" }}
            >
              {isSubmitting ? "BROADCASTING ALERT..." : "🚨 DISPATCH EMERGENCY ALERT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RaiseSOSModal;
