import { useState, useRef, useEffect } from "react";
import { authService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi (हिंदी)", flag: "🇮🇳" },
  { code: "ta", name: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "te", name: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "bn", name: "Bengali (বাংলা)", flag: "🇧🇩" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)", flag: "🇮🇳" },
];

function Login({ onLoginSuccess }) {
  const { language, changeLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    setSuccess("");
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      if (onLoginSuccess) {
        onLoginSuccess(access_token);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await authService.login(demoEmail, demoPass);
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      if (onLoginSuccess) {
        onLoginSuccess(access_token);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Demo login failed. Please check backend status."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await authService.register({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
      });
      
      setSuccess("Account created successfully! Logging you in...");
      const loginRes = await authService.login(email, password);
      const { access_token } = loginRes.data;
      localStorage.setItem("token", access_token);
      if (onLoginSuccess) {
        onLoginSuccess(access_token);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Registration failed. Please verify your details."
      );
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: "Alice Smith", roleTag: "Resident", email: "alice.smith@example.com", pass: "password123", icon: "🏠", bg: "#EEF2FF", color: "#4F46E5" },
    { label: "Officer Marcus", roleTag: "Security Guard", email: "guard.marcus@example.com", pass: "password123", icon: "🛡️", bg: "#FFF1F2", color: "#E11D48" },
    { label: "Dr. Clara Oswald", roleTag: "Volunteer Doctor", email: "clara.o@example.com", pass: "password123", icon: "🤝", bg: "#ECFDF5", color: "#059669" },
    { label: "System Admin", roleTag: "Admin Portal", email: "admin@example.com", pass: "password123", icon: "📊", bg: "#FEF3C7", color: "#D97706" },
  ];

  const activeLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="login-page-container">
      {/* Background Animated Elements */}
      <div className="login-bg-glow glow-1"></div>
      <div className="login-bg-glow glow-2"></div>
      <div className="login-bg-grid"></div>

      <div className="login-split-wrapper">
        {/* Left Side: Brand Showcase Panel */}
        <div className="login-showcase-panel">
          <div className="showcase-status-pill">
            <span className="showcase-pulse-dot"></span>
            <span>EMERGX CORE ENGINE • 24/7 OPERATIONAL</span>
          </div>

          <div className="showcase-brand-hero">
            <div className="emergx-logo-badge">
              <span className="logo-icon">🚨</span>
              <span className="logo-spark">⚡</span>
            </div>
            <h1 className="showcase-title">
              Emerg<span className="emergx-x-accent">X</span>
            </h1>
          </div>

          <p className="showcase-tagline">
            Next-Gen Emergency Coordination &amp; Citizen Rescue Network
          </p>

          <p className="showcase-description">
            Ultra-fast emergency escalation linking residents, housing security guards, verified CPR neighborhood volunteers, and designated guardians within seconds.
          </p>

          <div className="showcase-metrics-bar">
            <div className="metric-item">
              <span className="metric-value">&lt; 5s</span>
              <span className="metric-label">Escalation Latency</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">4 Tiers</span>
              <span className="metric-label">Auto Failover</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">100%</span>
              <span className="metric-label">Encrypted Dispatch</span>
            </div>
          </div>

          <div className="showcase-features-list">
            <div className="showcase-feature-card">
              <div className="feature-icon-box red">⚡</div>
              <div>
                <h4>Automated 4-Tier Escalation</h4>
                <p>Instant failover routing to security, volunteers, primary, and secondary guardians.</p>
              </div>
            </div>

            <div className="showcase-feature-card">
              <div className="feature-icon-box blue">🛡️</div>
              <div>
                <h4>Real-Time Guard &amp; Gate Alerting</h4>
                <p>Live flat-specific GPS alert dispatch straight to duty guard devices.</p>
              </div>
            </div>

            <div className="showcase-feature-card">
              <div className="feature-icon-box green">🤝</div>
              <div>
                <h4>Verified CPR &amp; First-Aid Responders</h4>
                <p>Instant proximity dispatch to certified neighborhood medical volunteers.</p>
              </div>
            </div>
          </div>

          <div className="showcase-footer-trust">
            <span>🛡️ Enterprise Security</span>
            <span>•</span>
            <span>🔒 End-to-End Encrypted</span>
            <span>•</span>
            <span>🌐 Multi-Language Ready</span>
          </div>
        </div>

        {/* Right Side: Glassmorphic Auth Form Panel */}
        <div className="login-form-panel">
          <div className="login-glass-card">
            {/* Language Selection Header */}
            <div className="login-language-section" ref={langDropdownRef}>
              <button
                type="button"
                className="login-lang-toggle-btn"
                onClick={() => setIsLangOpen(!isLangOpen)}
                aria-label="Select Language"
              >
                <span className="lang-icon">🌐</span>
                <span className="lang-active-label">
                  {activeLangObj.flag} {activeLangObj.name.split(" ")[0]}
                </span>
                <span className={`lang-chevron ${isLangOpen ? "open" : ""}`}>▾</span>
              </button>

              {isLangOpen && (
                <div className="login-lang-dropdown-menu">
                  <div className="lang-dropdown-header">Select Interface Language</div>
                  {LANGUAGES.map((langItem) => (
                    <button
                      key={langItem.code}
                      type="button"
                      className={`lang-dropdown-item ${language === langItem.code ? "active" : ""}`}
                      onClick={() => {
                        changeLanguage(langItem.code);
                        setIsLangOpen(false);
                      }}
                    >
                      <span className="lang-flag">{langItem.flag}</span>
                      <span className="lang-name">{langItem.name}</span>
                      {language === langItem.code && <span className="lang-checkmark">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Header Branding */}
            <div className="login-brand-header">
              <div className="login-logo-ring">
                <span className="ring-icon">🚨</span>
              </div>
              <h2 className="login-card-title">
                Welcome to <span className="brand-highlight">EmergX</span>
              </h2>
              <p className="login-card-subtitle">Select your emergency access portal mode</p>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="login-tabs-segmented">
              <button
                type="button"
                className={`login-tab-btn ${activeTab === "login" ? "active" : ""}`}
                onClick={() => handleTabChange("login")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`login-tab-btn ${activeTab === "signup" ? "active" : ""}`}
                onClick={() => handleTabChange("signup")}
              >
                Create Account
              </button>
            </div>

            {/* Error / Success Alerts */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {activeTab === "login" ? (
              <>
                <form onSubmit={handleLoginSubmit}>
                  <div className="login-input-group">
                    <label className="login-label" htmlFor="login-email">EMAIL ADDRESS</label>
                    <div className="login-input-wrapper">
                      <span className="login-input-icon">✉️</span>
                      <input
                        id="login-email"
                        type="email"
                        className="login-input"
                        placeholder="resident@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="login-input-group">
                    <label className="login-label" htmlFor="login-password">PASSWORD</label>
                    <div className="login-input-wrapper">
                      <span className="login-input-icon">🔒</span>
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        className="login-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-submit-premium"
                    disabled={loading}
                  >
                    {loading ? "Authenticating..." : "CONTINUE TO EMERGX DASHBOARD →"}
                  </button>
                </form>

                {/* Quick Demo Login Chips */}
                <div className="demo-accounts-box">
                  <div className="demo-title-row">
                    <span className="demo-title">⚡ ONE-CLICK DEMO ACCOUNTS</span>
                    <span className="demo-sub">Instant Login</span>
                  </div>
                  <div className="demo-chips-grid">
                    {demoAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        className="demo-chip-btn"
                        disabled={loading}
                        onClick={() => handleQuickDemoLogin(acc.email, acc.pass)}
                      >
                        <span className="demo-chip-icon">{acc.icon}</span>
                        <div className="demo-chip-info">
                          <div className="demo-chip-name">{acc.label}</div>
                          <div className="demo-chip-role" style={{ color: acc.color }}>
                            {acc.roleTag}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSignupSubmit}>
                <div className="signup-grid-row">
                  <div className="login-input-group">
                    <label className="login-label">FIRST NAME</label>
                    <div className="login-input-wrapper">
                      <span className="login-input-icon">👤</span>
                      <input
                        type="text"
                        className="login-input"
                        placeholder="Jane"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="login-input-group">
                    <label className="login-label">LAST NAME</label>
                    <div className="login-input-wrapper">
                      <span className="login-input-icon">👤</span>
                      <input
                        type="text"
                        className="login-input"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="login-input-group">
                  <label className="login-label">EMAIL ADDRESS</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">✉️</span>
                    <input
                      type="email"
                      className="login-input"
                      placeholder="jane.doe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="login-input-group">
                  <label className="login-label">PHONE NUMBER</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">📱</span>
                    <input
                      type="tel"
                      className="login-input"
                      placeholder="+1 (555) 019-2834"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="login-input-group">
                  <label className="login-label">CREATE PASSWORD</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="login-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-submit-premium"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "JOIN EMERGX NETWORK →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;