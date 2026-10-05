import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

function VolunteerDashboard({ activeAlerts = [] }) {
  const { t } = useLanguage();
  const [respondingAlerts, setRespondingAlerts] = useState({});

  const handleVolunteerRespond = (alertId) => {
    setRespondingAlerts({ ...respondingAlerts, [alertId]: true });
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="role-badge volunteer">{t("volunteerNetwork")}</span>
            <h1 className="section-title">{t("volunteerPortalNav")}</h1>
          </div>
          <p className="section-subtitle">
            {t("volunteerSubtitle")}
          </p>
        </div>
        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--success-green)" }}>
          {t("volunteerStatusOnCall")}
        </span>
      </div>

      {/* Active Community Alerts Feed */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem" }}>
          {t("nearbyEmergencies")}
        </h3>

        {activeAlerts.length > 0 ? (
          activeAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: "1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                marginBottom: "1rem",
                background: "var(--bg-main)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "1.05rem", color: "var(--emergency-red)" }}>
                    🚨 {alert.emergency_type || "Emergency SOS"} #{alert.id}
                  </div>
                  <div style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>
                    📍 <strong>{alert.location_details || alert.location || "Block A, Flat 302"}</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Caller: {alert.resident_name || "Resident"}
                  </div>
                </div>

                <div>
                  {respondingAlerts[alert.id] ? (
                    <span className="status-pill resolved" style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}>
                      {t("youResponded")}
                    </span>
                  ) : (
                    <button
                      className="btn btn-emergency"
                      onClick={() => handleVolunteerRespond(alert.id)}
                    >
                      {t("iCanAssist")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🤝</div>
            <div>{t("noNearbyEmergencies")}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VolunteerDashboard;
