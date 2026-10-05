import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

function Profile({ user, onSaveProfile }) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);

  const demo = user?.email === "alice.smith@example.com";
  const [firstName, setFirstName] = useState(() => user?.first_name || "");
  const [lastName, setLastName] = useState(() => user?.last_name || "");
  const [email] = useState(() => user?.email || "");
  const [phone, setPhone] = useState(() => user?.phone || user?.phone_number || "");
  const [bloodGroup, setBloodGroup] = useState(() => demo ? "O Positive (O+)" : (user?.blood_group || "Not Specified"));
  const [medicalConditions, setMedicalConditions] = useState(() => demo ? "Asthma (Inhaler required)" : (user?.medical_conditions || "None reported"));
  const [allergies, setAllergies] = useState(() => demo ? "Penicillin Allergy" : (user?.allergies || "No known allergies"));
  const [emergencyInstructions, setEmergencyInstructions] = useState(() => demo ? "Key under welcome mat for medical first responders." : (user?.emergency_instructions || "Call primary emergency contact immediately."));
  const [society] = useState(() => user?.society || "Demo Society");
  const [flat] = useState(() => user?.flat_no ? `Flat ${user.flat_no}` : (demo ? "Block A, Flat 302" : "Flat A101"));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveProfile) {
      onSaveProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        blood_group: bloodGroup,
        medical_conditions: medicalConditions,
        allergies,
        emergency_instructions: emergencyInstructions,
      });
    }
    setIsEditing(false);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">{t("profile")}</h1>
          <p className="section-subtitle">
            Essential profile information accessed by emergency first responders during critical incidents.
          </p>
        </div>
        <button
          className={`btn ${isEditing ? "btn-outline" : "btn-primary"}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel Editing" : "✏️ Edit Profile ID"}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Personal Information Card */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "1.5rem" }}>👤</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Personal Information</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">FIRST NAME</label>
                <input
                  type="text"
                  className="form-input"
                  value={firstName}
                  disabled={!isEditing}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">LAST NAME</label>
                <input
                  type="text"
                  className="form-input"
                  value={lastName}
                  disabled={!isEditing}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">EMAIL ADDRESS</label>
              <input type="email" className="form-input" value={email} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">PHONE NUMBER</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                disabled={!isEditing}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Residence & Location Card */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🏢</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Residence & Society Mapping</h3>
            </div>

            <div className="form-group">
              <label className="form-label">HOUSING SOCIETY</label>
              <input type="text" className="form-input" value={society} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">BLOCK & FLAT NUMBER</label>
              <input type="text" className="form-input" value={flat} disabled />
            </div>

            <div style={{ background: "var(--bg-main)", padding: "0.75rem", borderRadius: "var(--radius-md)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              🔒 Flat mapping is verified by Housing Society Admin to prevent unauthorized location registration.
            </div>
          </div>

          {/* Emergency Medical ID Card */}
          <div className="card" style={{ gridColumn: "1 / -1", borderLeft: "4px solid var(--emergency-red)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🩺</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--emergency-red)" }}>
                Emergency First Responder Medical Badge
              </h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">BLOOD GROUP</label>
                <input
                  type="text"
                  className="form-input"
                  value={bloodGroup}
                  disabled={!isEditing}
                  onChange={(e) => setBloodGroup(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">KNOWN ALLERGIES</label>
                <input
                  type="text"
                  className="form-input"
                  value={allergies}
                  disabled={!isEditing}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">EXISTING MEDICAL CONDITIONS / MEDICATIONS</label>
              <input
                type="text"
                className="form-input"
                value={medicalConditions}
                disabled={!isEditing}
                onChange={(e) => setMedicalConditions(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SPECIAL FIRST RESPONDER INSTRUCTIONS</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={emergencyInstructions}
                disabled={!isEditing}
                onChange={(e) => setEmergencyInstructions(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              💾 Save Profile Updates
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default Profile;
