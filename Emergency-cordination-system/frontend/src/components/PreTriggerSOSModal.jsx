import { useState } from "react";

export function PreTriggerSOSModal({ isOpen, initialCategory, defaultFlat, onClose, onConfirm }) {
  const [flatNo, setFlatNo] = useState(defaultFlat || "Flat 302, Block A, Green Valley");
  const [category, setCategory] = useState(initialCategory || "Medical Emergency");
  const [remarks, setRemarks] = useState("");

  if (!isOpen) return null;

  const categories = [
    { id: "Medical Emergency", label: "🚑 Medical Emergency", color: "#EF4444" },
    { id: "Fall Injury", label: "🤕 Fall / Physical Injury", color: "#F59E0B" },
    { id: "Fire Hazard", label: "🔥 Fire Hazard / Smoke", color: "#DC2626" },
    { id: "Security Threat", label: "🛡️ Security Threat / Intruder", color: "#6366F1" },
    { id: "Natural Disaster", label: "🌊 Natural Disaster", color: "#0EA5E9" },
    { id: "General SOS", label: "⚠️ General Emergency", color: "#8B5CF6" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      flat_no: flatNo,
      emergency_type: category,
      remarks: remarks.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: "520px",
          borderRadius: "20px",
          background: "var(--bg-card, #FFFFFF)",
          border: "2px solid #EF4444",
          boxShadow: "0 10px 40px rgba(239, 68, 68, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #EF4444, #DC2626)",
          color: "white",
          padding: "1.25rem 1.5rem",
          borderRadius: "18px 18px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.6rem" }}>🚨</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "900", letterSpacing: "0.02em" }}>
                EMERGENCY DISPATCH DETAILS
              </h3>
              <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.9 }}>
                Confirm flat location & reason before broadcasting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "white",
              fontSize: "1.2rem",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          {/* Flat Location Field */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
              📍 Flat / Unit Emergency Location
            </label>
            <input
              type="text"
              className="form-control"
              value={flatNo}
              onChange={(e) => setFlatNo(e.target.value)}
              placeholder="e.g. Flat 302, Block A, Green Valley"
              required
              style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                border: "1.5px solid var(--border-color)"
              }}
            />
          </div>

          {/* Reason / Category Selection */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
              🩺 Reason for Emergency SOS
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem" }}>
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "10px",
                      border: isSelected ? `2px solid ${cat.color}` : "1px solid var(--border-color)",
                      background: isSelected ? "rgba(239, 68, 68, 0.08)" : "var(--bg-main)",
                      color: isSelected ? cat.color : "var(--text-main)",
                      fontWeight: isSelected ? "800" : "600",
                      fontSize: "0.825rem",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Message / Remarks */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
              📝 Additional Details (Optional)
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Elderly person collapsed in living room, door unlocked."
              style={{
                fontSize: "0.9rem",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                border: "1.5px solid var(--border-color)",
                resize: "none"
              }}
            />
          </div>

          {/* Confirm Button */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ flex: 1, padding: "0.85rem", borderRadius: "12px", fontWeight: "700" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              style={{
                flex: 2,
                padding: "0.85rem",
                borderRadius: "12px",
                fontWeight: "900",
                fontSize: "0.95rem",
                background: "linear-gradient(135deg, #EF4444, #DC2626)",
                boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)"
              }}
            >
              🚨 CONFIRM & BROADCAST SOS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PreTriggerSOSModal;
