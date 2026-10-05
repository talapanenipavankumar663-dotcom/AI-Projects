export const Theme = {
  colors: {
    // ── Backgrounds ──────────────────────────────────────────────
    background: '#F5F7FA',       // Soft cool white — main screen BG
    surface: '#FFFFFF',          // Pure white cards/panels
    surfaceLight: '#EEF2F7',     // Very light blue-grey for nested fields

    // ── Brand Colors ─────────────────────────────────────────────
    primary: '#4F46E5',          // Indigo 600 — strong, trustworthy
    primaryLight: '#6366F1',     // Indigo 500 — softer accent
    secondary: '#0891B2',        // Cyan 600 — info / secondary actions

    // ── Text ─────────────────────────────────────────────────────
    text: '#111827',             // Near-black — high contrast on white
    textSecondary: '#6B7280',    // Cool grey — subdued info

    // ── Borders ──────────────────────────────────────────────────
    border: '#E2E8F0',           // Slate 200 — subtle card borders

    // ── Accent ───────────────────────────────────────────────────
    accent: '#DB2777',           // Pink 600

    // ── Status / Emergency Colors ────────────────────────────────
    emergencyCritical: '#DC2626', // Red 600
    emergencyWarning: '#EA580C',  // Orange 600
    emergencyMedium: '#CA8A04',   // Yellow 600
    success: '#059669',           // Emerald 600
    info: '#2563EB',              // Blue 600
  },
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      display: 32,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  roundness: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
  },
};

export type ITheme = typeof Theme;
