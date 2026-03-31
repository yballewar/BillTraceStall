import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { tokens } from './tokens';

export const typography = StyleSheet.create({
  h1: { fontSize: tokens.text.xxxl, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: tokens.text.xxl, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: tokens.text.xl, fontWeight: '700', color: colors.text },
  h4: { fontSize: tokens.text.lg, fontWeight: '700', color: colors.text },
  body: { fontSize: tokens.text.md, fontWeight: '500', color: colors.textSecondary, lineHeight: 22 },
  bodySmall: { fontSize: tokens.text.sm, fontWeight: '500', color: colors.textSecondary },
  muted: { fontSize: tokens.text.sm, fontWeight: '600', color: colors.textMuted },
  faint: { fontSize: tokens.text.sm, fontWeight: '500', color: colors.textFaint },
  label: { fontSize: tokens.text.xs, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  caption: { fontSize: tokens.text.xs, fontWeight: '500', color: colors.textFaint },
});
