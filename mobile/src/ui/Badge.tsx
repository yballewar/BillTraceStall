import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from './colors';
import { tokens } from './tokens';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

export function Badge(props: PropsWithChildren<{ tone?: BadgeTone; style?: ViewStyle }>) {
  const tone = props.tone ?? 'neutral';
  return (
    <View style={[styles.base, toneStyles[tone], props.style]}>
      <Text style={[styles.text, toneText[tone]]}>{props.children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: tokens.text.sm, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
});

const toneStyles: Record<BadgeTone, ViewStyle> = {
  neutral: {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.borderStrong,
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  info: {
    backgroundColor: colors.infoSoft,
    borderColor: 'rgba(14,165,233,0.4)',
  },
  purple: {
    backgroundColor: colors.purpleSoft,
    borderColor: 'rgba(139,92,246,0.4)',
  },
};

const toneText: Record<BadgeTone, { color: string }> = {
  neutral: { color: colors.textMuted },
  success: { color: colors.successDark },
  warning: { color: colors.warningDark },
  danger: { color: colors.dangerDark },
  info: { color: colors.infoDark },
  purple: { color: colors.purpleDark },
};
