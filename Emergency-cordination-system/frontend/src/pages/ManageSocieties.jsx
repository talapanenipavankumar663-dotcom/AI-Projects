import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

function ManageSocieties() {
  const { t } = useLanguage();
  const [showAddSocietyModal, setShowAddSocietyModal] = useState(false);
  const [societies, setSocieties] = useState([
    { id: 1, name: "Green Valley Heights", address: "124 Park Avenue", city: "Springfield", state: "IL", pincode: "62701", total_blocks: 4, total_flats: 96 },
    { id: 2, name: "Sunrise Apartments", address: "500 Ocean Boulevard", city: "Metro City", state: "CA", pincode: "90210", total_blocks: 2, total_flats: 48 },
    { id: 3, name: "Orchid Residency", address: "88 Hilltop Road", city: "Highland", state: "NY", pincode: "10001", total_blocks: 3, total_flats: 60 },
  ]);

  // Form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const handleAddSociety = (e) => {
    e.preventDefault();
    const newSociety = {
      id: societies.length + 1,
      name,
      address,
      city,
      state,
      pincode,
      total_blocks: 2,
      total_flats: 40,
    };
    setSocieties([...societies, newSociety]);
    setShowAddSocietyModal(false);
    setName("");
    setAddress("");
    setCity("");
    setState("");
    setPincode("");
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">{t("manageSocieties")}</h1>
          <p className="section-subtitle">
            Configure residential societies, building blocks, and flat numbers for localized emergency response dispatch.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddSocietyModal(true)}>
          + {t("addSociety")}
        </button>
      </div>

      {/* Societies Grid Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {societies.map((s) => (
          <div key={s.id} className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.75rem" }}>🏢</span>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>{s.name}</h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {s.city}, {s.state} ({s.pincode})
                  </span>
                </div>
              </div>
              <span className="status-pill resolved">Active</span>
            </div>

            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              📍 {s.address}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", background: "var(--bg-main)", padding: "0.85rem", borderRadius: "var(--radius-md)" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>TOTAL BLOCKS</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>{s.total_blocks} Blocks</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>TOTAL FLATS</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>{s.total_flats} Flats</div>
              </div>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                Configure Blocks
              </button>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                Manage Flats
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Society Modal */}
      {showAddSocietyModal && (
        <div className="modal-overlay" onClick={() => setShowAddSocietyModal(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Society</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAddSocietyModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSociety}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">SOCIETY NAME</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Royal Palms Community"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">STREET ADDRESS</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 772 Grand Vista Lane"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">CITY</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Chicago"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">STATE</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="IL"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">PINCODE</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="60601"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddSocietyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Society
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageSocieties;
