/**
 * Light theme - clean, professional with good background
 * 2026 standards
 */

export const colors = {
  // Base backgrounds - tea theme
  bg: '#F2F0ED',
  bgSecondary: '#EEE8E0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F8F4EF',

  // Borders
  border: 'rgba(79,45,15,0.12)',
  borderStrong: 'rgba(79,45,15,0.24)',
  borderFocus: 'rgba(107,53,8,0.45)',

  // Text hierarchy (dark on light)
  text: '#4F2D0F',
  textSecondary: '#5E4025',
  textMuted: '#7F6D5D',
  textFaint: '#9A8B7E',

  // Primary - Tea brown
  primary: '#6B3508',
  primaryDark: '#5B2E08',
  primaryLight: '#8B571F',
  primarySoft: 'rgba(107,53,8,0.14)',

  // Success - Emerald
  success: '#10B981',
  successDark: '#059669',
  successLight: '#34D399',
  successSoft: 'rgba(16,185,129,0.12)',

  // Warning - Tan
  warning: '#C99359',
  warningDark: '#B88145',
  warningLight: '#D6A064',
  warningSoft: 'rgba(201,147,89,0.15)',

  // Danger - Rose/Red
  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerLight: '#F87171',
  dangerSoft: 'rgba(239,68,68,0.12)',

  // Info - warm neutral accent
  info: '#8E5F32',
  infoDark: '#7A5028',
  infoLight: '#A97844',
  infoSoft: 'rgba(142,95,50,0.15)',

  // Accent - warm muted
  accent: '#A97844',
  accentDark: '#8E5F32',
  accentLight: '#C99359',

  // Purple replacement for theme consistency
  purple: '#8E5F32',
  purpleDark: '#7A5028',
  purpleLight: '#B08150',
  purpleSoft: 'rgba(142,95,50,0.15)',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',

  // Role accents
  stall: '#C99359',
  office: '#8E5F32',
  delivery: '#6B3508',
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
