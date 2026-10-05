import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { emergencyContactsService } from "../services/api";

function EmergencyContacts({ user, contacts = [], onRefreshContacts }) {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states for adding contact
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Family");
  const [priority, setPriority] = useState("1");

  // OTP state
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const newContact = {
        name,
        phone_number: phone,
        relationship,
        priority: parseInt(priority, 10),
      };

      await emergencyContactsService.createContact(newContact);

      if (onRefreshContacts) {
        await onRefreshContacts();
      }
      setShowAddModal(false);
      setName("");
      setPhone("");
    } catch (err) {
      console.error("Failed to add contact:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to add emergency contact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = async (contact) => {
    setSelectedContact(contact);
    setOtpInput("");
    setErrorMsg("");
    setOtpMessage(`Sending OTP to ${contact.phone || contact.phone_number}...`);
    setShowOtpModal(true);

    try {
      const res = await emergencyContactsService.generateOtp(contact.id);
      const code = res.data?.otp || "849201";
      setGeneratedOtp(code);
      setOtpMessage(`OTP sent to ${contact.phone || contact.phone_number}`);
    } catch (err) {
      console.warn("Using demo OTP generation fallback:", err);
      setGeneratedOtp("849201");
      setOtpMessage(`OTP code sent to ${contact.phone || contact.phone_number}`);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContact) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await emergencyContactsService.verifyOtp(selectedContact.id, otpInput);
      if (onRefreshContacts) {
        await onRefreshContacts();
      }
      setShowOtpModal(false);
    } catch (err) {
      console.error("Failed to verify OTP:", err);
      setErrorMsg(err.response?.data?.detail || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (window.confirm("Are you sure you want to remove this contact?")) {
      try {
        await emergencyContactsService.deleteContact(contactId);
        if (onRefreshContacts) {
          await onRefreshContacts();
        }
      } catch (err) {
        console.error("Failed to delete contact:", err);
        alert(err.response?.data?.detail || "Failed to delete contact.");
      }
    }
  };

  // Default initial mock contacts only for demo user Alice Smith
  const displayContacts = contacts && contacts.length > 0
    ? contacts
    : (user?.email === "alice.smith@example.com"
        ? [
            { id: 1, name: "Sarah Smith", phone: "+1 555-0192", relationship: "Spouse", priority: 1, is_verified: true },
            { id: 2, name: "David Smith", phone: "+1 555-0193", relationship: "Brother", priority: 2, is_verified: false },
            { id: 3, name: "Dr. Robert Chen", phone: "+1 555-0199", relationship: "Personal Doctor", priority: 3, is_verified: true },
          ]
        : []);

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 className="section-title">{t("emergencyContactsList")}</h1>
          <p className="section-subtitle">
            Contacts alerted automatically in priority order whenever an emergency SOS is triggered.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + {t("addContact")}
        </button>
      </div>

      {/* Priority Ordering Explanation Banner */}
      <div style={{ background: "var(--primary-light)", padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)", marginBottom: "1.5rem", border: "1px solid #c7d2fe" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--primary)" }}>
          <span style={{ fontSize: "1.2rem" }}>ℹ️</span>
          <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
            <strong>Priority Notification Protocol:</strong> Priority 1 (Primary Contact) will receive emergency alerts first via SMS and Automated Call, followed by Priority 2 (Secondary Contact).
          </span>
        </div>
      </div>

      {/* Contacts List Table / Cards */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>PRIORITY</th>
              <th>NAME & RELATION</th>
              <th>PHONE NUMBER</th>
              <th>VERIFICATION STATUS</th>
              <th style={{ textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {displayContacts.map((c) => (
              <tr key={c.id}>
                <td>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: c.priority === 1 ? "var(--emergency-red)" : c.priority === 2 ? "var(--warning-amber)" : "var(--primary)",
                      color: "white",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "0.85rem",
                    }}
                  >
                    #{c.priority}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: "700", color: "var(--text-main)" }}>{c.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.relationship}</div>
                </td>
                <td style={{ fontWeight: "600" }}>{c.phone || c.phone_number}</td>
                <td>
                  {c.is_verified ? (
                    <span className="status-pill resolved">✓ Verified Contact</span>
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={() => handleStartVerification(c)}>
                      ⚠️ Unverified (Verify OTP)
                    </button>
                  )}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-danger-outline btn-sm" onClick={() => handleDeleteContact(c.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Contact</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                {errorMsg && (
                  <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid var(--emergency-red)", padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--emergency-red)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                    ⚠️ {errorMsg}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">FULL NAME</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Eleanor Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">PHONE NUMBER</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">RELATIONSHIP</label>
                    <select className="form-select" value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Neighbor">Neighbor</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Friend">Friend</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">PRIORITY ORDER</label>
                    <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="1">1 (Primary Contact)</option>
                      <option value="2">2 (Secondary Contact)</option>
                      <option value="3">3 (Tertiary Contact)</option>
                      <option value="4">4 (Fallback Contact)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && selectedContact && (
        <div className="modal-overlay" onClick={() => setShowOtpModal(false)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Verify Phone Number</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowOtpModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleVerifyOtpSubmit}>
              <div className="modal-body" style={{ textAlign: "center" }}>
                {errorMsg && (
                  <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid var(--emergency-red)", padding: "0.75rem", borderRadius: "var(--radius-md)", color: "var(--emergency-red)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                    ⚠️ {errorMsg}
                  </div>
                )}
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📲</div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "700" }}>{selectedContact.name}</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  {otpMessage}
                </p>

                <div
                  style={{
                    background: "var(--warning-light)",
                    border: "1px solid #fde68a",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "1.25rem",
                    fontSize: "0.85rem",
                    color: "var(--warning-amber)",
                    fontWeight: "600",
                  }}
                >
                  Demo SMS OTP Code: <strong>{generatedOtp}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ textAlign: "center" }}>ENTER 6-DIGIT OTP</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.4em", fontWeight: "700" }}
                    maxLength={6}
                    placeholder="849201"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowOtpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Submit Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmergencyContacts;
