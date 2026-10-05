import { useLanguage } from "../context/LanguageContext";

function Sidebar({ activeRole, activeView, onViewChange, activeAlertCount }) {
  const { t } = useLanguage();

  // Define dedicated items strictly based on role
  const getNavItems = () => {
    const roleClean = String(activeRole || "").trim().toLowerCase();

    if (roleClean.includes("admin")) {
      return [
        { id: "admin-dashboard", label: t("overviewStats") || "Admin Command Center", icon: "📊" },
        { id: "manage-residents", label: t("manageResidents") || "Manage Residents & Roles", icon: "👥" },
        { id: "manage-societies", label: t("manageSocieties") || "Manage Societies & Flats", icon: "🏢" },
        { id: "incident-history", label: t("history") || "System Incident Logs", icon: "📜" },
        { id: "notifications", label: t("systemBroadcasts") || "Emergency Broadcasts", icon: "📢" },
      ];
    }

    if (roleClean.includes("sec") || roleClean.includes("guard")) {
      return [
        { id: "security-dashboard", label: t("guardsCommandCenter") || "Guards Command Center", icon: "🛡️", badge: activeAlertCount },
        { id: "incident-history", label: t("history") || "Security Incident Logs", icon: "📋" },
        { id: "notifications", label: t("alerts") || "Gate & Emergency Alerts", icon: "🔔" },
      ];
    }

    if (roleClean.includes("vol")) {
      return [
        { id: "volunteer-dashboard", label: t("volunteerPortalNav") || "Volunteer Responder Portal", icon: "🤝", badge: activeAlertCount },
        { id: "incident-history", label: t("pastIncidents") || "Past Rescue Incidents", icon: "📋" },
        { id: "notifications", label: t("communityBroadcasts") || "Community Broadcasts", icon: "🔔" },
      ];
    }

    // Default Resident navigation
    return [
      { id: "resident-dashboard", label: t("home") || "Home Dashboard", icon: "🏠" },
      { id: "emergency-contacts", label: t("contacts") || "Emergency Contacts", icon: "📞" },
      { id: "incident-history", label: t("history") || "Incident History", icon: "🕒" },
      { id: "notifications", label: t("alerts") || "Alerts & Messages", icon: "🔔" },
      { id: "profile", label: t("profile") || "User Profile", icon: "👤" },
    ];
  };

  const navItems = getNavItems();
  const displayRole = (activeRole || "User").toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-heading">{t("mainMenu") || "MAIN MENU"} ({displayRole})</div>
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`sidebar-item ${activeView === item.id ? "active" : ""}`}
          onClick={() => onViewChange(item.id)}
        >
          <span className="sidebar-item-icon">{item.icon}</span>
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.badge > 0 && (
            <span
              style={{
                background: "var(--emergency-red)",
                color: "white",
                borderRadius: "9999px",
                padding: "0.1rem 0.45rem",
                fontSize: "0.7rem",
                fontWeight: "700",
              }}
            >
              {item.badge}
            </span>
          )}
        </button>
      ))}

      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
        <div style={{ padding: "0.5rem 0.85rem", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
          <strong>Citizen Network App</strong>
          <div>v1.0.4 • Connected</div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
