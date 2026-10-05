import { useEffect, useState, useCallback } from "react";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import PwaInstallPrompt from "./components/PwaInstallPrompt";

// Pages & Portals
import Login from "./pages/Login";
import ResidentDashboard from "./pages/ResidentDashboard";
import EmergencyContacts from "./pages/EmergencyContacts";
import IncidentHistory from "./pages/IncidentHistory";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ManageSocieties from "./pages/ManageSocieties";
import ManageResidents from "./pages/ManageResidents";
import SecurityDashboard from "./pages/SecurityDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";

// Modals
import RaiseSOSModal from "./pages/RaiseSOSModal";
import IncidentDetailModal from "./pages/IncidentDetailModal";

// Services
import api, { authService, sosService, emergencyContactsService } from "./services/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Active Role State ("Resident", "Security", "Volunteer", "Admin")
  const [activeRole, setActiveRole] = useState("Resident");

  // Active View/Tab State
  const [activeView, setActiveView] = useState("resident-dashboard");

  // Emergency Contacts State
  const [userContacts, setUserContacts] = useState([]);

  // Emergency Alerts State
  const [activeAlerts, setActiveAlerts] = useState([]);

  // Modal States
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Toast Banner State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch contacts for logged in user
  const fetchUserContacts = useCallback(async () => {
    try {
      const resp = await emergencyContactsService.getAll();
      setUserContacts(resp.data || []);
    } catch {
      setUserContacts([]);
    }
  }, []);

  // Fetch logged in user profile and active data
  const fetchUserProfile = useCallback(async (authToken) => {
    setLoading(true);
    try {
      api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
      const response = await authService.getCurrentUser();
      const currentUser = response.data;
      setUser(currentUser);

      // Automatically set active role and dashboard view according to assigned account role
      const userRoles = currentUser.roles || [];
      const primaryRoleStr = currentUser.role || (userRoles.length > 0 ? userRoles[0] : "Resident");
      
      let normalizedRole = "Resident";
      const lowerStr = String(primaryRoleStr).toLowerCase();
      if (lowerStr.includes("admin")) normalizedRole = "Admin";
      else if (lowerStr.includes("sec") || lowerStr.includes("guard")) normalizedRole = "Security";
      else if (lowerStr.includes("vol")) normalizedRole = "Volunteer";
      else if (lowerStr.includes("res")) normalizedRole = "Resident";

      setActiveRole(normalizedRole);

      switch (normalizedRole) {
        case "Admin":
          setActiveView("admin-dashboard");
          break;
        case "Security":
          setActiveView("security-dashboard");
          break;
        case "Volunteer":
          setActiveView("volunteer-dashboard");
          break;
        case "Resident":
        default:
          setActiveView("resident-dashboard");
          break;
      }

      // Fetch user's contacts
      fetchUserContacts();

      // Fetch active alerts or set demo alert if demo user
      if (currentUser?.email === "alice.smith@example.com") {
        setActiveAlerts([
          {
            id: 104,
            emergency_type: "Medical Emergency",
            status: "Open",
            location_details: "Block A, Flat 302",
            resident_name: "Alice Smith",
            contact_phone: "+1 555-0192",
            created_at: new Date().toISOString(),
            notes: "Breathing difficulty. Needs medical responder.",
          },
        ]);
      } else {
        try {
          const alertsRes = await sosService.getActiveAlerts();
          setActiveAlerts(alertsRes.data || []);
        } catch {
          setActiveAlerts([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
        showToast("Session expired. Please log in again.", "info");
      } else {
        // Fallback mock user state for offline preview
        setUser({
          id: 1,
          first_name: "Alice",
          last_name: "Smith",
          email: "alice.smith@example.com",
          phone: "+1 555-0192",
          is_active: true,
        });
        setActiveAlerts([
          {
            id: 104,
            emergency_type: "Medical Emergency",
            status: "Open",
            location_details: "Block A, Flat 302",
            resident_name: "Alice Smith",
            contact_phone: "+1 555-0192",
            created_at: new Date().toISOString(),
            notes: "Breathing difficulty. Needs medical responder.",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchUserContacts]);

  useEffect(() => {
    if (token) {
      Promise.resolve().then(() => fetchUserProfile(token));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(null);
      setUserContacts([]);
      setActiveAlerts([]);
    }
  }, [token, fetchUserProfile]);

  // Handle Login success
  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setToken("");
    setUser(null);
    setUserContacts([]);
    setActiveAlerts([]);
  };

  // Handle Role Switch
  const handleRoleChange = (newRole) => {
    setActiveRole(newRole);
    // Switch default tab according to role
    switch (newRole) {
      case "Admin":
        setActiveView("admin-dashboard");
        break;
      case "Security":
        setActiveView("security-dashboard");
        break;
      case "Volunteer":
        setActiveView("volunteer-dashboard");
        break;
      case "Resident":
      default:
        setActiveView("resident-dashboard");
        break;
    }
    showToast(`Switched view to ${newRole} mode`, "info");
  };

  // Trigger new SOS Alert
  const handleRaiseSOS = async (sosData = {}) => {
    try {
      const emergencyType = sosData.emergency_type || sosData.category || "Medical Emergency";
      const locationDetails = sosData.location_details || sosData.flat_no || "Block A, Flat 302";
      const notes = sosData.notes || sosData.remarks || "";

      const newAlert = {
        id: Math.floor(100 + Math.random() * 900),
        emergency_type: emergencyType,
        status: "Open",
        location_details: locationDetails,
        resident_name: user ? `${user.first_name} ${user.last_name}` : "Resident",
        contact_phone: sosData.contact_phone || "+1 555-0192",
        notes: notes,
        created_at: new Date().toISOString(),
      };

      const response = await sosService.raiseAlert({
        emergency_type: emergencyType,
        location_details: locationDetails,
        notes: notes,
      });
      setActiveAlerts([newAlert, ...activeAlerts]);
      showToast("🚨 EMERGENCY SOS BROADCASTED TO ALL RESPONDERS!", "emergency");
      return response;
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Emergency SOS could not be dispatched.", "error");
      throw err;
    }
  };

  // Update incident status
  const handleUpdateIncidentStatus = (incidentId, newStatus) => {
    setActiveAlerts((prev) =>
      prev.map((item) => (item.id === incidentId ? { ...item, status: newStatus } : item))
    );

    if (selectedIncident && selectedIncident.id === incidentId) {
      setSelectedIncident((prev) => ({ ...prev, status: newStatus }));
    }

    showToast(`Emergency Incident #${incidentId} status updated to ${newStatus}`);
  };

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🚨</div>
          <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", fontWeight: "600" }}>
            Connecting to Community Emergency Network...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: 75,
            right: 24,
            zIndex: 1000,
            background: toastMessage.type === "emergency" ? "var(--emergency-red)" : "var(--primary)",
            color: "white",
            padding: "0.85rem 1.5rem",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-xl)",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span>{toastMessage.type === "emergency" ? "⚡" : "ℹ️"}</span>
          <span>{toastMessage.message}</span>
        </div>
      )}

      {user ? (
        <>
          <Navbar
            user={user}
            activeRole={activeRole}
            onRoleChange={handleRoleChange}
            onLogout={handleLogout}
            activeAlertCount={activeAlerts.filter((a) => a.status === "Open" || a.status === "Pending").length}
            onTriggerSOS={() => setShowSOSModal(true)}
          />

          <div className="app-body">
            <Sidebar
              activeRole={activeRole}
              activeView={activeView}
              onViewChange={setActiveView}
              activeAlertCount={activeAlerts.filter((a) => a.status === "Open").length}
            />

            <main className="main-content">
              {/* Resident Views */}
              {activeView === "resident-dashboard" && (
                <ResidentDashboard
                  user={user}
                  activeAlerts={activeAlerts}
                  onTriggerSOS={(sosDetails) => {
                    if (sosDetails) {
                      handleRaiseSOS(sosDetails);
                    } else {
                      setShowSOSModal(true);
                    }
                  }}
                  onViewChange={setActiveView}
                  onSelectIncident={setSelectedIncident}
                />
              )}
              {activeView === "emergency-contacts" && (
                <EmergencyContacts
                  user={user}
                  contacts={userContacts}
                  onRefreshContacts={fetchUserContacts}
                />
              )}
              {activeView === "incident-history" && (
                <IncidentHistory incidents={activeAlerts} onSelectIncident={setSelectedIncident} />
              )}
              {activeView === "notifications" && <Notifications />}
              {activeView === "profile" && <Profile user={user} />}

              {/* Admin Views */}
              {activeView === "admin-dashboard" && (
                <AdminDashboard onViewChange={setActiveView} onSelectIncident={setSelectedIncident} />
              )}
              {activeView === "manage-societies" && <ManageSocieties />}
              {activeView === "manage-residents" && <ManageResidents />}

              {/* Security Guard View */}
              {activeView === "security-dashboard" && (
                <SecurityDashboard
                  activeAlerts={activeAlerts}
                  onSelectIncident={setSelectedIncident}
                  onUpdateStatus={handleUpdateIncidentStatus}
                />
              )}

              {/* Volunteer View */}
              {activeView === "volunteer-dashboard" && (
                <VolunteerDashboard
                  activeAlerts={activeAlerts}
                  onSelectIncident={setSelectedIncident}
                />
              )}
            </main>
          </div>

          {/* Global SOS Modal */}
          <RaiseSOSModal
            isOpen={showSOSModal}
            onClose={() => setShowSOSModal(false)}
            onRaiseSuccess={handleRaiseSOS}
          />

          {/* Incident Details Modal */}
          <IncidentDetailModal
            incident={selectedIncident}
            isOpen={Boolean(selectedIncident)}
            onClose={() => setSelectedIncident(null)}
            onUpdateStatus={handleUpdateIncidentStatus}
            activeRole={activeRole}
          />
        </>
      ) : (
        <main className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <Login onLoginSuccess={handleLoginSuccess} />
        </main>
      )}

      {/* PWA Installation & Offline Alert Component */}
      <PwaInstallPrompt />
    </div>
  );
}

export default App;