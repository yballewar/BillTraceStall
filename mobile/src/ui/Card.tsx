import { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from './colors';
import { tokens } from './tokens';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'gradientBorder';

export function Card(
  props: PropsWithChildren<{
    style?: ViewStyle;
    variant?: CardVariant;
  }>
) {
  const variant = props.variant ?? 'default';
  return (
    <View style={[styles.card, variantStyles[variant], props.style]}>{props.children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...(Platform.OS === 'android'
      ? { elevation: 3 }
      : {
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.22,
          shadowRadius: 10,
          shadowColor: '#000',
        }),
  },
});

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {},
  elevated: {
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...(Platform.OS === 'android'
      ? { elevation: 6 }
      : {
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 14,
          shadowColor: '#000',
        }),
  },
  outlined: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  gradientBorder: {
    borderColor: colors.primary,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.white,
  },
};
