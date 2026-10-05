import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";

/**
 * Continuous Live Escalation Countdown Timer Component
 * Calculates elapsed wall-clock time from alert.created_at / persistent timestamp.
 * Never resets on tab switches, re-renders, role changes, or account switches!
 */
export function EscalationTimer({ alert, onTimeout }) {
  const { t } = useLanguage();
  const timeoutPerStep = 20; // Matches ESCALATION_TIMEOUT_SECONDS in backend/.env

  const escalationTiers = [
    { level: 1, name: t("tier1"), icon: "🚨", color: "#F59E0B" },
    { level: 2, name: t("tier2"), icon: "🤝", color: "#10B981" },
    { level: 3, name: t("tier3"), icon: "📞", color: "#EC4899" },
    { level: 4, name: t("tier4"), icon: "🛡️", color: "#6366F1" },
    { level: 5, name: "Remaining Contacts", icon: "📞", color: "#6366F1" },
  ];

  // Get or persist exact start timestamp for this alert ID
  const getAlertStartTime = (alertObj) => {
    if (!alertObj) return Date.now();
    const alertKey = `sos_start_ts_${alertObj.id}`;
    let savedTime = localStorage.getItem(alertKey);
    if (!savedTime) {
      const parsed = alertObj.created_at ? new Date(alertObj.created_at).getTime() : Date.now();
      savedTime = isNaN(parsed) || parsed > Date.now() ? Date.now() : parsed;
      localStorage.setItem(alertKey, savedTime.toString());
    }
    return parseInt(savedTime, 10);
  };

  const calculateTimer = useCallback(() => {
    if (!alert) return { level: 1, remaining: timeoutPerStep };
    const startTime = getAlertStartTime(alert);
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));

    const elapsedLevel = Math.min(5, Math.floor(elapsedSeconds / timeoutPerStep) + 1);
    const level = Math.min(5, Math.max(elapsedLevel, Number(alert.current_escalation_step) || 1));
    const secondsInCurrentStep = elapsedSeconds % timeoutPerStep;
    const remaining = (level >= 5 && elapsedSeconds >= 5 * timeoutPerStep)
      ? 0
      : timeoutPerStep - secondsInCurrentStep;

    return { level, remaining };
  }, [alert]);

  const [timerState, setTimerState] = useState(calculateTimer);
  const isStopped = !alert || alert.status === "Assigned" || alert.status === "Resolved" || alert.status === "Closed";

  const alertId = alert?.id;
  const alertStatus = alert?.status;
  const alertCreatedAt = alert?.created_at;

  useEffect(() => {
    if (isStopped) return;

    // Continuous 1-second ticker using real wall-clock time
    const interval = setInterval(() => {
      const updated = calculateTimer();
      setTimerState(updated);
      if (onTimeout && updated.level !== timerState.level) {
        onTimeout(updated.level);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alertId, alertStatus, alertCreatedAt, isStopped, calculateTimer, onTimeout, timerState.level]);

  const currentLevel = timerState.level;
  const timeLeft = timerState.remaining;
  const activeTier = escalationTiers.find((t) => t.level === currentLevel) || escalationTiers[escalationTiers.length - 1];
  const progressPercent = ((timeoutPerStep - timeLeft) / timeoutPerStep) * 100;

  if (isStopped || !alert || alert.status !== "Open") {
    return (
      <div style={{
        background: "rgba(16, 185, 129, 0.1)",
        border: "1px solid #10B981",
        borderRadius: "12px",
        padding: "0.85rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.4rem" }}>✅</span>
          <div>
            <div style={{ fontWeight: "700", color: "#10B981", fontSize: "0.95rem" }}>
              {alert?.status === "Assigned" ? t("acceptedByResponder") : "ESCALATION COMPLETED / STOPPED"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {alert?.assigned_responder ? `Assigned to ${alert.assigned_responder.first_name}` : "Emergency escalation assigned or resolved."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="escalation-timer-card" style={{
      background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(99, 102, 241, 0.12))",
      border: "2px solid #EF4444",
      borderRadius: "16px",
      padding: "1.25rem",
      marginTop: "1.25rem",
      boxShadow: "0 4px 20px rgba(239, 68, 68, 0.18)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{
            fontSize: "1.3rem",
            animation: "pulse 1.2s infinite"
          }}>⏱️</span>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#EF4444", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {t("liveCountdownTitle")}
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: "600", color: activeTier.color }}>
              Tier {currentLevel} of 5: {activeTier.icon} {activeTier.name}
            </span>
          </div>
        </div>

        {/* Giant Countdown Seconds Badge */}
        <div style={{
          background: "#EF4444",
          color: "white",
          borderRadius: "12px",
          padding: "0.4rem 1rem",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(239, 68, 68, 0.4)"
        }}>
          <div style={{ fontSize: "1.4rem", fontWeight: "900", fontFamily: "monospace", lineHeight: 1 }}>
            00:{timeLeft.toString().padStart(2, "0")}
          </div>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: "700", marginTop: "2px" }}>
            {t("secsToNextTier")}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: "8px",
        background: "rgba(255, 255, 255, 0.2)",
        borderRadius: "4px",
        overflow: "hidden",
        marginBottom: "1rem"
      }}>
        <div style={{
          height: "100%",
          width: `${100 - progressPercent}%`,
          background: "linear-gradient(90deg, #EF4444, #F59E0B)",
          transition: "width 1s linear"
        }}></div>
      </div>

      {/* Tier Stepper Line */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
        {escalationTiers.map((tier) => {
          const isPassed = tier.level < currentLevel;
          const isCurrent = tier.level === currentLevel;

          return (
            <div key={tier.level} style={{ textAlign: "center", flex: 1, position: "relative", zIndex: 2 }}>
              <div style={{
                width: isCurrent ? "32px" : "24px",
                height: isCurrent ? "32px" : "24px",
                borderRadius: "50%",
                background: isPassed ? "#10B981" : isCurrent ? "#EF4444" : "var(--surface-card)",
                border: `2px solid ${isCurrent ? "#EF4444" : isPassed ? "#10B981" : "var(--border-color)"}`,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 0.35rem",
                fontSize: isCurrent ? "0.9rem" : "0.75rem",
                fontWeight: "800",
                boxShadow: isCurrent ? "0 0 12px rgba(239, 68, 68, 0.6)" : "none",
                transition: "all 0.3s"
              }}>
                {isPassed ? "✓" : tier.icon}
              </div>
              <div style={{
                fontSize: "0.7rem",
                fontWeight: isCurrent ? "800" : "600",
                color: isCurrent ? "#EF4444" : isPassed ? "#10B981" : "var(--text-muted)"
              }}>
                {tier.name.split(" ")[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EscalationTimer;
