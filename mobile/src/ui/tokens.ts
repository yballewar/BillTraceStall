/**
 * Design tokens - 2026 standards
 * Generous spacing, smooth radius, elevation
 */

export const tokens = {
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    pill: 999,
    full: 9999,
  },
  space: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  text: {
    xs: 12,
    sm: 14,
    md: 14,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
  },
  shadow: {
    sm: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 2 },
    md: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    lg: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16 },
  },
} as const;
