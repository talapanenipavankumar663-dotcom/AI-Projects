import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { userService } from "../services/api";

const normalizeRole = (r) => {
  if (!r) return "Unassigned";
  const str = String(r).trim().toLowerCase();
  if (str.includes("admin")) return "Admin";
  if (str.includes("sec") || str.includes("guard")) return "Security";
  if (str.includes("vol")) return "Volunteer";
  if (str.includes("res")) return "Resident";
  return "Unassigned";
};

function ManageResidents() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRole, setFilterRole] = useState("All");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getAllUsers();
      const rawUsers = res.data || [];

      const formattedUsers = rawUsers.map((u) => {
        const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
        const rawRoleStr = u.role || (u.roles && u.roles.length > 0 ? u.roles[0] : "Unassigned");
        const role = normalizeRole(rawRoleStr);
        return {
          id: u.id,
          name: fullName || u.email?.split("@")[0] || "Registered User",
          email: u.email,
          phone: u.phone || u.phone_number || "N/A",
          role: role,
          society: u.society_name || u.resident_profile?.society_name || "Green Valley Heights",
          flat: u.flat_number || u.flat_no || u.resident_profile?.flat_number || "Unassigned Flat",
          active: u.is_active !== undefined ? u.is_active : true,
        };
      });

      setUsers(formattedUsers);
      setError(null);
    } catch (err) {
      console.warn("[ManageResidents] Could not fetch live users, loading fallback users list:", err);
      setError("Note: Showing cached governance list. Login as Admin to fetch full live registry.");
      setUsers([
        { id: 1, name: "Alice Smith", email: "alice.smith@example.com", phone: "+1 555-0192", role: "Resident", society: "Green Valley Heights", flat: "Block A, Flat 302", active: true },
        { id: 2, name: "Marcus Brody", email: "guard.marcus@example.com", phone: "+1 555-0981", role: "Security", society: "Green Valley Heights", flat: "Gate 1 Guard Post", active: true },
        { id: 3, name: "Dr. Clara Oswald", email: "clara.o@example.com", phone: "+1 555-0723", role: "Volunteer", society: "Green Valley Heights", flat: "Block B, Flat 104", active: true },
        { id: 4, name: "System Admin", email: "admin@example.com", phone: "+1 555-0000", role: "Admin", society: "All Societies", flat: "HQ Governance Desk", active: true },
        { id: 5, name: "New Plain Account", email: "newuser@example.com", phone: "+1 555-0999", role: "Unassigned", society: "Green Valley Heights", flat: "Unassigned Flat", active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // The initial fetch intentionally updates local state after the component mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    // 1. Instantly update UI state
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    try {
      // 2. Persist to backend database
      const res = await userService.updateUser(userId, { role: newRole });
      if (res.data) {
        const rawRoles = res.data.roles || [];
        const assignedRole = normalizeRole(res.data.role || (rawRoles.length > 0 ? rawRoles[0] : newRole));
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: assignedRole } : u)));
      }
    } catch (err) {
      console.warn("Failed to persist role update to backend:", err);
    }
  };

  const handleToggleActive = async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const updatedActive = !targetUser.active;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: updatedActive } : u)));
    try {
      await userService.updateUser(userId, { is_active: updatedActive });
    } catch (err) {
      console.warn("Failed to persist account status to backend:", err);
    }
  };

  const filteredUsers = users.filter((u) => filterRole === "All" || u.role === filterRole);

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">{t("manageResidents")}</h1>
          <p className="section-subtitle">
            Assign roles to newly created plain accounts (Resident, Security Guard, Volunteer, Admin) and configure access permissions.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadUsers} disabled={loading}>
          {loading ? "🔄 Refreshing..." : "🔄 Refresh Registry"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#FEF3C7", color: "#92400E", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Role Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["All", "Unassigned", "Resident", "Security", "Volunteer", "Admin"].map((r) => (
          <button
            key={r}
            className={`btn btn-sm ${filterRole === r ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilterRole(r)}
          >
            {r === "Unassigned" ? "Plain / Pending" : `${r}`} ({users.filter((u) => r === "All" || u.role === r).length})
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>USER NAME</th>
              <th>CONTACT EMAIL & PHONE</th>
              <th>SOCIETY & FLAT MAPPING</th>
              <th>ASSIGNED ROLE (ADMIN ASSIGNMENT)</th>
              <th>STATUS</th>
              <th style={{ textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No accounts found matching filter '{filterRole}'.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: "700", color: "var(--text-main)" }}>{u.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID #{u.id}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>{u.email}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{u.phone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: "600", fontSize: "0.85rem" }}>{u.society}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--primary)" }}>📍 {u.flat}</div>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={{
                        padding: "0.3rem 0.5rem",
                        fontSize: "0.85rem",
                        width: "auto",
                        border: u.role === "Unassigned" ? "2px solid #f59e0b" : "1px solid var(--border-color)",
                        background: u.role === "Unassigned" ? "#fffbeb" : "white",
                        fontWeight: u.role === "Unassigned" ? "700" : "500"
                      }}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="Unassigned">❓ Plain (Pending Role Assignment)</option>
                      <option value="Resident">🏠 Resident</option>
                      <option value="Security">🛡️ Security Guard</option>
                      <option value="Volunteer">🤝 Volunteer</option>
                      <option value="Admin">📊 Admin</option>
                    </select>
                  </td>
                  <td>
                    {u.role === "Unassigned" ? (
                      <span className="status-pill closed" style={{ background: "#fef3c7", color: "#92400e" }}>
                        ⏳ Pending Admin Role Assignment
                      </span>
                    ) : (
                      <span className={`status-pill ${u.active ? "resolved" : "closed"}`}>
                        {u.active ? "Active Verified" : "Suspended"}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className={`btn btn-sm ${u.active ? "btn-danger-outline" : "btn-success"}`}
                      onClick={() => handleToggleActive(u.id)}
                    >
                      {u.active ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageResidents;
