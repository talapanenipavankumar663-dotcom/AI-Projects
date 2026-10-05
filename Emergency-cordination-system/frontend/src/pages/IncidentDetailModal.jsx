import { useState, useEffect } from "react";
import api from "../services/api";
import EscalationTimer from "../components/EscalationTimer";

function IncidentDetailModal({ incident, isOpen, onClose, onUpdateStatus, activeRole }) {
  const [updating, setUpdating] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [showClosureForm, setShowClosureForm] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (isOpen && incident?.id) {
      api.get(`/api/incidents/${incident.id}/timeline/`)
        .then(res => setTimeline(res.data || []))
        .catch(err => console.log('Timeline fetch error:', err));
    }
  }, [isOpen, incident]);

  if (!isOpen || !incident) return null;

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'Closed') {
      setShowClosureForm(true);
      return;
    }

    setUpdating(true);
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(incident.id, newStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseIncidentSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionSummary.trim()) {
      alert("Please provide a resolution summary.");
      return;
    }
    setUpdating(true);
    try {
      await api.post(`/api/incidents/${incident.id}/close/`, {
        resolution_summary: resolutionSummary.trim(),
        remarks: remarks.trim() || undefined
      });
      alert(`Incident #${incident.id} has been closed and documented.`);
      setShowClosureForm(false);
      if (onUpdateStatus) {
        await onUpdateStatus(incident.id, 'Closed');
      }
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to close incident.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "pending":
        return "open";
      case "in progress":
      case "assigned":
      case "reached location":
        return "in-progress";
      case "resolved":
        return "resolved";
      default:
        return "closed";
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 650, borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🚨</span>
            <div>
              <h3 className="modal-title">Emergency Incident #{incident.id}</h3>
              <span className={`status-pill ${getStatusClass(incident.status)}`}>
                {incident.status || "ACTIVE"}
              </span>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ background: "var(--bg-main)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>EMERGENCY TYPE</div>
              <div style={{ fontSize: "1rem", fontWeight: "700", color: "var(--emergency-red)" }}>
                {incident.emergency_type || incident.type || "Medical Emergency"}
              </div>
            </div>
            <div style={{ background: "var(--bg-main)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>TIMESTAMP</div>
              <div style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                {incident.created_at ? new Date(incident.created_at).toLocaleString() : "Just now"}
              </div>
            </div>
          </div>

          {/* Live Escalation Countdown Timer */}
          <EscalationTimer alert={incident} />

          <div style={{ marginBottom: "1rem", marginTop: "1rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "0.3rem" }}>
              LOCATION / FLAT DETAILS
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-main)" }}>
              📍 {incident.society || 'Green Valley'}, Block {incident.block || 'A'}, Flat {incident.flat_no || '101'}
            </div>
          </div>

          {/* LIVE RESIDENT GPS MAP CARD */}
          <div style={{
            background: "#0F172A",
            border: "1px solid #1E293B",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "1.25rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "#38BDF8", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>
                📡 LIVE RESIDENT GPS LOCATION
              </span>
              <span style={{ background: "#0284C7", color: "white", padding: "0.15rem 0.5rem", borderRadius: "6px", fontSize: "0.65rem", fontWeight: "800" }}>
                GPS ACTIVE
              </span>
            </div>

            <div style={{
              background: "#1E293B",
              borderRadius: "8px",
              padding: "0.85rem",
              textAlign: "center",
              marginBottom: "0.75rem",
              border: "1px solid #334155"
            }}>
              <div style={{ fontSize: "1.5rem" }}>📍</div>
              <div style={{ color: "#F8FAFC", fontWeight: "700", fontSize: "0.9rem" }}>
                {incident.society || 'Green Valley'}, Block {incident.block || 'A'}
              </div>
              <div style={{ color: "#94A3B8", fontSize: "0.75rem", fontFamily: "monospace", marginTop: "2px" }}>
                Lat: {(incident.latitude || 12.9716).toFixed(4)}° N, Lng: {(incident.longitude || 77.5946).toFixed(4)}° E (Accuracy: ±5m)
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${incident.latitude || 12.9716},${incident.longitude || 77.5946}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "#0EA5E9",
                color: "white",
                textDecoration: "none",
                textAlign: "center",
                fontWeight: "800",
                fontSize: "0.8rem",
                padding: "0.65rem",
                borderRadius: "8px"
              }}
            >
              🗺️ OPEN IN GOOGLE MAPS NAVIGATION →
            </a>
          </div>

          {/* Assigned Responder */}
          {incident.assigned_responder && (
            <div style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid #6366F1", padding: "0.85rem", borderRadius: "8px", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#818CF8", fontWeight: "700", marginBottom: "0.2rem" }}>ASSIGNED RESPONDER</div>
              <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>
                👤 {incident.assigned_responder.first_name} {incident.assigned_responder.last_name} ({incident.assigned_responder_role || 'Responder'})
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>📞 {incident.assigned_responder.phone}</div>
            </div>
          )}

          {/* Closure Documentation Form */}
          {showClosureForm ? (
            <form onSubmit={handleCloseIncidentSubmit} style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid #EF4444", padding: "1rem", borderRadius: "12px", marginBottom: "1rem" }}>
              <h4 style={{ color: "#EF4444", marginTop: 0, marginBottom: "0.75rem" }}>📋 Close Incident Documentation</h4>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.25rem" }}>RESOLUTION SUMMARY *</label>
                <textarea
                  className="form-input"
                  style={{ width: "100%", height: "70px", borderRadius: "8px" }}
                  placeholder="e.g. First aid administered. Patient is safe and stable."
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "700", marginBottom: "0.25rem" }}>REMARKS (OPTIONAL)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. No police report required."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="submit" className="btn btn-danger btn-sm" disabled={updating}>
                  🔒 Confirm & Close Incident
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowClosureForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {/* Incident Timeline Log */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.75rem" }}>
              🕒 REAL-TIME INCIDENT TIMELINE
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "150px", overflowY: "auto" }}>
              {timeline && timeline.length > 0 ? (
                timeline.map((ev, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.82rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366F1", flexShrink: 0 }}></span>
                    <span style={{ fontWeight: "700", color: "var(--text-main)" }}>{ev.action}</span>
                    <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>by {ev.performed_by} ({new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Logging initial events...</div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          {incident.status !== "Closed" && !showClosureForm && (
            <>
              {incident.status !== "Resolved" && (
                <button
                  className="btn btn-warning"
                  style={{ background: "#38BDF8", color: "white", border: "none" }}
                  onClick={() => handleStatusChange("In Progress")}
                  disabled={updating}
                >
                  ⚡ Mark In Progress
                </button>
              )}

              {incident.status !== "Resolved" && (
                <button
                  className="btn btn-success"
                  onClick={() => handleStatusChange("Resolved")}
                  disabled={updating}
                >
                  ✅ Resolve Emergency
                </button>
              )}

              {(activeRole === "Admin" || activeRole === "Security") && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleStatusChange("Closed")}
                  disabled={updating}
                >
                  🔒 Close Incident
                </button>
              )}
            </>
          )}

          <button className="btn btn-outline" onClick={onClose}>
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncidentDetailModal;
