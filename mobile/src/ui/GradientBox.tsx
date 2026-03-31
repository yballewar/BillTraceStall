import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from './colors';
import { tokens } from './tokens';

type GradientKey = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'ocean' | 'night' | 'cardGlow';

const gradientFallbacks: Record<GradientKey, string> = {
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  ocean: colors.info,
  night: colors.bg,
  cardGlow: colors.primary,
};

export function GradientBox(
  props: PropsWithChildren<{
    gradient?: GradientKey;
    colors?: readonly [string, string];
    style?: ViewStyle;
  }>
) {
  const bg = props.colors?.[0] ?? (props.gradient ? gradientFallbacks[props.gradient] : colors.primary);
  return (
    <View style={[styles.base, { backgroundColor: bg }, props.style]}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
  },
});
