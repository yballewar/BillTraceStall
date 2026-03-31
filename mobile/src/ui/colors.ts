/**
 * Light theme - clean, professional with good background
 * 2026 standards
 */

export const colors = {
  // Base backgrounds - soft, warm light
  bg: '#F8FAFC',
  bgSecondary: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F8FAFC',

  // Borders
  border: 'rgba(0,0,0,0.06)',
  borderStrong: 'rgba(0,0,0,0.12)',
  borderFocus: 'rgba(99,102,241,0.5)',

  // Text hierarchy (dark on light)
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textFaint: '#94A3B8',

  // Primary - Indigo
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primarySoft: 'rgba(99,102,241,0.12)',

  // Success - Emerald
  success: '#10B981',
  successDark: '#059669',
  successLight: '#34D399',
  successSoft: 'rgba(16,185,129,0.12)',

  // Warning - Amber
  warning: '#F59E0B',
  warningDark: '#D97706',
  warningLight: '#FBBF24',
  warningSoft: 'rgba(245,158,11,0.12)',

  // Danger - Rose/Red
  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerLight: '#F87171',
  dangerSoft: 'rgba(239,68,68,0.12)',

  // Info - Sky blue
  info: '#0EA5E9',
  infoDark: '#0284C7',
  infoLight: '#38BDF8',
  infoSoft: 'rgba(14,165,233,0.12)',

  // Accent - Teal
  accent: '#14B8A6',
  accentDark: '#0D9488',
  accentLight: '#2DD4BF',

  // Purple - Office
  purple: '#8B5CF6',
  purpleDark: '#7C3AED',
  purpleLight: '#A78BFA',
  purpleSoft: 'rgba(139,92,246,0.12)',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',

  // Role accents
  stall: '#F59E0B',
  office: '#6366F1',
  delivery: '#10B981',
} as const;

export const gradients = {
  primary: ['#6366F1', '#8B5CF6'] as const,
  success: ['#10B981', '#14B8A6'] as const,
  warning: ['#F59E0B', '#FBBF24'] as const,
  danger: ['#EF4444', '#F87171'] as const,
  info: ['#0EA5E9', '#38BDF8'] as const,
  sunset: ['#F472B6', '#F59E0B'] as const,
  ocean: ['#0EA5E9', '#6366F1'] as const,
  night: ['#1E293B', '#0F172A'] as const,
  cardGlow: ['rgba(99,102,241,0.1)', 'rgba(139,92,246,0.05)'] as const,
} as const;
