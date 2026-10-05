import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

function Navbar({ user, activeRole, onLogout, activeAlertCount, onTriggerSOS }) {
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const { language, changeLanguage, t } = useLanguage();

  const getInitials = () => {
    if (!user) return "U";
    const first = user.first_name ? user.first_name[0] : "";
    const last = user.last_name ? user.last_name[0] : "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="brand-icon">🚨</div>
          <div>
            <span>{t("appName")}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {/* Active Emergency Counter Badge */}
          {activeAlertCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#ef4444",
                padding: "0.3rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                fontWeight: "700",
              }}
            >
              <span className="pulse-dot" style={{ width: 8, height: 8, background: "#ef4444" }}></span>
              <span>{activeAlertCount} {t("activeEmergency")}</span>
            </div>
          )}

          {/* Language Selector Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.85rem" }}>🌐</span>
            <select
              className="role-switcher-select"
              style={{ minWidth: 125, fontWeight: "600" }}
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="bn">Bengali (বাংলা)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
            </select>
          </div>

          {/* PWA App Feature Trigger Button */}
          <button
            className="btn btn-outline btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              borderColor: "#0071e3",
              color: "#0071e3",
              fontWeight: "600",
              fontSize: "0.8rem",
            }}
            onClick={() => window.dispatchEvent(new CustomEvent("open-pwa-modal"))}
            title="Install Progressive Web App"
          >
            <span>📲</span>
            <span>Install App</span>
          </button>

          {/* Quick SOS Trigger Button */}
          {user && (
            <button className="btn btn-emergency btn-sm" onClick={onTriggerSOS}>
              {t("sosPanic")}
            </button>
          )}



          {/* Profile User Dropdown / Avatar */}
          {user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
                borderRadius: "var(--radius-md)",
              }}
              onClick={() => setShowProfileDrawer(true)}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary), #818cf8)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                }}
              >
                {getInitials()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
                  {user.first_name} {user.last_name}
                </span>
                <span className={`role-badge ${activeRole.toLowerCase()}`} style={{ padding: "0.1rem 0.4rem", fontSize: "0.65rem" }}>
                  {activeRole}
                </span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Profile Drawer Modal */}
      {showProfileDrawer && user && (
        <div className="modal-overlay" onClick={() => setShowProfileDrawer(false)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">User Account Overview</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowProfileDrawer(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary), #818cf8)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "1.75rem",
                  margin: "0 auto 1rem",
                }}
              >
                {getInitials()}
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                {user.first_name} {user.last_name}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                {user.email}
              </p>

              <div style={{ textAlign: "left", background: "var(--bg-main)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>PHONE NUMBER</div>
                  <div style={{ fontWeight: "500" }}>{user.phone || user.phone_number || "Not set"}</div>
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>CURRENT ROLE</div>
                  <div style={{ fontWeight: "600", color: "var(--primary)" }}>{activeRole}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>ACCOUNT STATUS</div>
                  <div style={{ color: "var(--success-green)", fontWeight: "600" }}>Active Verified Member</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger-outline" onClick={onLogout}>
                {t("signOut")}
              </button>
              <button className="btn btn-outline" onClick={() => setShowProfileDrawer(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
