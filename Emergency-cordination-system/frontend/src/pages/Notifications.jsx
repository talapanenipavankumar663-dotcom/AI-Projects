import { useState } from "react";

function Notifications({ notifications = [], onClearNotifications }) {
  const [filter, setFilter] = useState("all");

  const sampleNotifications = [
    {
      id: 1,
      title: "Community Fire Drill Notice",
      message: "Scheduled fire safety drill tomorrow at 10:00 AM in Tower A & B.",
      category: "Announcement",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      title: "Emergency Alert Resolved",
      message: "Medical emergency in Block A, Flat 302 has been resolved by responders.",
      category: "Emergency",
      time: "5 hours ago",
      read: true,
    },
    {
      id: 3,
      title: "Security Gate Protocol Update",
      message: "Visitor pass QR verification is now active at Gate 1 and Gate 2.",
      category: "Security",
      time: "1 day ago",
      read: true,
    },
  ];

  const displayList = notifications.length > 0 ? notifications : sampleNotifications;

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Notifications & System Broadcasts</h1>
          <p className="section-subtitle">
            Community announcements, safety advisories, and emergency dispatch alerts.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onClearNotifications}>
          Clear Notifications
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {["all", "Emergency", "Security", "Announcement"].map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm ${filter === cat ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter(cat)}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {displayList
          .filter((n) => filter === "all" || n.category === filter)
          .map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                background: item.read ? "var(--surface-card)" : "var(--primary-light)",
                borderColor: item.read ? "var(--border-color)" : "#c7d2fe",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: item.category === "Emergency" ? "var(--emergency-red)" : "var(--primary)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  flexShrink: 0,
                }}
              >
                {item.category === "Emergency" ? "🚨" : "🔔"}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <h4 style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-main)" }}>
                    {item.title}
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.time || "Recent"}</span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{item.message}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Notifications;
