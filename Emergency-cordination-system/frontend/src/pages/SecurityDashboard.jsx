import { useLanguage } from "../context/LanguageContext";

function SecurityDashboard({ activeAlerts = [], onSelectIncident, onUpdateStatus }) {
  const { t } = useLanguage();
  const sampleGuardsAlerts = activeAlerts.length > 0 ? activeAlerts : [
    {
      id: 104,
      emergency_type: "Medical Emergency",
      status: "Open",
      location_details: "Tower A, Flat 302",
      resident_name: "Alice Smith",
      contact_phone: "+1 555-0192",
      created_at: new Date().toISOString(),
      notes: "Severe shortness of breath. Medical inhaler required.",
    },
  ];

  return (
    <div>
      <div className="section-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="role-badge security">GATE & PATROL DISPATCH</span>
            <h1 className="section-title">{t("guardsCommandCenter")}</h1>
          </div>
          <p className="section-subtitle">
            Real-time monitoring of community panic calls, instant guard dispatch, on-scene status updates.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--success-green)" }}>
            🟢 ON DUTY: GATE 1 MAIN DESK
          </span>
        </div>
      </div>

      {/* Emergency Alert Dispatch Cards */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem", color: "var(--emergency-red)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="pulse-dot" style={{ width: 10, height: 10, background: "var(--emergency-red)" }}></span>
          LIVE EMERGENCY DISPATCH FEED
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sampleGuardsAlerts.map((alert) => (
            <div
              key={alert.id}
              className="card"
              style={{
                borderLeft: "6px solid var(--emergency-red)",
                background: alert.status === "Open" ? "var(--emergency-red-light)" : "var(--surface-card)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>🚨</span>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--emergency-red)" }}>
                      {alert.emergency_type || "Emergency SOS"} #{alert.id}
                    </h3>
                    <span className={`status-pill ${alert.status === "Open" ? "open" : "in-progress"}`}>
                      {alert.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.5rem" }}>
                    📍 Location: {alert.location_details || alert.location || "Block A, Flat 302"}
                  </div>

                  <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                    👤 Resident: <strong>{alert.resident_name || alert.caller || "Alice Smith"}</strong> ({alert.contact_phone || "+1 555-0192"})
                  </div>

                  {alert.notes && (
                    <div style={{ background: "rgba(255, 255, 255, 0.8)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-md)", fontSize: "0.85rem", fontStyle: "italic", border: "1px solid #fca5a5" }}>
                      "{alert.notes}"
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 200, justifyContent: "center" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => onSelectIncident(alert)}
                  >
                    🔍 Open Control Room Details
                  </button>

                  <button
                    className="btn btn-success"
                    onClick={() => onUpdateStatus(alert.id, "Resolved")}
                  >
                    ✅ Mark Emergency Resolved
                  </button>

                  <a
                    href={`tel:${alert.contact_phone || "+15550192"}`}
                    className="btn btn-outline"
                    style={{ textAlign: "center", textDecoration: "none" }}
                  >
                    📞 Call Resident Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SecurityDashboard;
