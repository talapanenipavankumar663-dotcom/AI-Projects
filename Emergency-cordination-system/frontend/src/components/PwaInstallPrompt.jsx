import { useState, useEffect } from "react";

function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInstalled] = useState(() => {
    if (typeof window !== "undefined") {
      return Boolean(
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone ||
        document.referrer.includes("android-app://")
      );
    }
    return false;
  });
  const [browserType] = useState(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) return "ios";
      if (/android/.test(ua)) return "android";
      if (/chrome|crios/.test(ua)) return "chrome";
      if (/edg/.test(ua)) return "edge";
    }
    return "other";
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Auto show PWA popup modal on page load after a brief delay if not dismissed this session and not standalone
    const timer = setTimeout(() => {
      const isDismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    }, 600);

    // Listen for beforeinstallprompt event from browser
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isDismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    };

    // Listen for custom open event triggered by Navbar or user action
    const handleOpenModal = () => {
      setShowInstallBanner(false);
      setShowGuideModal(true);
    };

    // Monitor Online / Offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("open-pwa-modal", handleOpenModal);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open-pwa-modal", handleOpenModal);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle click on Install Now / Install App button: Hide card and open guide modal
  const handleInstallClick = () => {
    setShowInstallBanner(false);
    setShowGuideModal(true);
  };

  // Trigger native browser 1-click install prompt from inside guide modal
  const handleTriggerNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] Modal install prompt outcome: ${outcome}`);
        setDeferredPrompt(null);
        setShowInstallBanner(false);
        setShowGuideModal(false);
      } catch (err) {
        console.warn("[PWA] Modal prompt trigger failed:", err);
      }
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  };

  return (
    <>
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="pwa-offline-bar">
          <div className="pwa-offline-content">
            <span className="pwa-pulse-yellow"></span>
            <span>⚠️ <strong>Offline Mode:</strong> Network disconnected. Local cached emergency procedures &amp; contacts active.</span>
          </div>
        </div>
      )}

      {/* PWA Install Floating Card / Popup Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="pwa-install-container">
          <div className="pwa-install-card">
            <div className="pwa-card-header">
              <div className="pwa-icon-box">📲</div>
              <div className="pwa-header-text">
                <span className="pwa-badge">PROGRESSIVE WEB APP READY</span>
                <h4>Install Citizen Emergency App</h4>
              </div>
              <button type="button" className="btn-pwa-close" onClick={handleDismiss} title="Dismiss">
                ✕
              </button>
            </div>

            <p className="pwa-card-desc">
              Add to your home screen for 1-tap emergency dispatch &amp; full offline support.
            </p>

            <div className="pwa-card-footer">
              <button type="button" className="btn-pwa-install" onClick={handleInstallClick} style={{ width: "100%" }}>
                {deferredPrompt ? "⚡ Install Now" : "📲 Install App"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Installed Badge indicator */}
      {isInstalled && (
        <div className="pwa-installed-indicator" title="Running in Progressive Web App (PWA) Standalone Mode">
          <span>📱 PWA App Mode Active</span>
        </div>
      )}

      {/* Installation Guide Modal (opened when Install Now / Install App is clicked) */}
      {showGuideModal && (
        <div className="modal-overlay pwa-guide-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="modal-content pwa-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.75rem" }}>📲</span>
                <div>
                  <h3 className="modal-title">How to Install Citizen Emergency App</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                    Step-by-step guide to add app to your home screen or desktop
                  </p>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowGuideModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* Direct 1-click browser install button if available or Fallback Action */}
              {deferredPrompt ? (
                <div style={{ background: "rgba(0, 113, 227, 0.08)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(0, 113, 227, 0.2)", marginBottom: "1.25rem", textAlign: "center" }}>
                  <p style={{ fontWeight: "600", color: "#0071e3", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    🎉 Your browser supports 1-click automatic installation!
                  </p>
                  <button type="button" className="btn btn-primary" onClick={handleTriggerNativeInstall} style={{ padding: "0.65rem 1.75rem", borderRadius: "20px", fontWeight: "700", fontSize: "0.9rem" }}>
                    ⚡ Click Here to Install Automatically
                  </button>
                </div>
              ) : (
                <div style={{ background: "rgba(99, 102, 241, 0.08)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.2)", marginBottom: "1.25rem", textAlign: "center" }}>
                  <p style={{ fontWeight: "600", color: "var(--primary)", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    📲 Install Citizen Emergency App to Home Screen
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-primary" onClick={handleCopyLink} style={{ padding: "0.6rem 1.25rem", borderRadius: "20px", fontWeight: "700", fontSize: "0.85rem" }}>
                      {copied ? "✓ App Link Copied to Clipboard!" : "📋 Copy App Link & View Installation Steps"}
                    </button>
                  </div>
                  {copied && (
                    <p style={{ fontSize: "0.8rem", color: "var(--success-green)", fontWeight: "600", marginTop: "0.5rem" }}>
                      ✓ Link copied! Use browser menu (⋮ or ⎋) -&gt; "Install App" or "Add to Home Screen".
                    </p>
                  )}
                </div>
              )}

              {/* Step-by-Step Installation Instructions */}
              <div className="pwa-instructions-section">
                <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>📖 Installation Instructions for Your Browser</span>
                </h4>

                <div className="pwa-instructions-list">
                  {/* Desktop Chrome / Edge */}
                  <div className={`pwa-step-box ${browserType === "chrome" || browserType === "edge" || browserType === "other" ? "active-step" : ""}`}>
                    <div className="pwa-step-header">
                      <span>💻 Desktop (Chrome / Edge / Brave / Opera)</span>
                      {(browserType === "chrome" || browserType === "edge" || browserType === "other") && <span className="pwa-detected-tag">Detected</span>}
                    </div>
                    <ol className="pwa-steps">
                      <li>Look for the <strong>Install icon (⊕ or 💻)</strong> at the right end of your browser's address bar.</li>
                      <li>Or click the browser <strong>Menu (⋮)</strong> -&gt; <strong>Cast, save and share</strong> -&gt; <strong>Install page as app...</strong></li>
                      <li>Click <strong>Install</strong> to add to your desktop &amp; start menu.</li>
                    </ol>
                  </div>

                  {/* Android Chrome */}
                  <div className={`pwa-step-box ${browserType === "android" ? "active-step" : ""}`}>
                    <div className="pwa-step-header">
                      <span>🤖 Android (Chrome / Edge / Firefox)</span>
                      {browserType === "android" && <span className="pwa-detected-tag">Detected</span>}
                    </div>
                    <ol className="pwa-steps">
                      <li>Tap the <strong>Menu (⋮)</strong> icon in the top right corner.</li>
                      <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                      <li>Confirm to add the app icon directly to your phone's home screen.</li>
                    </ol>
                  </div>

                  {/* iOS Safari */}
                  <div className={`pwa-step-box ${browserType === "ios" ? "active-step" : ""}`}>
                    <div className="pwa-step-header">
                      <span>🍎 iPhone / iPad (Safari)</span>
                      {browserType === "ios" && <span className="pwa-detected-tag">Detected</span>}
                    </div>
                    <ol className="pwa-steps">
                      <li>Tap the <strong>Share button</strong> <span style={{ fontSize: "1.1rem" }}>⎋</span> at the bottom of Safari.</li>
                      <li>Scroll down the menu and tap <strong>"Add to Home Screen"</strong> <span style={{ fontSize: "1.1rem" }}>➕</span>.</li>
                      <li>Tap <strong>Add</strong> in the upper right corner to complete installation.</li>
                    </ol>
                  </div>
                </div>
              </div>

              <hr style={{ margin: "1.25rem 0", borderColor: "var(--border-color)", opacity: 0.5 }} />

              {/* Features Summary */}
              <div className="pwa-features-grid">
                <div className="pwa-feature-card">
                  <div className="pwa-feature-icon">⚡</div>
                  <div>
                    <h5>Offline Emergency Protocols</h5>
                    <p>Access emergency numbers and society contacts even when internet is disconnected.</p>
                  </div>
                </div>

                <div className="pwa-feature-card">
                  <div className="pwa-feature-icon">🚨</div>
                  <div>
                    <h5>1-Tap Home Launcher</h5>
                    <p>Instant SOS panic dispatch directly from your desktop or phone home screen.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Service Worker Status: <strong style={{ color: "var(--success-green)" }}>Active &amp; Pre-cached</strong>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCopyLink}
                  style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                >
                  {copied ? "✓ Link Copied!" : "📋 Copy App Link"}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowGuideModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PwaInstallPrompt;
