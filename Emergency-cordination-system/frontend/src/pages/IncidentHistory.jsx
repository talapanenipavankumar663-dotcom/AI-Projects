import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

function IncidentHistory({ incidents = [], onSelectIncident }) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Sample data fallback if list is empty
  const displayIncidents = incidents.length > 0 ? incidents : [
    { id: 104, type: "Medical Emergency", status: "Open", location: "Tower A, Flat 302", resident: "Alice Smith", created_at: "2026-07-26T01:10:00" },
    { id: 103, type: "Fire Hazard", status: "In Progress", location: "Block C, Basement 1", resident: "John Doe", created_at: "2026-07-25T18:30:00" },
    { id: 102, type: "Security Threat", status: "Resolved", location: "Gate 2 Entrance", resident: "Security Desk", created_at: "2026-07-24T14:15:00" },
    { id: 101, type: "General SOS", status: "Resolved", location: "Block B, Flat 104", resident: "Robert Johnson", created_at: "2026-07-23T09:45:00" },
  ];

  const filteredIncidents = displayIncidents.filter((item) => {
    const matchesSearch =
      (item.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location || item.location_details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.resident || item.resident_name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (item.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusPill = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "pending":
        return <span className="status-pill open">🔴 Open</span>;
      case "in progress":
      case "in_progress":
      case "assigned":
        return <span className="status-pill in-progress">🟡 In Progress</span>;
      case "resolved":
        return <span className="status-pill resolved">🟢 Resolved</span>;
      default:
        return <span className="status-pill closed">⚪ Closed</span>;
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">{t("history")}</h1>
          <p className="section-subtitle">
            Complete record of community emergency alerts, response timestamps, and resolution statuses.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          className="form-input"
          style={{ flex: 2, minWidth: 260 }}
          placeholder="🔍 Search by emergency type, resident, or flat location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-select"
          style={{ flex: 1, minWidth: 160 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Open">🔴 Open / Pending</option>
          <option value="In Progress">🟡 In Progress</option>
          <option value="Resolved">🟢 Resolved</option>
        </select>
      </div>

      {/* Incident Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>INCIDENT ID</th>
              <th>EMERGENCY TYPE</th>
              <th>LOCATION</th>
              <th>RESIDENT / CALLER</th>
              <th>TIMESTAMP</th>
              <th>STATUS</th>
              <th style={{ textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((inc) => (
                <tr key={inc.id}>
                  <td style={{ fontWeight: "700" }}>#{inc.id}</td>
                  <td>
                    <div style={{ fontWeight: "700", color: "var(--emergency-red)" }}>
                      {inc.type || inc.emergency_type || "General Emergency"}
                    </div>
                  </td>
                  <td style={{ fontWeight: "500" }}>📍 {inc.location || inc.location_details || "Community Flat"}</td>
                  <td>{inc.resident || inc.resident_name || "Resident"}</td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {inc.created_at ? new Date(inc.created_at).toLocaleString() : "Recent"}
                  </td>
                  <td>{getStatusPill(inc.status)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-outline btn-sm" onClick={() => onSelectIncident(inc)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No incident logs found matching filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default IncidentHistory;
