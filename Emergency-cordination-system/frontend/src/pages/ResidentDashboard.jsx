import { useState } from "react";
import EscalationTimer from "../components/EscalationTimer";
import PreTriggerSOSModal from "../components/PreTriggerSOSModal";
import { useLanguage } from "../context/LanguageContext";

function ResidentDashboard({ user, activeAlerts, onTriggerSOS, onViewChange, onSelectIncident }) {
  const { t } = useLanguage();
  const [showPreTrigger, setShowPreTrigger] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Medical Emergency");

  const activeSOS = activeAlerts?.find((a) => a.status === "Open" || a.status === "In Progress");

  const handleOpenPreTrigger = (categoryName = "Medical Emergency") => {
    setSelectedCategory(categoryName);
    setShowPreTrigger(true);
  };

  const handleConfirmSOS = (sosDetails) => {
    setShowPreTrigger(false);
    if (onTriggerSOS) {
      onTriggerSOS(sosDetails);
    }
  };

  return (
    <div>
      {/* GIANT CENTRAL EMERGENCY SOS HERO BLOCK */}
      <div className="hero-sos-container">
        <div className="hero-sos-ambient-glow"></div>

        <div style={{ textTransform: "uppercase", fontSize: "0.8rem", color: "#a5b4fc", fontWeight: "800", letterSpacing: "0.1em" }}>
          {t("dispatchCenter")} • {user?.first_name ? `${user.first_name.toUpperCase()}'S RESIDENCE` : "RESIDENT PORTAL"}
        </div>
        
        <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "white", marginTop: "0.35rem" }}>
          {t("instantBroadcast")}
        </h2>
        
        <p style={{ color: "#c7d2fe", fontSize: "0.925rem", marginTop: "0.25rem", maxWidth: 580, margin: "0.25rem auto 0" }}>
          {t("panicDesc")}
        </p>

        {/* GIANT CENTRAL BUTTON */}
        <div className="giant-sos-wrapper">
          <button className="giant-sos-button" onClick={() => handleOpenPreTrigger("General SOS")}>
            <span style={{ fontSize: "2rem", marginBottom: "-0.2rem" }}>🚨</span>
            <span className="giant-sos-text">SOS</span>
            <span className="giant-sos-subtext">{t("pressPanic")}</span>
          </button>
        </div>

        {/* QUICK CATEGORY CHIPS */}
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem" }}>
          {t("tapCategory")}
        </div>

        <div className="sos-quick-categories">
          {[
            { label: t("medicalEmergency"), icon: "🚑", id: "Medical Emergency" },
            { label: t("fireHazard"), icon: "🔥", id: "Fire Hazard" },
            { label: t("securityThreat"), icon: "🛡️", id: "Security Threat" },
            { label: t("naturalDisaster"), icon: "🌊", id: "Natural Disaster" },
            { label: t("generalSOS"), icon: "⚠️", id: "General SOS" },
          ].map((cat, idx) => (
            <button key={idx} className="sos-category-chip" onClick={() => handleOpenPreTrigger(cat.id)}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* ACTIVE ESCALATION COUNTDOWN TIMER */}
        {activeSOS && (
          <div style={{ marginTop: "1.5rem", width: "100%", maxWidth: 650 }}>
            <EscalationTimer alert={activeSOS} />
          </div>
        )}
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid-cards">
        <div className="card stat-card">
          <div className="stat-icon red">🚨</div>
          <div>
            <div className="stat-value">{activeAlerts?.length || 0}</div>
            <div className="stat-label">{t("activeAlertsCount")}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: "pointer" }} onClick={() => onViewChange("emergency-contacts")}>
          <div className="stat-icon primary">📞</div>
          <div>
            <div className="stat-value">Verified</div>
            <div className="stat-label">{t("emergencyContactsList")}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon green">🛡️</div>
          <div>
            <div className="stat-value">On Duty</div>
            <div className="stat-label">{t("onDutySecurity")}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon amber">🤝</div>
          <div>
            <div className="stat-value">12 Ready</div>
            <div className="stat-label">{t("volunteerResponders")}</div>
          </div>
        </div>
      </div>

      {/* Active Alerts / Recent Activity List */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>{t("activeFeedTitle")}</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Live broadcast log of current community alerts.</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onViewChange("incident-history")}>
            View Full Log →
          </button>
        </div>

        {activeAlerts && activeAlerts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onSelectIncident(alert)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  background: alert.status === "Open" ? "var(--emergency-red-light)" : "var(--bg-main)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: alert.status === "Open" ? "var(--emergency-red)" : "var(--warning-amber)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "1.2rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    🚨
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.95rem" }}>
                      {alert.emergency_type || "Emergency Alert"} - Flat {alert.flat_no || "302"} ({alert.block || "A"})
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      Raised at: {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : "Just now"} • Status: {alert.status}
                    </div>
                  </div>
                </div>
                <div className="btn btn-outline btn-sm">Track Alert →</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>No active emergency alerts in your community right now.</p>
          </div>
        )}
      </div>

      {/* PRE-TRIGGER SOS FORM MODAL */}
      <PreTriggerSOSModal
        isOpen={showPreTrigger}
        initialCategory={selectedCategory}
        defaultFlat={`Flat 302, Block A, Green Valley`}
        onClose={() => setShowPreTrigger(false)}
        onConfirm={handleConfirmSOS}
      />
    </div>
  );
}

export default ResidentDashboard;
