import { useState, useEffect } from "react";
import { userService, societyService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

function AdminDashboard({ onViewChange }) {
  const { t } = useLanguage();
  const [userCount, setUserCount] = useState(128);
  const [societyCount, setSocietyCount] = useState(4);

  useEffect(() => {
    async function loadDashboardMetrics() {
      try {
        const uRes = await userService.getAllUsers();
        if (uRes.data && Array.isArray(uRes.data)) {
          setUserCount(uRes.data.length);
        }
      } catch (err) {
        console.warn("[AdminDashboard] Using fallback user count metric:", err);
      }

      try {
        const sRes = await societyService.getSocieties();
        if (sRes.data && Array.isArray(sRes.data)) {
          setSocietyCount(sRes.data.length);
        }
      } catch (err) {
        console.warn("[AdminDashboard] Using fallback society count metric:", err);
      }
    }
    loadDashboardMetrics();
  }, []);

  const stats = [
    { title: t("regSocieties"), value: String(societyCount), icon: "🏢", color: "primary" },
    { title: t("totResidents"), value: String(userCount), icon: "👥", color: "green" },
    { title: t("activeSOS"), value: "0", icon: "🚨", color: "red" },
    { title: t("securityOnDuty"), value: "8", icon: "🛡️", color: "amber" },
  ];

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">{t("adminDashboardTitle")}</h1>
          <p className="section-subtitle">
            {t("adminDashboardSubtitle")}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-cards">
        {stats.map((s, idx) => (
          <div key={idx} className="card stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Administrative Action Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div
          className="card"
          style={{ cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => onViewChange("manage-societies")}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏢</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.25rem" }}>
            {t("configSocieties")}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            {t("configSocietiesDesc")}
          </p>
          <span style={{ color: "var(--primary)", fontWeight: "600", fontSize: "0.85rem" }}>
            {t("manageSocietiesBtn")}
          </span>
        </div>

        <div
          className="card"
          style={{ cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => onViewChange("manage-residents")}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.25rem" }}>
            {t("manageUserRoles")}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            {t("manageUserRolesDesc")}
          </p>
          <span style={{ color: "var(--primary)", fontWeight: "600", fontSize: "0.85rem" }}>
            {t("manageUserRolesBtn")}
          </span>
        </div>

        <div
          className="card"
          style={{ cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => onViewChange("incident-history")}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.25rem" }}>
            {t("auditLogs")}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            {t("auditLogsDesc")}
          </p>
          <span style={{ color: "var(--primary)", fontWeight: "600", fontSize: "0.85rem" }}>
            {t("auditLogsBtn")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
